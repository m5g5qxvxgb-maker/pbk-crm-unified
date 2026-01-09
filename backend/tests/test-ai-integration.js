#!/usr/bin/env node

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOpenRouter() {
  log('\n🔍 Testing OpenRouter Integration...', 'cyan');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'sk-placeholder') {
    log('❌ OPENROUTER_API_KEY not configured', 'red');
    return false;
  }
  
  try {
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001:free';
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    log(`   API Key: ${apiKey.substring(0, 10)}...`, 'blue');
    log(`   Model: ${model}`, 'blue');
    log(`   Base URL: ${baseUrl}`, 'blue');
    
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for testing.'
          },
          {
            role: 'user',
            content: 'Say "OpenRouter works!" if you can read this.'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://crm.pbkconstruction.net',
          'X-Title': 'PBK CRM Test'
        },
        timeout: 30000
      }
    );
    
    const message = response.data.choices[0].message.content;
    log(`   Response: "${message}"`, 'blue');
    log('✅ OpenRouter: OK', 'green');
    
    if (response.data.usage) {
      log(`   Tokens used: ${response.data.usage.total_tokens}`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('❌ OpenRouter: FAILED', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    return false;
  }
}

async function testOpenAI() {
  log('\n🔍 Testing OpenAI Integration...', 'cyan');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'sk-placeholder') {
    log('⚠️  OPENAI_API_KEY not configured (optional)', 'yellow');
    return null;
  }
  
  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    
    log(`   API Key: ${apiKey.substring(0, 10)}...`, 'blue');
    log(`   Model: ${model}`, 'blue');
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for testing.'
          },
          {
            role: 'user',
            content: 'Say "OpenAI works!" if you can read this.'
          }
        ],
        max_tokens: 50
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const message = response.data.choices[0].message.content;
    log(`   Response: "${message}"`, 'blue');
    log('✅ OpenAI: OK', 'green');
    
    if (response.data.usage) {
      log(`   Tokens used: ${response.data.usage.total_tokens}`, 'blue');
    }
    
    return true;
  } catch (error) {
    log('❌ OpenAI: FAILED', 'red');
    
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    
    return false;
  }
}

async function testAICopilotEndpoint() {
  log('\n🔍 Testing AI Copilot Endpoint...', 'cyan');
  
  const backendUrl = process.env.API_URL || 'http://localhost:5000';
  
  try {
    // This would require a running server and auth token
    log('⚠️  Skipping endpoint test (requires running server)', 'yellow');
    log('   To test manually:', 'blue');
    log('   curl -X POST http://localhost:5000/api/ai/copilot \\', 'blue');
    log('     -H "Content-Type: application/json" \\', 'blue');
    log('     -H "Authorization: Bearer YOUR_TOKEN" \\', 'blue');
    log('     -d \'{"message": "Hello AI!"}\'', 'blue');
    
    return null;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('═══════════════════════════════════════════', 'cyan');
  log('  AI Integration Test - PBK CRM', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');
  
  const results = {
    openrouter: await testOpenRouter(),
    openai: await testOpenAI(),
    endpoint: await testAICopilotEndpoint()
  };
  
  log('\n═══════════════════════════════════════════', 'cyan');
  log('  Test Results Summary', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');
  
  if (results.openrouter === true) {
    log('✅ OpenRouter: Working', 'green');
  } else if (results.openrouter === false) {
    log('❌ OpenRouter: Failed', 'red');
  } else {
    log('⚠️  OpenRouter: Not configured', 'yellow');
  }
  
  if (results.openai === true) {
    log('✅ OpenAI: Working', 'green');
  } else if (results.openai === false) {
    log('❌ OpenAI: Failed', 'red');
  } else {
    log('⚠️  OpenAI: Not configured', 'yellow');
  }
  
  log('\n📝 Configuration Tips:', 'cyan');
  log('   1. Get OpenRouter API key: https://openrouter.ai/keys', 'blue');
  log('   2. Get OpenAI API key: https://platform.openai.com/api-keys', 'blue');
  log('   3. Add keys to .env file', 'blue');
  log('   4. OpenRouter is recommended (free models available)', 'blue');
  
  const hasAtLeastOne = results.openrouter === true || results.openai === true;
  
  if (hasAtLeastOne) {
    log('\n🎉 AI integration is ready!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Please configure at least one AI provider', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
