#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ErrorCrawler, ErrorDetails, CrawlerOptions } from './error-crawler.js';
import { GeminiIssueGenerator, IssueDescription } from './gemini-issue.js';
import { GitHubIssueManager, GitHubIssue } from './github-issue.js';

dotenv.config();

export interface AutoIssueOptions {
  baseUrl?: string;
  maxPages?: number;
  maxErrors?: number;
  dryRun?: boolean;
  saveReports?: boolean;
  reportsPath?: string;
  skipDuplicateCheck?: boolean;
  includeScreenshots?: boolean;
  debugMode?: boolean;
}

export interface ExecutionReport {
  startTime: string;
  endTime: string;
  duration: number;
  errors: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  issues: {
    created: number;
    skipped: number;
    failed: number;
  };
  summary: string[];
  failed: string[];
  details: Array<{
    errorId: string;
    error: ErrorDetails;
    description?: IssueDescription;
    issue?: GitHubIssue;
    status: 'created' | 'skipped' | 'failed';
    reason?: string;
  }>;
}

export class AutoIssueSystem {
  private crawler: ErrorCrawler;
  private gemini: GeminiIssueGenerator;
  private github: GitHubIssueManager;
  private options: Required<AutoIssueOptions>;

  constructor(options: AutoIssueOptions = {}) {
    this.options = {
      baseUrl: options.baseUrl || process.env.BASE_URL || 'http://localhost:5173',
      maxPages: options.maxPages || 50,
      maxErrors: options.maxErrors || parseInt(process.env.MAX_ERRORS_PER_RUN || '50'),
      dryRun: options.dryRun || false,
      saveReports: options.saveReports || true,
      reportsPath: options.reportsPath || './reports',
      skipDuplicateCheck: options.skipDuplicateCheck || false,
      includeScreenshots: options.includeScreenshots || true,
      debugMode: options.debugMode || process.env.DEBUG_MODE === 'true'
    };

    // Initialize components
    this.crawler = new ErrorCrawler({
      baseUrl: this.options.baseUrl,
      maxPages: this.options.maxPages,
      saveScreenshots: this.options.includeScreenshots,
      debugMode: this.options.debugMode
    });

    this.gemini = new GeminiIssueGenerator();
    this.github = new GitHubIssueManager();

    // Ensure reports directory exists
    if (this.options.saveReports && !existsSync(this.options.reportsPath)) {
      mkdirSync(this.options.reportsPath, { recursive: true });
    }
  }

  async execute(): Promise<ExecutionReport> {
    const startTime = new Date();
    console.log('🚀 Starting Autonomous Error Detection System...');
    console.log(`⏰ Start time: ${startTime.toLocaleString('pt-BR')}`);
    console.log(`🌐 Target: ${this.options.baseUrl}`);
    console.log(`🔧 Mode: ${this.options.dryRun ? 'DRY RUN' : 'PRODUCTION'}`);

    const report: ExecutionReport = {
      startTime: startTime.toISOString(),
      endTime: '',
      duration: 0,
      errors: {
        total: 0,
        byType: {},
        bySeverity: {}
      },
      issues: {
        created: 0,
        skipped: 0,
        failed: 0
      },
      summary: [],
      failed: [],
      details: []
    };

    try {
      // Step 1: Health checks
      await this.performHealthChecks();

      // Step 2: Crawl for errors
      console.log('\n📡 Phase 1: Error Detection');
      const errors = await this.detectErrors();
      report.errors.total = errors.length;

      if (errors.length === 0) {
        console.log('🎉 No errors detected! Site is healthy.');
        report.summary.push('No errors detected - site is healthy');
        return this.finalizeReport(report, startTime);
      }

      // Step 3: Analyze errors and generate descriptions
      console.log(`\n🤖 Phase 2: AI Analysis (${errors.length} errors)`);
      const descriptions = await this.generateDescriptions(errors);

      // Step 4: Create GitHub issues
      console.log(`\n📝 Phase 3: GitHub Integration`);
      await this.createIssues(errors, descriptions, report);

      // Step 5: Generate summary
      this.generateSummary(report, errors);

    } catch (error) {
      console.error('❌ System execution failed:', error);
      report.failed.push(`System execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return this.finalizeReport(report, startTime);
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Performing health checks...');

    // Check Gemini connection
    const geminiOk = await this.gemini.testConnection();
    if (!geminiOk) {
      throw new Error('Gemini AI connection failed. Check GEMINI_API_KEY.');
    }
    console.log('✅ Gemini AI: Connected');

    // Check GitHub connection
    const githubOk = await this.github.testConnection();
    if (!githubOk) {
      throw new Error('GitHub connection failed. Check GITHUB_TOKEN and repository settings.');
    }
    console.log('✅ GitHub API: Connected');

    // Check target website
    try {
      const response = await fetch(this.options.baseUrl);
      if (!response.ok) {
        throw new Error(`Website returned ${response.status}`);
      }
      console.log('✅ Target Website: Accessible');
    } catch (error) {
      console.warn(`⚠️ Warning: Target website check failed: ${error}`);
      console.log('ℹ️ Continuing anyway - might be a localhost issue');
    }
  }

  private async detectErrors(): Promise<ErrorDetails[]> {
    const errors = await this.crawler.start();
    
    // Limit errors to maxErrors
    const limitedErrors = errors.slice(0, this.options.maxErrors);
    
    if (errors.length > this.options.maxErrors) {
      console.log(`⚠️ Limited errors to ${this.options.maxErrors} (found ${errors.length} total)`);
    }

    // Log error statistics
    const byType = limitedErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = limitedErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Error Analysis:');
    console.log('By Type:', byType);
    console.log('By Severity:', bySeverity);

    return limitedErrors;
  }

  private async generateDescriptions(errors: ErrorDetails[]): Promise<Map<string, IssueDescription>> {
    const descriptions = await this.gemini.generateBatchDescriptions(errors);
    
    console.log(`✅ Generated ${descriptions.size} issue descriptions`);
    
    return descriptions;
  }

  private async createIssues(
    errors: ErrorDetails[], 
    descriptions: Map<string, IssueDescription>, 
    report: ExecutionReport
  ): Promise<void> {
    if (this.options.dryRun) {
      console.log('🧪 DRY RUN: Would create issues for the following errors:');
      
      for (const error of errors) {
        const description = descriptions.get(error.id);
        if (description) {
          console.log(`  • [${error.severity}] ${description.title}`);
          report.details.push({
            errorId: error.id,
            error,
            description,
            status: 'skipped',
            reason: 'Dry run mode'
          });
          report.issues.skipped++;
        }
      }
      
      return;
    }

    // Create issues in production mode
    const results = await this.github.createMultipleIssues(descriptions, errors);
    
    for (const [errorId, issue] of results) {
      const error = errors.find(e => e.id === errorId)!;
      const description = descriptions.get(errorId)!;
      
      if (issue) {
        console.log(`✅ Created issue #${issue.number}: ${issue.title}`);
        report.details.push({
          errorId,
          error,
          description,
          issue,
          status: 'created'
        });
        report.issues.created++;
      } else {
        console.log(`⚠️ Skipped creating issue for error ${errorId} (likely duplicate)`);
        report.details.push({
          errorId,
          error,
          description,
          status: 'skipped',
          reason: 'Duplicate or creation failed'
        });
        report.issues.skipped++;
      }
    }
  }

  private generateSummary(report: ExecutionReport, errors: ErrorDetails[]): void {
    // Count errors by type and severity
    errors.forEach(error => {
      report.errors.byType[error.type] = (report.errors.byType[error.type] || 0) + 1;
      report.errors.bySeverity[error.severity] = (report.errors.bySeverity[error.severity] || 0) + 1;
    });

    // Generate summary messages
    const critical = report.errors.bySeverity.critical || 0;
    const high = report.errors.bySeverity.high || 0;
    
    if (critical > 0) {
      report.summary.push(`🚨 ${critical} CRITICAL errors found!`);
    }
    
    if (high > 0) {
      report.summary.push(`⚠️ ${high} HIGH priority errors found`);
    }

    if (report.issues.created > 0) {
      report.summary.push(`📝 Created ${report.issues.created} GitHub issues`);
    }

    if (report.issues.skipped > 0) {
      report.summary.push(`⏭️ Skipped ${report.issues.skipped} issues (duplicates or dry run)`);
    }

    const topErrorTypes = Object.entries(report.errors.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    if (topErrorTypes) {
      report.summary.push(`🔍 Top error types: ${topErrorTypes}`);
    }
  }

  private finalizeReport(report: ExecutionReport, startTime: Date): ExecutionReport {
    const endTime = new Date();
    report.endTime = endTime.toISOString();
    report.duration = endTime.getTime() - startTime.getTime();

    console.log('\n🏁 Execution Complete');
    console.log(`⏱️ Duration: ${Math.round(report.duration / 1000)}s`);
    console.log(`📊 Summary:`);
    report.summary.forEach(summary => console.log(`  ${summary}`));

    if (report.failed.length > 0) {
      console.log(`❌ Failures:`);
      report.failed.forEach(failure => console.log(`  ${failure}`));
    }

    // Save report to file
    if (this.options.saveReports) {
      this.saveReport(report);
    }

    return report;
  }

  private saveReport(report: ExecutionReport): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `error-detection-report-${timestamp}.json`;
    const filepath = join(this.options.reportsPath, filename);
    
    writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved: ${filepath}`);

    // Also save a summary text file
    const summaryFilename = `summary-${timestamp}.txt`;
    const summaryFilepath = join(this.options.reportsPath, summaryFilename);
    
    const summaryText = `
# Autonomous Error Detection Report
Generated: ${new Date(report.startTime).toLocaleString('pt-BR')}
Duration: ${Math.round(report.duration / 1000)}s

## Summary
${report.summary.join('\n')}

## Statistics
- Total Errors: ${report.errors.total}
- Issues Created: ${report.issues.created}
- Issues Skipped: ${report.issues.skipped}
- Issues Failed: ${report.issues.failed}

## Errors by Type
${Object.entries(report.errors.byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

## Errors by Severity
${Object.entries(report.errors.bySeverity).map(([severity, count]) => `- ${severity}: ${count}`).join('\n')}

${report.failed.length > 0 ? `## Failures\n${report.failed.join('\n')}` : ''}
`.trim();

    writeFileSync(summaryFilepath, summaryText);
    console.log(`📋 Summary saved: ${summaryFilepath}`);
  }

  // Static method for easy CLI usage
  static async run(options?: AutoIssueOptions): Promise<ExecutionReport> {
    const system = new AutoIssueSystem(options);
    return await system.execute();
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      // Parse command line arguments
      const args = process.argv.slice(2);
      const options: AutoIssueOptions = {};

      for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
          case '--dry-run':
            options.dryRun = true;
            break;
          case '--debug':
            options.debugMode = true;
            break;
          case '--no-screenshots':
            options.includeScreenshots = false;
            break;
          case '--url':
            options.baseUrl = args[++i];
            break;
          case '--max-pages':
            options.maxPages = parseInt(args[++i]);
            break;
          case '--max-errors':
            options.maxErrors = parseInt(args[++i]);
            break;
          case '--help':
            console.log(`
🤖 Autonomous Error Detection System

Usage: node auto-issue.js [options]

Options:
  --dry-run             Run without creating GitHub issues
  --debug              Enable debug mode with verbose logging
  --no-screenshots     Disable screenshot capture
  --url <url>          Target website URL (default: from .env)
  --max-pages <n>      Maximum pages to crawl (default: 50)
  --max-errors <n>     Maximum errors to process (default: 50)
  --help               Show this help message

Environment Variables:
  GITHUB_TOKEN         GitHub personal access token (required)
  GEMINI_API_KEY       Google Gemini API key (required)
  BASE_URL             Target website URL
  DEBUG_MODE           Enable debug mode (true/false)

Examples:
  npm run auto-issue                    # Full run with default settings
  npm run auto-issue -- --dry-run       # Test run without creating issues
  npm run auto-issue -- --debug         # Run with debug logging
  npm run auto-issue -- --url http://localhost:3000 --max-pages 10
            `);
            process.exit(0);
        }
      }

      console.log('🤖 Jardim das Patinhas - Autonomous Error Detection System');
      console.log('=' .repeat(60));

      const report = await AutoIssueSystem.run(options);
      
      // Exit with appropriate code
      const hasErrors = report.errors.total > 0;
      const hasCritical = (report.errors.bySeverity.critical || 0) > 0;
      
      if (hasCritical) {
        console.log('\n🚨 CRITICAL errors detected - immediate attention required!');
        process.exit(2);
      } else if (hasErrors) {
        console.log('\n⚠️ Errors detected - review and fix when possible');
        process.exit(1);
      } else {
        console.log('\n🎉 No errors detected - site is healthy!');
        process.exit(0);
      }
    } catch (error) {
      console.error('\n💥 System failed:', error);
      process.exit(3);
    }
  })();
}