import { chromium, Page, Browser, Response } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export interface ErrorDetails {
  id: string;
  type: 'page_not_found' | 'invalid_redirect' | 'dead_click' | 'js_error' | 'api_error' | 'rendering_error' | 'console_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  message: string;
  details: Record<string, any>;
  timestamp: string;
  screenshot?: string;
  stackTrace?: string;
}

export interface CrawlerOptions {
  baseUrl: string;
  maxPages: number;
  timeout: number;
  saveScreenshots: boolean;
  screenshotPath: string;
  debugMode: boolean;
}

export class ErrorCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private errors: ErrorDetails[] = [];
  private visitedUrls: Set<string> = new Set();
  private urlsToVisit: string[] = [];
  private options: CrawlerOptions;

  constructor(options: Partial<CrawlerOptions> = {}) {
    this.options = {
      baseUrl: process.env.BASE_URL || 'http://localhost:5173',
      maxPages: 50,
      timeout: parseInt(process.env.CRAWLER_TIMEOUT_MS || '30000'),
      saveScreenshots: process.env.SAVE_SCREENSHOTS === 'true',
      screenshotPath: process.env.SCREENSHOT_PATH || './screenshots',
      debugMode: process.env.DEBUG_MODE === 'true',
      ...options
    };

    if (this.options.saveScreenshots && !existsSync(this.options.screenshotPath)) {
      mkdirSync(this.options.screenshotPath, { recursive: true });
    }
  }

  async start(): Promise<ErrorDetails[]> {
    console.log('🚀 Starting Error Crawler...');
    console.log(`📍 Base URL: ${this.options.baseUrl}`);
    console.log(`📊 Max Pages: ${this.options.maxPages}`);
    
    try {
      await this.setupBrowser();
      await this.discoverUrls();
      await this.crawlPages();
      
      console.log(`✅ Crawling completed. Found ${this.errors.length} errors.`);
      return this.errors;
    } catch (error) {
      console.error('❌ Crawler failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async setupBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Setup error listeners
    this.setupErrorListeners();
  }

  private setupErrorListeners(): void {
    if (!this.page) return;

    // JavaScript errors
    this.page.on('pageerror', (error) => {
      this.addError({
        type: 'js_error',
        severity: 'high',
        message: `JavaScript Error: ${error.message}`,
        details: {
          error: error.toString(),
          stack: error.stack
        },
        stackTrace: error.stack
      });
    });

    // Console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.addError({
          type: 'console_error',
          severity: 'medium',
          message: `Console Error: ${msg.text()}`,
          details: {
            consoleMessage: msg.text(),
            type: msg.type()
          }
        });
      }
    });

    // Network errors
    this.page.on('response', (response: Response) => {
      if (response.status() >= 400) {
        const severity = response.status() >= 500 ? 'high' : 'medium';
        this.addError({
          type: response.status() === 404 ? 'page_not_found' : 'api_error',
          severity,
          message: `HTTP ${response.status()}: ${response.url()}`,
          details: {
            status: response.status(),
            statusText: response.statusText(),
            requestUrl: response.url(),
            headers: response.headers()
          }
        });
      }
    });

    // Request failures
    this.page.on('requestfailed', (request) => {
      this.addError({
        type: 'api_error',
        severity: 'high',
        message: `Request Failed: ${request.url()}`,
        details: {
          url: request.url(),
          method: request.method(),
          failure: request.failure()?.errorText || 'Unknown error'
        }
      });
    });
  }

  private async discoverUrls(): Promise<void> {
    console.log('🔍 Discovering URLs...');
    
    try {
      await this.page!.goto(this.options.baseUrl, { 
        waitUntil: 'networkidle',
        timeout: this.options.timeout 
      });

      // Extract all links from the page
      const links = await this.page!.evaluate((baseUrl) => {
        const links: string[] = [];
        const anchors = document.querySelectorAll('a[href]');
        
        anchors.forEach((anchor) => {
          const href = anchor.getAttribute('href');
          if (href) {
            let url = href;
            // Convert relative URLs to absolute
            if (href.startsWith('/')) {
              url = baseUrl + href;
            } else if (href.startsWith('./')) {
              url = baseUrl + href.substring(1);
            } else if (!href.startsWith('http')) {
              url = baseUrl + '/' + href;
            }
            
            // Only include URLs from the same domain
            if (url.includes(baseUrl.replace(/https?:\/\//, ''))) {
              links.push(url);
            }
          }
        });
        
        return [...new Set(links)]; // Remove duplicates
      }, this.options.baseUrl);

      // Add common routes that might not be linked
      const commonRoutes = [
        '/',
        '/produtos',
        '/carrinho',
        '/checkout',
        '/auth',
        '/conta',
        '/personalizacao',
        '/blog',
        '/admin',
        '/admin/dashboard',
        '/admin/products',
        '/admin/orders',
        '/tracking',
        '/payment/success',
        '/payment/pending',
        '/payment/failure',
        '/404-test-page', // Intentional 404 for testing
        '/nonexistent-route' // Another 404 test
      ];

      commonRoutes.forEach(route => {
        const fullUrl = this.options.baseUrl + route;
        if (!links.includes(fullUrl)) {
          links.push(fullUrl);
        }
      });

      this.urlsToVisit = links.slice(0, this.options.maxPages);
      console.log(`📝 Found ${this.urlsToVisit.length} URLs to crawl`);
      
      if (this.options.debugMode) {
        console.log('URLs to visit:', this.urlsToVisit);
      }
    } catch (error) {
      console.error('Error discovering URLs:', error);
      this.urlsToVisit = [this.options.baseUrl]; // Fallback to base URL only
    }
  }

  private async crawlPages(): Promise<void> {
    console.log('🕷️ Starting page crawling...');
    
    for (const url of this.urlsToVisit) {
      if (this.visitedUrls.has(url)) continue;
      
      console.log(`🌐 Crawling: ${url}`);
      
      try {
        await this.crawlPage(url);
        this.visitedUrls.add(url);
        
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error crawling ${url}:`, error);
        this.addError({
          type: 'rendering_error',
          severity: 'medium',
          message: `Failed to crawl page: ${url}`,
          details: {
            error: error instanceof Error ? error.message : String(error),
            url
          }
        });
      }
    }
  }

  private async crawlPage(url: string): Promise<void> {
    if (!this.page) return;

    const response = await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: this.options.timeout
    });

    // Check for redirect loops or invalid redirects
    if (response && response.url() !== url) {
      const finalUrl = response.url();
      if (finalUrl.includes('404') || finalUrl.includes('error')) {
        this.addError({
          type: 'invalid_redirect',
          severity: 'medium',
          message: `Invalid redirect from ${url} to ${finalUrl}`,
          details: {
            originalUrl: url,
            finalUrl,
            status: response.status()
          }
        });
      }
    }

    // Wait for page to be fully loaded
    await this.page.waitForTimeout(2000);

    // Test for dead clicks
    await this.testDeadClicks();

    // Check for rendering issues
    await this.checkRenderingIssues();

    // Take screenshot if enabled
    if (this.options.saveScreenshots) {
      await this.takeScreenshot(url);
    }
  }

  private async testDeadClicks(): Promise<void> {
    if (!this.page) return;

    try {
      // Find clickable elements
      const clickableElements = await this.page.evaluate(() => {
        const selectors = [
          'button:not([disabled])',
          'a[href]',
          '[role="button"]',
          '[onclick]',
          'input[type="submit"]',
          'input[type="button"]'
        ];

        const elements: Array<{selector: string, text: string, href?: string}> = [];
        
        selectors.forEach(selector => {
          const nodes = document.querySelectorAll(selector);
          nodes.forEach((node, index) => {
            const text = node.textContent?.trim() || '';
            const href = node.getAttribute('href') || undefined;
            elements.push({
              selector: `${selector}:nth-of-type(${index + 1})`,
              text: text.substring(0, 50),
              href
            });
          });
        });

        return elements.slice(0, 10); // Limit to 10 elements per page
      });

      // Test each clickable element
      for (const element of clickableElements) {
        try {
          const initialUrl = this.page.url();
          const beforeCount = await this.page.evaluate(() => document.querySelectorAll('*').length);
          
          // Click the element
          await this.page.click(element.selector, { timeout: 5000 });
          
          // Wait a bit for any async operations
          await this.page.waitForTimeout(1000);
          
          const afterUrl = this.page.url();
          const afterCount = await this.page.evaluate(() => document.querySelectorAll('*').length);
          
          // Check if the click had any effect
          const hasEffect = initialUrl !== afterUrl || 
                           Math.abs(afterCount - beforeCount) > 5 ||
                           await this.page.evaluate(() => {
                             // Check for modal dialogs, toasts, etc.
                             return document.querySelector('.modal, .toast, .dialog, [role="dialog"], [role="alert"]') !== null;
                           });

          if (!hasEffect && !element.href?.startsWith('#')) {
            this.addError({
              type: 'dead_click',
              severity: 'medium',
              message: `Dead click detected: ${element.text}`,
              details: {
                selector: element.selector,
                text: element.text,
                href: element.href,
                initialUrl,
                afterUrl
              }
            });
          }

          // Navigate back if we changed pages
          if (initialUrl !== afterUrl) {
            await this.page.goBack({ waitUntil: 'networkidle' });
          }
        } catch (error) {
          // Click failed - might be a dead click
          this.addError({
            type: 'dead_click',
            severity: 'low',
            message: `Click failed: ${element.text}`,
            details: {
              selector: element.selector,
              text: element.text,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error testing dead clicks:', error);
    }
  }

  private async checkRenderingIssues(): Promise<void> {
    if (!this.page) return;

    try {
      const issues = await this.page.evaluate(() => {
        const problems: string[] = [];
        
        // Check for missing images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.complete || img.naturalWidth === 0) {
            problems.push(`Broken image: ${img.src || `Image ${index}`}`);
          }
        });

        // Check for empty essential elements
        const essentialSelectors = ['main', '[role="main"]', '.content', '#content'];
        let hasContent = false;
        essentialSelectors.forEach(selector => {
          const element = document.querySelector(selector);
          if (element && element.textContent && element.textContent.trim().length > 0) {
            hasContent = true;
          }
        });

        if (!hasContent) {
          problems.push('No main content detected');
        }

        // Check for layout issues
        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        if (bodyWidth > windowWidth * 1.1) {
          problems.push('Horizontal scroll detected - possible layout issue');
        }

        return problems;
      });

      issues.forEach(issue => {
        this.addError({
          type: 'rendering_error',
          severity: 'low',
          message: issue,
          details: {
            issue,
            viewport: { width: 1920, height: 1080 }
          }
        });
      });
    } catch (error) {
      console.error('Error checking rendering issues:', error);
    }
  }

  private async takeScreenshot(url: string): Promise<string | undefined> {
    if (!this.page || !this.options.saveScreenshots) return;

    try {
      const filename = `error-${Date.now()}-${url.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const filepath = join(this.options.screenshotPath, filename);
      
      await this.page.screenshot({ path: filepath, fullPage: true });
      return filepath;
    } catch (error) {
      console.error('Error taking screenshot:', error);
      return undefined;
    }
  }

  private addError(error: Omit<ErrorDetails, 'id' | 'timestamp' | 'url'>): void {
    const errorDetail: ErrorDetails = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      url: this.page?.url() || this.options.baseUrl,
      ...error
    };

    this.errors.push(errorDetail);
    
    if (this.options.debugMode) {
      console.log(`🐛 Error detected:`, errorDetail);
    }
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Static method to run crawler with default options
  static async run(options?: Partial<CrawlerOptions>): Promise<ErrorDetails[]> {
    const crawler = new ErrorCrawler(options);
    return await crawler.start();
  }

  // Save errors to file
  saveErrorsToFile(filename?: string): void {
    const outputFile = filename || `errors-${Date.now()}.json`;
    writeFileSync(outputFile, JSON.stringify(this.errors, null, 2));
    console.log(`💾 Errors saved to: ${outputFile}`);
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const crawler = new ErrorCrawler({
        debugMode: true,
        saveScreenshots: true
      });
      
      const errors = await crawler.start();
      crawler.saveErrorsToFile();
      
      console.log(`\n📊 Summary:`);
      console.log(`Total errors: ${errors.length}`);
      
      const byType = errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    } catch (error) {
      console.error('Crawler failed:', error);
      process.exit(1);
    }
  })();
}