const OpenAI = require('openai');
const logger = require('../../utils/logger');

class OpenAIService {
  constructor() {
    this.enabled = process.env.ENABLE_OPENAI_PROPOSALS === 'true';
    if (this.enabled && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION_ID
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    } else {
      this.client = null;
      this.model = null;
    }
  }

  /**
   * Generate commercial proposal
   */
  async generateProposal(data) {
    if (!this.enabled || !this.client) {
      throw new Error('OpenAI integration is disabled');
    }
    
    const template = this.getProposalTemplate();
    
    const prompt = `
Создай профессиональное коммерческое предложение для строительной компании PBK Construction.

ДАННЫЕ ПРОЕКТА:
- Клиент: ${data.clientName}
- Тип проекта: ${data.projectType}
- Площадь: ${data.area} кв.м
- Срок выполнения: ${data.duration}
- Бюджет: ${data.budget}
- Дополнительные требования: ${data.requirements || 'нет'}

ТРЕБОВАНИЯ:
- Используй профессиональный деловой стиль
- Структурируй предложение по разделам
- Укажи этапы работ и сроки
- Добавь информацию о компании
- Включи условия оплаты
- Формат: готовый к отправке документ

${template}
`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'Ты - эксперт по составлению коммерческих предложений для строительной компании.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;

      logger.info(`OpenAI proposal generated, tokens: ${tokensUsed}`);

      return {
        success: true,
        data: {
          content,
          tokensUsed,
          model: this.model
        }
      };
    } catch (error) {
      logger.error('OpenAI generate proposal error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Translate text
   */
  async translate(text, targetLanguage = 'ru') {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Переведи текст на ${targetLanguage === 'ru' ? 'русский' : 'английский'} язык. Сохрани форматирование.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      return {
        success: true,
        data: {
          translatedText: completion.choices[0].message.content,
          tokensUsed: completion.usage.total_tokens
        }
      };
    } catch (error) {
      logger.error('OpenAI translate error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze call transcript
   */
  async analyzeCallTranscript(transcript) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Проанализируй расшифровку звонка. Выдели ключевые моменты, эмоциональную окраску, результат разговора и рекомендации.'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      });

      return {
        success: true,
        data: {
          analysis: completion.choices[0].message.content,
          tokensUsed: completion.usage.total_tokens
        }
      };
    } catch (error) {
      logger.error('OpenAI analyze transcript error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get proposal template
   */
  getProposalTemplate() {
    return `
ШАБЛОН КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ:

1. Заголовок и дата
2. Обращение к клиенту
3. О компании PBK Construction (краткая информация о нашем опыте)
4. Описание проекта
5. Этапы работ с указанием сроков
6. Стоимость работ (детализация)
7. Условия оплаты
8. Гарантии качества
9. Контактная информация
10. Призыв к действию

Используй профессиональный тон, подчеркни наши преимущества и опыт.
`;
  }
}

module.exports = new OpenAIService();
