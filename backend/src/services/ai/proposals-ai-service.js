/**
 * AI Proposals Service
 * Генерация коммерческих предложений через OpenAI GPT-4
 */

const OpenAI = require('openai');
const logger = require('../../utils/logger');

class ProposalsAIService {
  constructor() {
    this.client = null;
    
    // Mock-данные расценок (временно, потом заменим на БД)
    this.mockPrices = {
      'демонтаж': {
        'демонтаж старых обоев': { unit: 'м²', price_min: 80, price_max: 150 },
        'демонтаж напольного покрытия': { unit: 'м²', price_min: 120, price_max: 200 },
        'демонтаж дверей и окон': { unit: 'шт', price_min: 500, price_max: 1000 },
        'демонтаж сантехники': { unit: 'шт', price_min: 800, price_max: 1500 },
        'вывоз мусора': { unit: 'м³', price_min: 300, price_max: 500 },
      },
      'электрика': {
        'замена проводки': { unit: 'м.п.', price_min: 400, price_max: 600 },
        'установка розеток': { unit: 'шт', price_min: 300, price_max: 500 },
        'установка выключателей': { unit: 'шт', price_min: 250, price_max: 400 },
        'монтаж светильников': { unit: 'шт', price_min: 500, price_max: 1200 },
        'установка электрощита': { unit: 'шт', price_min: 3000, price_max: 5000 },
      },
      'сантехника': {
        'установка унитаза': { unit: 'шт', price_min: 2000, price_max: 3500 },
        'установка раковины': { unit: 'шт', price_min: 1500, price_max: 2500 },
        'установка ванны': { unit: 'шт', price_min: 3000, price_max: 5000 },
        'установка душевой кабины': { unit: 'шт', price_min: 3500, price_max: 6000 },
        'замена труб водоснабжения': { unit: 'м.п.', price_min: 500, price_max: 800 },
        'замена канализации': { unit: 'м.п.', price_min: 600, price_max: 900 },
      },
      'отделка': {
        'штукатурка стен': { unit: 'м²', price_min: 400, price_max: 600 },
        'шпаклевка стен': { unit: 'м²', price_min: 300, price_max: 500 },
        'поклейка обоев': { unit: 'м²', price_min: 200, price_max: 400 },
        'покраска стен': { unit: 'м²', price_min: 250, price_max: 450 },
        'укладка ламината': { unit: 'м²', price_min: 400, price_max: 700 },
        'укладка плитки': { unit: 'м²', price_min: 800, price_max: 1500 },
        'монтаж натяжного потолка': { unit: 'м²', price_min: 500, price_max: 900 },
        'монтаж гипсокартонного потолка': { unit: 'м²', price_min: 600, price_max: 1000 },
      },
      'двери и окна': {
        'установка межкомнатных дверей': { unit: 'шт', price_min: 2500, price_max: 4000 },
        'установка входной двери': { unit: 'шт', price_min: 4000, price_max: 7000 },
        'установка пластиковых окон': { unit: 'шт', price_min: 5000, price_max: 10000 },
      },
    };

    // System prompt для генерации КП
    this.proposalSystemPrompt = `
Jesteś profesjonalnym menedżerem sprzedaży firmy PBK Construction - doświadczonej firmy budowlanej.

O firmie PBK Construction:
- Ponad 10 lat doświadczenia w budownictwie
- Realizacja obiektów sportowych, mieszkalnych i przemysłowych
- Własna baza materiałowo-techniczna
- Zespół wykwalifikowanych specjalistów
- 2 lata gwarancji na wszystkie prace
- Bezpłatna konsultacja i wyjazd na pomiar
- Możliwość ratalnej i etapowej płatności

Twoje zadanie:
Wygeneruj szczegółową ofertę komercyjną (commercial proposal) na podstawie dostarczonych danych.

Struktura oferty:
1. POWITANIE
   - Podziękowanie za zainteresowanie
   - Krótkie przedstawienie PBK Construction

2. OPIS PROJEKTU
   - Adres i charakterystyka obiektu
   - Zakres planowanych prac

3. SZCZEGÓŁOWA WYCENA
   - Tabela z pozycjami prac
   - Jednostki miary i ceny
   - Podsumowanie kosztów

4. HARMONOGRAM REALIZACJI
   - Szacowany czas wykonania
   - Etapy prac

5. WARUNKI WSPÓŁPRACY
   - Warunki płatności (zaliczka, etapy)
   - Gwarancja jakości
   - Ubezpieczenie

6. ZAKOŃCZENIE
   - Zaproszenie do kontaktu
   - Dane kontaktowe firmy

Ton: profesjonalny, przekonujący, budujący zaufanie
Język: polski
Format: elegancki, czytelny, profesjonalny

WAŻNE:
- Używaj podanych cen z zakresu (min-max)
- Dostosuj ofertę do budżetu klienta
- Podkreśl doświadczenie i portfolio firmy
- Zaproponuj dodatkowe usługi, jeśli pasują
- Bądź konkretny w wycenie - podaj dokładne kwoty
`;
  }

  /**
   * Inicjalizacja OpenAI klienta
   */
  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    logger.info('ProposalsAI service initialized');
  }

  /**
   * Sprawdzenie inicjalizacji
   */
  ensureInitialized() {
    if (!this.client) {
      throw new Error('ProposalsAI service not initialized. Call initialize() first.');
    }
  }

  /**
   * Pobranie cen dla wybranych usług (mock)
   */
  getPricesForServices(servicesNeeded) {
    const prices = {};
    
    for (const category in servicesNeeded) {
      if (servicesNeeded[category] && this.mockPrices[category]) {
        prices[category] = {};
        
        for (const serviceName of servicesNeeded[category]) {
          if (this.mockPrices[category][serviceName]) {
            prices[category][serviceName] = this.mockPrices[category][serviceName];
          }
        }
      }
    }
    
    return prices;
  }

  /**
   * Formatowanie cen do tekstu dla AI
   */
  formatPricesForPrompt(prices) {
    let priceText = '\nDostępne ceny i usługi:\n\n';
    
    for (const category in prices) {
      priceText += `\n${category.toUpperCase()}:\n`;
      
      for (const serviceName in prices[category]) {
        const service = prices[category][serviceName];
        priceText += `- ${serviceName}: ${service.price_min}-${service.price_max} PLN/${service.unit}\n`;
      }
    }
    
    return priceText;
  }

  /**
   * Główna metoda - generowanie oferty
   */
  async generateProposal(proposalData) {
    this.ensureInitialized();

    const {
      clientName,
      clientAddress,
      apartmentInfo = {},
      servicesNeeded = {},
      budget,
      additionalNotes,
      leadDescription,
    } = proposalData;

    try {
      // Pobranie cen dla wybranych usług
      const prices = this.getPricesForServices(servicesNeeded);
      const pricesText = this.formatPricesForPrompt(prices);

      // Tworzenie user prompt
      const userPrompt = `
DANE KLIENTA:
- Nazwa: ${clientName}
- Adres obiektu: ${clientAddress || 'nie podano'}

INFORMACJE O MIESZKANIU:
- Powierzchnia: ${apartmentInfo.area || 'nie podano'} m²
- Liczba pokoi: ${apartmentInfo.rooms || 'nie podano'}
- Stan: ${apartmentInfo.condition || 'nie podano'}
- Piętro: ${apartmentInfo.floor || 'nie podano'}

ZAKRES PRAC:
${this.formatServicesForPrompt(servicesNeeded)}

BUDŻET KLIENTA:
${budget ? `${budget} PLN` : 'nie określono'}

${pricesText}

DODATKOWE INFORMACJE:
${additionalNotes || leadDescription || 'brak'}

Wygeneruj profesjonalną ofertę komercyjną.
`;

      logger.info('Generating proposal with AI', {
        clientName,
        servicesCount: Object.keys(servicesNeeded).length,
      });

      // Wywołanie OpenAI API
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.proposalSystemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const generatedContent = completion.choices[0].message.content;

      logger.info('Proposal generated successfully', {
        tokensUsed: completion.usage.total_tokens,
        contentLength: generatedContent.length,
      });

      return {
        success: true,
        content: generatedContent,
        usage: {
          model: 'gpt-4-turbo-preview',
          tokens: completion.usage.total_tokens,
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
        },
      };
    } catch (error) {
      logger.error('AI Proposal generation error', { error: error.message });

      return {
        success: false,
        error: error.message,
        fallbackMessage: 'Przepraszamy, wystąpił błąd podczas generowania oferty. Spróbuj ponownie.',
      };
    }
  }

  /**
   * Formatowanie listy usług do promptu
   */
  formatServicesForPrompt(servicesNeeded) {
    let text = '';
    
    for (const category in servicesNeeded) {
      if (servicesNeeded[category] && servicesNeeded[category].length > 0) {
        text += `\n${category}:\n`;
        servicesNeeded[category].forEach(service => {
          text += `  - ${service}\n`;
        });
      }
    }
    
    return text || 'Brak szczegółów';
  }

  /**
   * Regeneracja oferty z dodatkowymi wskazówkami
   */
  async regenerateProposal(originalProposal, userFeedback) {
    this.ensureInitialized();

    try {
      const userPrompt = `
Wcześniej wygenerowałeś następującą ofertę:

${originalProposal}

Uwagi od menedżera:
${userFeedback}

Zregeneruj ofertę z uwzględnieniem powyższych uwag.
`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.proposalSystemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      });

      const regeneratedContent = completion.choices[0].message.content;

      return {
        success: true,
        content: regeneratedContent,
        usage: {
          model: 'gpt-4-turbo-preview',
          tokens: completion.usage.total_tokens,
        },
      };
    } catch (error) {
      logger.error('AI Proposal regeneration error', { error: error.message });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Dostępne kategorie usług (dla frontendu)
   */
  getAvailableServices() {
    const services = {};
    
    for (const category in this.mockPrices) {
      services[category] = Object.keys(this.mockPrices[category]);
    }
    
    return services;
  }
}

const proposalsAIService = new ProposalsAIService();
module.exports = proposalsAIService;
