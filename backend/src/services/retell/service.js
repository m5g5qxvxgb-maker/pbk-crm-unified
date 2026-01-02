const axios = require('axios');
const logger = require('../../utils/logger');

class RetellService {
  constructor() {
    this.apiKey = process.env.RETELL_API_KEY;
    this.baseUrl = 'https://api.retellai.com/v2';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create a phone call
   */
  async createCall(data) {
    try {
      const response = await this.client.post('/create-phone-call', {
        from_number: data.fromNumber || process.env.RETELL_FROM_NUMBER,
        to_number: data.toNumber,
        override_agent_id: data.agentId || process.env.RETELL_AGENT_ID,
        retell_llm_dynamic_variables: data.variables || {}
      });
      
      logger.info(`Retell call created: ${response.data.call_id}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Retell create call error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Get call details
   */
  async getCall(callId) {
    try {
      const response = await this.client.get(`/get-call/${callId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Retell get call error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * List calls
   */
  async listCalls(params = {}) {
    try {
      const response = await this.client.get('/list-calls', { params });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Retell list calls error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Get call recording
   */
  async getRecording(callId) {
    try {
      const response = await this.client.get(`/get-call-recording/${callId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Retell get recording error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Create or update agent
   */
  async updateAgent(agentId, config) {
    try {
      const response = await this.client.patch(`/update-agent/${agentId}`, {
        general_prompt: config.systemPrompt,
        llm_websocket_url: config.llmWebsocketUrl,
        voice_id: config.voiceId,
        language: config.language || 'en-US'
      });
      
      logger.info(`Retell agent updated: ${agentId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Retell update agent error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
}

module.exports = new RetellService();
