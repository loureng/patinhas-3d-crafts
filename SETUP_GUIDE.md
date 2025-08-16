# 🤖 Autonomous Error Detection System - Quick Setup Guide

## Step-by-Step Setup

### 1. 📋 Prerequisites
- Node.js 18+ installed
- GitHub account with repository access
- Google Cloud account for Gemini AI

### 2. 🔑 Get API Keys

#### GitHub Token
1. Go to https://github.com/settings/tokens/new
2. Create a new "Personal access token (classic)"
3. Grant permissions: `repo`, `issues:write`
4. Copy the token

#### Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key

### 3. ⚙️ Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
```

Required variables:
```env
GITHUB_TOKEN=ghp_your_github_token_here
GEMINI_API_KEY=your_gemini_api_key_here
BASE_URL=http://localhost:5173
```

### 4. 📦 Install Dependencies

```bash
# Install all dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 5. 🧪 Test the System

```bash
# Run system validation
npm run test-system
```

If all tests pass, you're ready! 🎉

### 6. 🚀 Run Error Detection

```bash
# Test run (no issues created)
npm run auto-issue:dry

# Production run (creates real issues)
npm run auto-issue

# Debug mode (verbose logging)
npm run auto-issue:debug
```

## 🔧 Troubleshooting

### Common Issues

**"Playwright browsers not found"**
```bash
npx playwright install chromium
```

**"GitHub API authentication failed"**
- Check your GitHub token has correct permissions
- Verify repository owner/name in .env

**"Gemini API error"**
- Ensure API key is valid and not expired
- Check billing is enabled in Google Cloud

**"Connection timeout"**
- For localhost: start your dev server first (`npm run dev`)
- For production: verify the URL is accessible

### Getting Help

1. Run `npm run test-system` to diagnose issues
2. Check the `reports/` folder for detailed logs
3. Use `--debug` flag for verbose output
4. Review the GitHub Actions logs if using CI/CD

## 📊 Understanding Results

### Exit Codes
- `0`: No errors found (healthy)
- `1`: Errors found but not critical
- `2`: Critical errors found
- `3`: System failure

### Report Files
- `reports/error-detection-report-*.json`: Complete data
- `reports/summary-*.txt`: Human-readable summary
- `screenshots/`: Visual evidence of errors

## 🔄 Automation

Add to your CI/CD pipeline:

```yaml
# .github/workflows/error-detection.yml already included
# Runs daily at 2 AM UTC
# Can be triggered manually from GitHub Actions tab
```

## 🎯 Next Steps

1. **Test locally**: Run `npm run auto-issue:dry` first
2. **Verify in production**: Use real URL in .env
3. **Schedule automation**: The GitHub Action runs daily
4. **Monitor results**: Check GitHub issues for new reports
5. **Iterate**: Adjust settings in .env as needed

---

**🎉 You're all set! The system will now automatically detect and report errors in your application.**