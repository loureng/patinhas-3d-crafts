#!/usr/bin/env node

/**
 * Test script for the Autonomous Error Detection System
 * This script validates all components without creating real issues
 */

import { ErrorCrawler } from './error-crawler.js';
import { GeminiIssueGenerator } from './gemini-issue.js';
import { GitHubIssueManager } from './github-issue.js';

async function testSystem() {
  console.log('🧪 Testing Autonomous Error Detection System...\n');

  let passedTests = 0;
  let totalTests = 0;

  const test = (name: string, fn: () => boolean | Promise<boolean>) => {
    totalTests++;
    return (async () => {
      try {
        const result = await fn();
        if (result) {
          console.log(`✅ ${name}`);
          passedTests++;
        } else {
          console.log(`❌ ${name} - Test failed`);
        }
      } catch (error) {
        console.log(`❌ ${name} - ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  };

  // Test 1: Environment Variables
  await test('Environment Variables Check', () => {
    const requiredVars = ['GITHUB_TOKEN', 'GEMINI_API_KEY'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.log(`   Missing: ${missing.join(', ')}`);
      return false;
    }
    return true;
  });

  // Test 2: Dependencies
  await test('Dependencies Check', () => {
    try {
      require('playwright');
      require('@google/generative-ai');
      require('@octokit/rest');
      return true;
    } catch (error) {
      return false;
    }
  });

  // Test 3: Gemini Connection
  await test('Gemini AI Connection', async () => {
    try {
      const gemini = new GeminiIssueGenerator();
      return await gemini.testConnection();
    } catch (error) {
      console.log(`   Gemini error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  });

  // Test 4: GitHub Connection
  await test('GitHub API Connection', async () => {
    try {
      const github = new GitHubIssueManager();
      return await github.testConnection();
    } catch (error) {
      console.log(`   GitHub error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  });

  // Test 5: Error Crawler Initialization
  await test('Error Crawler Initialization', () => {
    try {
      const crawler = new ErrorCrawler({
        baseUrl: 'http://example.com',
        maxPages: 1,
        debugMode: true
      });
      return true;
    } catch (error) {
      return false;
    }
  });

  // Test 6: Mock Error Processing
  await test('Error Processing Pipeline', async () => {
    try {
      const mockError = {
        id: 'test-123',
        type: 'dead_click' as const,
        severity: 'medium' as const,
        url: 'https://example.com/test',
        message: 'Test error for validation',
        details: { test: true },
        timestamp: new Date().toISOString()
      };

      const gemini = new GeminiIssueGenerator();
      const description = await gemini.generateIssueDescription(mockError);
      
      return !!(description.title && description.body && description.labels.length > 0);
    } catch (error) {
      console.log(`   Processing error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  });

  // Results
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! System is ready to use.');
    console.log('\n🚀 Quick Start:');
    console.log('  npm run auto-issue:dry    # Test run without creating issues');
    console.log('  npm run auto-issue        # Full production run');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Please check configuration and try again.');
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Check .env file has all required variables');
    console.log('  2. Verify API keys are valid');
    console.log('  3. Ensure Playwright is installed: npx playwright install chromium');
    return false;
  }
}

// Run tests
if (require.main === module) {
  testSystem()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default testSystem;