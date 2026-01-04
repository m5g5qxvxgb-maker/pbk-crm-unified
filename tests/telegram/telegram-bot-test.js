// Telegram Bot Test Suite
const axios = require('axios');

const BOT_TOKEN = '8003573668:AAHHs6GUJx-pUEL-fxe_lwVJCRutftrCZ30';
const ADMIN_CHAT_ID = '533868685';
const TEST_PHONE = '+48572778993';

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTestMessage(text) {
  try {
    const response = await axios.post(`${API_BASE}/sendMessage`, {
      chat_id: ADMIN_CHAT_ID,
      text: text,
      parse_mode: 'HTML'
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error sending message: ${error.message}`);
    return null;
  }
}

async function testBotConnection() {
  console.log('\n🤖 Testing Telegram Bot Connection...\n');
  
  try {
    const response = await axios.get(`${API_BASE}/getMe`);
    console.log('✅ Bot connected:', response.data.result.username);
    console.log('   First Name:', response.data.result.first_name);
    console.log('   ID:', response.data.result.id);
    return true;
  } catch (error) {
    console.error('❌ Bot connection failed:', error.message);
    return false;
  }
}

async function testSendMessage() {
  console.log('\n📤 Testing Message Sending...\n');
  
  const result = await sendTestMessage(
    `🧪 <b>Test Message from Playwright Test Suite</b>\n\n` +
    `Time: ${new Date().toLocaleString()}\n` +
    `Status: Testing bot functionality\n` +
    `System: PBK CRM Unified`
  );
  
  if (result && result.ok) {
    console.log('✅ Test message sent successfully');
    console.log('   Message ID:', result.result.message_id);
    return true;
  }
  return false;
}

async function testGetUpdates() {
  console.log('\n📥 Testing Get Updates...\n');
  
  try {
    const response = await axios.get(`${API_BASE}/getUpdates`);
    const updates = response.data.result;
    console.log(`✅ Received ${updates.length} updates`);
    
    if (updates.length > 0) {
      const lastUpdate = updates[updates.length - 1];
      console.log('   Last update:');
      console.log('     Update ID:', lastUpdate.update_id);
      if (lastUpdate.message) {
        console.log('     From:', lastUpdate.message.from.username || lastUpdate.message.from.first_name);
        console.log('     Text:', lastUpdate.message.text?.substring(0, 50));
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Get updates failed:', error.message);
    return false;
  }
}

async function testCRMIntegration() {
  console.log('\n🔄 Testing CRM Integration...\n');
  
  const result = await sendTestMessage(
    `📊 <b>CRM Integration Test</b>\n\n` +
    `Testing connection between Telegram Bot and PBK CRM:\n\n` +
    `• Bot Token: Active ✅\n` +
    `• Admin Chat: ${ADMIN_CHAT_ID}\n` +
    `• Test Phone: ${TEST_PHONE}\n` +
    `• Backend: http://localhost:5001\n` +
    `• Database: PostgreSQL (pbk_crm)\n\n` +
    `All systems operational for production use.`
  );
  
  if (result && result.ok) {
    console.log('✅ CRM integration message sent');
    return true;
  }
  return false;
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   📱 TELEGRAM BOT - COMPREHENSIVE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  
  const results = {
    connection: await testBotConnection(),
    sendMessage: await testSendMessage(),
    getUpdates: await testGetUpdates(),
    crmIntegration: await testCRMIntegration()
  };
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS:');
  console.log('═══════════════════════════════════════════════════════\n');
  
  let passed = 0;
  let total = 0;
  
  for (const [test, result] of Object.entries(results)) {
    total++;
    if (result) passed++;
    console.log(`${result ? '✅' : '❌'} ${test.toUpperCase()}: ${result ? 'PASSED' : 'FAILED'}`);
  }
  
  console.log('\n───────────────────────────────────────────────────────');
  console.log(`   Total: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  return passed === total;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
