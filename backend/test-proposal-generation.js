/**
 * Test AI Proposal Generation
 * Тестовый скрипт для проверки генерации коммерческих предложений
 */

require('dotenv').config({ path: './.env' });
const proposalsAIService = require('./src/services/ai/proposals-ai-service');

async function testProposalGeneration() {
  console.log('🧪 Testing AI Proposal Generation...\n');

  // Инициализация сервиса
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      process.exit(1);
    }

    proposalsAIService.initialize(process.env.OPENAI_API_KEY);
    console.log('✅ ProposalsAI service initialized\n');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }

  // Тестовые данные
  const testData = {
    clientName: 'Jan Kowalski',
    clientAddress: 'ul. Marszałkowska 123/45, Warszawa',
    apartmentInfo: {
      area: 65,
      rooms: 3,
      condition: 'do remontu',
      floor: 5,
    },
    servicesNeeded: {
      'демонтаж': [
        'демонтаж старых обоев',
        'демонтаж напольного покрытия',
        'вывоз мусора',
      ],
      'электрика': [
        'замена проводки',
        'установка розеток',
        'установка выключателей',
      ],
      'отделка': [
        'штукатурка стен',
        'шпаклевка стен',
        'поклейка обоев',
        'укладка ламината',
      ],
    },
    budget: 150000,
    additionalNotes: 'Klient chce szybką realizację, preferuje materiały średniej klasy',
  };

  console.log('📋 Test data:');
  console.log('Client:', testData.clientName);
  console.log('Address:', testData.clientAddress);
  console.log('Apartment:', `${testData.apartmentInfo.area}m², ${testData.apartmentInfo.rooms} pokoje`);
  console.log('Budget:', `${testData.budget} PLN`);
  console.log('\nServices needed:');
  for (const category in testData.servicesNeeded) {
    console.log(`  ${category}:`, testData.servicesNeeded[category].length, 'services');
  }
  console.log('\n⏳ Generating proposal...\n');

  // Генерация
  try {
    const startTime = Date.now();
    const result = await proposalsAIService.generateProposal(testData);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.success) {
      console.log('✅ Proposal generated successfully!\n');
      console.log('━'.repeat(80));
      console.log(result.content);
      console.log('━'.repeat(80));
      console.log('\n📊 Statistics:');
      console.log('Model:', result.usage.model);
      console.log('Tokens used:', result.usage.tokens);
      console.log('  - Prompt tokens:', result.usage.prompt_tokens);
      console.log('  - Completion tokens:', result.usage.completion_tokens);
      console.log('Generation time:', duration, 'seconds');
      console.log('Content length:', result.content.length, 'characters');
    } else {
      console.error('❌ Generation failed:', result.error);
      console.error('Fallback message:', result.fallbackMessage);
    }
  } catch (error) {
    console.error('❌ Error during generation:', error.message);
    console.error(error.stack);
  }

  console.log('\n✅ Test completed!');
}

// Запуск теста
testProposalGeneration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
