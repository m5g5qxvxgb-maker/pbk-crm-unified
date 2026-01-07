#!/usr/bin/env node

/**
 * Quick AI Integration Status Check
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPaths = [
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../.env'),
    path.join(process.cwd(), '.env')
  ];
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }
  
  return null;
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2].trim();
    }
  });
  
  return vars;
}

function checkAIConfig() {
  log('\n' + '═'.repeat(50), 'cyan');
  log('  AI Integration Status Check', 'bold');
  log('═'.repeat(50) + '\n', 'cyan');
  
  // Check .env file
  const envPath = checkEnvFile();
  
  if (!envPath) {
    log('❌ .env file not found!', 'red');
    log('   Create .env file from .env.example', 'yellow');
    log('   cp .env.example .env', 'blue');
    return false;
  }
  
  log(`✅ Found .env file: ${envPath}`, 'green');
  
  // Parse .env
  const envVars = parseEnvFile(envPath);
  
  // Check OpenRouter
  log('\n📦 OpenRouter Configuration:', 'cyan');
  const openrouterKey = envVars.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
  const openrouterModel = envVars.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
  
  if (openrouterKey && openrouterKey !== '' && openrouterKey !== 'sk-placeholder') {
    log(`   ✅ API Key: ${openrouterKey.substring(0, 15)}...`, 'green');
    log(`   ✅ Model: ${openrouterModel}`, 'green');
    log('   ✅ Status: Configured', 'green');
  } else {
    log('   ⚠️  Not configured (optional)', 'yellow');
    log('   Get key at: https://openrouter.ai/keys', 'blue');
  }
  
  // Check OpenAI
  log('\n🤖 OpenAI Configuration:', 'cyan');
  const openaiKey = envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const openaiModel = envVars.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  
  if (openaiKey && openaiKey !== '' && openaiKey !== 'sk-placeholder') {
    log(`   ✅ API Key: ${openaiKey.substring(0, 10)}...`, 'green');
    log(`   ✅ Model: ${openaiModel}`, 'green');
    log('   ✅ Status: Configured', 'green');
  } else {
    log('   ⚠️  Not configured (optional)', 'yellow');
    log('   Get key at: https://platform.openai.com/api-keys', 'blue');
  }
  
  // Check AI routes file
  log('\n📄 AI Routes File:', 'cyan');
  const aiRoutesPath = path.join(__dirname, '../src/routes/ai.js');
  
  if (fs.existsSync(aiRoutesPath)) {
    const content = fs.readFileSync(aiRoutesPath, 'utf8');
    
    log('   ✅ File exists', 'green');
    
    // Check for key features
    if (content.includes('parseCommand')) {
      log('   ✅ Command parser: Implemented', 'green');
    }
    
    if (content.includes('executeCRMAction')) {
      log('   ✅ CRM actions: Implemented', 'green');
    }
    
    if (content.includes('/generate-response')) {
      log('   ✅ Response generator: Implemented', 'green');
    }
    
    if (content.includes('authenticateToken')) {
      log('   ✅ Authentication: Enabled', 'green');
    }
  } else {
    log('   ❌ File not found!', 'red');
  }
  
  // Final summary
  log('\n' + '═'.repeat(50), 'cyan');
  log('  Summary', 'bold');
  log('═'.repeat(50), 'cyan');
  
  const hasOpenRouter = openrouterKey && openrouterKey !== '' && openrouterKey !== 'sk-placeholder';
  const hasOpenAI = openaiKey && openaiKey !== '' && openaiKey !== 'sk-placeholder';
  
  if (hasOpenRouter || hasOpenAI) {
    log('\n✅ AI Integration is CONFIGURED and READY!', 'green');
    
    if (hasOpenRouter) {
      log('   • Using OpenRouter (recommended)', 'green');
    }
    if (hasOpenAI) {
      log('   • Using OpenAI as fallback', 'green');
    }
    
    log('\n📝 Next steps:', 'cyan');
    log('   1. Start backend: npm start', 'blue');
    log('   2. Test endpoint: node tests/test-ai-integration.js', 'blue');
    log('   3. Check docs: backend/docs/AI_INTEGRATION_SETUP.md', 'blue');
    
  } else {
    log('\n⚠️  AI Integration is NOT configured', 'yellow');
    log('\n📝 To configure:', 'cyan');
    log('   1. Get API key from https://openrouter.ai/keys (free)', 'blue');
    log('   2. Add to .env: OPENROUTER_API_KEY=sk-or-v1-...', 'blue');
    log('   3. Run this check again: node tests/check-ai-status.js', 'blue');
  }
  
  log('');
}

checkAIConfig();
