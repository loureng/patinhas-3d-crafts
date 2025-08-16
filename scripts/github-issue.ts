import { Octokit } from '@octokit/rest';
import * as dotenv from 'dotenv';
import { IssueDescription } from './gemini-issue.js';
import { ErrorDetails } from './error-crawler.js';

dotenv.config();

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{ name: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export class GitHubIssueManager {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN not found in environment variables');
    }

    this.owner = process.env.GITHUB_OWNER || 'loureng';
    this.repo = process.env.GITHUB_REPO || 'patinhas-3d-crafts';

    this.octokit = new Octokit({
      auth: token,
    });
  }

  async createIssue(issueData: IssueDescription, errorId: string): Promise<GitHubIssue | null> {
    console.log(`📝 Creating GitHub issue: ${issueData.title}`);

    try {
      // Check for duplicates first
      const isDuplicate = await this.checkForDuplicates(issueData.title, issueData.body);
      if (isDuplicate) {
        console.log(`⚠️ Duplicate issue detected, skipping creation`);
        return null;
      }

      const createOptions: CreateIssueOptions = {
        title: this.addErrorIdToTitle(issueData.title, errorId),
        body: issueData.body,
        labels: issueData.labels,
        assignees: issueData.assignee ? [issueData.assignee] : undefined
      };

      // Find milestone by name if specified
      if (issueData.milestone) {
        const milestone = await this.findMilestone(issueData.milestone);
        if (milestone) {
          (createOptions as any).milestone = milestone.number;
        }
      }

      const response = await this.octokit.rest.issues.create({
        owner: this.owner,
        repo: this.repo,
        ...createOptions
      });

      console.log(`✅ Issue created: #${response.data.number} - ${response.data.html_url}`);
      return response.data as GitHubIssue;
    } catch (error) {
      console.error('❌ Failed to create issue:', error);
      return null;
    }
  }

  async createMultipleIssues(
    descriptions: Map<string, IssueDescription>,
    errors: ErrorDetails[]
  ): Promise<Map<string, GitHubIssue | null>> {
    console.log(`📝 Creating ${descriptions.size} GitHub issues...`);
    
    const results = new Map<string, GitHubIssue | null>();
    const delay = 2000; // 2 seconds between requests to avoid rate limiting

    for (const [errorId, description] of descriptions) {
      try {
        const issue = await this.createIssue(description, errorId);
        results.set(errorId, issue);
        
        // Delay between requests
        if (results.size < descriptions.size) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.error(`Failed to create issue for error ${errorId}:`, error);
        results.set(errorId, null);
      }
    }

    return results;
  }

  async checkForDuplicates(title: string, body: string): Promise<boolean> {
    try {
      // Get issues from the last week to check for duplicates
      const daysAgo = parseInt(process.env.DUPLICATE_CHECK_DAYS || '7');
      const since = new Date();
      since.setDate(since.getDate() - daysAgo);

      // Search for similar issues
      const searchQueries = [
        this.extractKeywords(title),
        this.extractErrorContext(body)
      ].filter(Boolean);

      for (const query of searchQueries) {
        const searchResults = await this.octokit.rest.search.issuesAndPullRequests({
          q: `repo:${this.owner}/${this.repo} is:issue state:open ${query}`,
          sort: 'created',
          order: 'desc',
          per_page: 10
        });

        // Check for similar titles or content
        for (const issue of searchResults.data.items) {
          if (this.isSimilarIssue(title, body, issue.title, issue.body || '')) {
            console.log(`🔍 Found similar issue: #${issue.number} - ${issue.title}`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // Continue with creation if check fails
    }
  }

  private extractKeywords(title: string): string {
    // Extract meaningful keywords from title for search
    const keywords = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['erro', 'error', 'detectado', 'detected'].includes(word))
      .slice(0, 3)
      .join(' ');

    return keywords;
  }

  private extractErrorContext(body: string): string {
    // Extract URL or specific error patterns from body
    const urlMatch = body.match(/URL.*?(?:https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      return urlMatch[0];
    }

    const errorMatch = body.match(/Type:\s*(\w+)/i);
    if (errorMatch) {
      return errorMatch[1];
    }

    return '';
  }

  private isSimilarIssue(title1: string, body1: string, title2: string, body2: string): boolean {
    // Calculate similarity based on title and key content
    const titleSimilarity = this.calculateSimilarity(
      title1.toLowerCase(), 
      title2.toLowerCase()
    );

    if (titleSimilarity > 0.8) {
      return true;
    }

    // Check for same URL in body
    const url1 = this.extractUrlFromBody(body1);
    const url2 = this.extractUrlFromBody(body2);
    
    if (url1 && url2 && url1 === url2) {
      const bodySimilarity = this.calculateSimilarity(
        body1.toLowerCase().substring(0, 200),
        body2.toLowerCase().substring(0, 200)
      );
      
      return bodySimilarity > 0.6;
    }

    return false;
  }

  private extractUrlFromBody(body: string): string | null {
    const urlMatch = body.match(/https?:\/\/[^\s]+/);
    return urlMatch ? urlMatch[0] : null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private addErrorIdToTitle(title: string, errorId: string): string {
    const shortId = errorId.split('_')[1]?.substring(0, 6) || errorId.substring(0, 6);
    return `[${shortId}] ${title}`;
  }

  private async findMilestone(milestoneName: string): Promise<{number: number} | null> {
    try {
      const milestones = await this.octokit.rest.issues.listMilestones({
        owner: this.owner,
        repo: this.repo,
        state: 'open'
      });

      const milestone = milestones.data.find(m => 
        m.title.toLowerCase().includes(milestoneName.toLowerCase())
      );

      return milestone ? { number: milestone.number } : null;
    } catch (error) {
      console.error('Error finding milestone:', error);
      return null;
    }
  }

  async getExistingIssues(labels?: string[]): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'open',
        labels: labels?.join(','),
        per_page: 100,
        sort: 'created',
        direction: 'desc'
      });

      return response.data as GitHubIssue[];
    } catch (error) {
      console.error('Error fetching existing issues:', error);
      return [];
    }
  }

  async closeIssue(issueNumber: number, reason: string): Promise<boolean> {
    try {
      await this.octokit.rest.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        state: 'closed'
      });

      // Add closing comment
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: `🤖 **Fechado automaticamente**\n\n${reason}\n\n---\n*Sistema Autônomo de Detecção de Erros*`
      });

      console.log(`✅ Issue #${issueNumber} closed automatically`);
      return true;
    } catch (error) {
      console.error(`Failed to close issue #${issueNumber}:`, error);
      return false;
    }
  }

  async addCommentToIssue(issueNumber: number, comment: string): Promise<boolean> {
    try {
      await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body: comment
      });

      console.log(`💬 Comment added to issue #${issueNumber}`);
      return true;
    } catch (error) {
      console.error(`Failed to add comment to issue #${issueNumber}:`, error);
      return false;
    }
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      });
      
      console.log(`✅ Connected to repository: ${response.data.full_name}`);
      return true;
    } catch (error) {
      console.error('❌ GitHub connection test failed:', error);
      return false;
    }
  }

  // Get repository statistics
  async getRepositoryStats(): Promise<any> {
    try {
      const [repo, issues, pulls] = await Promise.all([
        this.octokit.rest.repos.get({ owner: this.owner, repo: this.repo }),
        this.octokit.rest.issues.listForRepo({ 
          owner: this.owner, 
          repo: this.repo, 
          state: 'open',
          per_page: 1 
        }),
        this.octokit.rest.pulls.list({ 
          owner: this.owner, 
          repo: this.repo, 
          state: 'open',
          per_page: 1 
        })
      ]);

      return {
        name: repo.data.full_name,
        description: repo.data.description,
        stars: repo.data.stargazers_count,
        forks: repo.data.forks_count,
        openIssues: repo.data.open_issues_count,
        language: repo.data.language,
        private: repo.data.private
      };
    } catch (error) {
      console.error('Error fetching repository stats:', error);
      return null;
    }
  }
}

// CLI usage for testing
if (require.main === module) {
  (async () => {
    try {
      const manager = new GitHubIssueManager();
      
      // Test connection
      const connected = await manager.testConnection();
      if (!connected) {
        console.error('Please check your GITHUB_TOKEN and repository configuration');
        process.exit(1);
      }

      // Get repo stats
      const stats = await manager.getRepositoryStats();
      if (stats) {
        console.log('\n📊 Repository Stats:');
        console.log(`  Name: ${stats.name}`);
        console.log(`  Language: ${stats.language}`);
        console.log(`  Open Issues: ${stats.openIssues}`);
        console.log(`  Stars: ${stats.stars}`);
      }

      // Get existing error-detection issues
      const existingIssues = await manager.getExistingIssues(['error-detection']);
      console.log(`\n🐛 Existing error-detection issues: ${existingIssues.length}`);

      console.log('\n✅ GitHub integration test completed successfully');
    } catch (error) {
      console.error('GitHub integration test failed:', error);
      process.exit(1);
    }
  })();
}