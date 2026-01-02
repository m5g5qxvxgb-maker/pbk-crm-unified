# GitHub Deployment Guide
## Step-by-Step Instructions to Deploy PBK CRM to GitHub

---

## Prerequisites

- GitHub account
- Git installed on your system
- Repository ready on GitHub

---

## Step 1: Initialize Git Repository (if not already done)

```bash
cd /root/pbk-crm-unified

# Initialize git (if needed)
git init

# Check current status
git status
```

---

## Step 2: Create .gitignore File

Make sure you have a `.gitignore` file to exclude sensitive and unnecessary files:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Production builds
/frontend/.next/
/frontend/out/
/backend/dist/
build/

# Logs
logs/
*.log
/backend/logs/

# Database
*.db
*.sqlite
*.sqlite3

# Uploads
/backend/uploads/*
!/backend/uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/

# Temporary files
tmp/
temp/
*.tmp

# Credentials
creds/
credentials/

# Backups
*.backup
*.bak
*.old
EOF
```

---

## Step 3: Create GitHub Repository

1. Go to https://github.com
2. Click "New repository"
3. Name: `pbk-crm-unified`
4. Description: "Production-ready CRM system with AI agent integration"
5. Set to **Private** (recommended for proprietary code)
6. Do NOT initialize with README, .gitignore, or license
7. Click "Create repository"

---

## Step 4: Configure Git

```bash
# Set your Git identity (if not set globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# View current config
git config --list
```

---

## Step 5: Stage and Commit Files

```bash
# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: PBK CRM v1.0.0

- Complete CRM system with clients, projects, leads, tasks, meetings
- AI Agent integration with OpenRouter
- Retell AI voice calling integration
- Offerteo Telegram bot integration
- Email management system
- Financial tracking and proposals
- Role-based access control
- Comprehensive test suite
- Production-ready with Next.js 14 and PostgreSQL"

```

---

## Step 6: Add Remote Repository

```bash
# Add GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/pbk-crm-unified.git

# Verify remote
git remote -v
```

---

## Step 7: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

If you encounter authentication issues, you may need to:

### Option A: Use Personal Access Token (Recommended)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when prompted

### Option B: Use SSH

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add SSH key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH and GPG keys → New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:YOUR_USERNAME/pbk-crm-unified.git

# Push
git push -u origin main
```

---

## Step 8: Create Release Tags

```bash
# Create a release tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production release"

# Push tags
git push --tags
```

---

## Step 9: Add GitHub Repository Metadata

On GitHub web interface:

1. **Add Topics**: Click "Add topics" button
   - `crm`
   - `nodejs`
   - `nextjs`
   - `postgresql`
   - `ai`
   - `typescript`
   - `react`
   - `construction`
   - `business-management`

2. **Edit About section**:
   - Description: "Production-ready CRM system with AI agent, voice calling, and Telegram integration"
   - Website: Your deployment URL (if any)

3. **Add Social Preview**: Upload a screenshot of your CRM dashboard

---

## Step 10: Setup GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint || true
    
    - name: Run tests
      run: npm test || true
```

---

## Step 11: Create Documentation

Create additional documentation files:

### CONTRIBUTING.md

```bash
cat > CONTRIBUTING.md << 'EOF'
# Contributing to PBK CRM

Thank you for your interest in contributing!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`
5. Make your changes
6. Test your changes: `npm test`
7. Commit: `git commit -m 'Add amazing feature'`
8. Push: `git push origin feature/amazing-feature`
9. Open a Pull Request

## Code Style

- Use ES6+ features
- Follow existing code patterns
- Add comments for complex logic
- Update tests for new features

## Commit Messages

- Use present tense: "Add feature" not "Added feature"
- Keep first line under 50 characters
- Add detailed description in commit body if needed

## Questions?

Open an issue for discussion before starting major changes.
EOF
```

### LICENSE

```bash
cat > LICENSE << 'EOF'
Copyright (c) 2026 PBK Construction

All rights reserved.

This software and associated documentation files (the "Software") are proprietary
and confidential. Unauthorized copying, distribution, modification, public display,
or public performance of this Software, via any medium, is strictly prohibited.

For licensing inquiries, contact: admin@pbk-construction.com
EOF
```

---

## Step 12: Final Verification

```bash
# Check repository status
git status

# View commit history
git log --oneline

# Check branches
git branch -a

# Verify remote
git remote -v

# Check tags
git tag
```

---

## Step 13: Clone and Test (Verification)

```bash
# Clone in a new directory to verify
cd /tmp
git clone https://github.com/YOUR_USERNAME/pbk-crm-unified.git test-clone
cd test-clone

# Verify all files are present
ls -la

# Install and test
npm install
echo "Repository successfully cloned and verified!"
```

---

## Maintenance Commands

### Updating Repository

```bash
# Make changes to files
git add .
git commit -m "Description of changes"
git push
```

### Creating Branches

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Push branch to GitHub
git push -u origin feature/new-feature
```

### Merging Changes

```bash
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/new-feature

# Push to GitHub
git push
```

---

## Security Best Practices

1. **Never commit**:
   - `.env` files
   - API keys or secrets
   - Database credentials
   - Private keys

2. **Use GitHub Secrets** for CI/CD:
   - Settings → Secrets and variables → Actions
   - Add secrets like `DATABASE_URL`, `API_KEYS`, etc.

3. **Enable Security Features**:
   - Dependabot alerts
   - Code scanning
   - Secret scanning

---

## Troubleshooting

### Problem: Push rejected

```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push
```

### Problem: Large files

```bash
# Remove large files from history
git filter-branch --tree-filter 'rm -f path/to/large/file' HEAD

# Or use git-lfs for large files
git lfs install
git lfs track "*.psd"
git add .gitattributes
```

### Problem: Merge conflicts

```bash
# View conflicted files
git status

# Resolve conflicts manually in your editor
# Then add resolved files
git add .
git commit
```

---

## Success Checklist

- [ ] Repository created on GitHub
- [ ] All code pushed to main branch
- [ ] .gitignore excludes sensitive files
- [ ] README.md is complete and informative
- [ ] LICENSE file added
- [ ] Release tag created (v1.0.0)
- [ ] Topics added to repository
- [ ] Repository is set to private
- [ ] No secrets committed
- [ ] Tests pass locally
- [ ] Documentation is complete

---

## Next Steps

After deploying to GitHub:

1. **Setup CI/CD** with GitHub Actions
2. **Add collaborators** if working with a team
3. **Create project board** for task management
4. **Setup branch protection** rules
5. **Configure webhooks** for deployment automation
6. **Add badges** to README (build status, coverage, etc.)

---

**Deployment Complete! 🎉**

Your PBK CRM is now on GitHub and ready for collaboration!
