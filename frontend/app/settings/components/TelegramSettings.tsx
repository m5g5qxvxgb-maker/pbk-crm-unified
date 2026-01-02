'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { settingsAPI } from '@/lib/api';

export default function TelegramSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    main_bot_token: '',
    admin_chat_ids: '',
    copilot_bot_token: '',
    copilot_allowed_users: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await settingsAPI.updateTelegram(formData);
      setMessage({ type: 'success', text: 'Telegram settings saved successfully!' });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to save settings' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Telegram Configuration</h3>
        <p className="text-sm text-gray-500">
          Configure Telegram bots for notifications and AI assistant. Create bots using{' '}
          <a href="https://t.me/BotFather" target="_blank" className="text-blue-600 hover:underline">
            @BotFather
          </a>
        </p>
      </div>

      {/* Main Bot */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">Main Bot (Notifications)</h4>
        <div className="space-y-4">
          <Input
            label="Bot Token"
            name="main_bot_token"
            type="password"
            placeholder="1234567890:ABCDefGHIjklMNOpqrsTUVwxyz"
            value={formData.main_bot_token}
            onChange={handleChange}
          />

          <div>
            <Input
              label="Admin Chat IDs"
              name="admin_chat_ids"
              placeholder="123456789, 987654321"
              value={formData.admin_chat_ids}
              onChange={handleChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              Comma-separated list of Telegram user IDs. Use{' '}
              <a href="https://t.me/userinfobot" target="_blank" className="text-blue-600 hover:underline">
                @userinfobot
              </a>{' '}
              to get your ID.
            </p>
          </div>
        </div>
      </div>

      {/* Copilot Bot */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">Copilot Bot (AI Assistant)</h4>
        <div className="space-y-4">
          <Input
            label="Bot Token"
            name="copilot_bot_token"
            type="password"
            placeholder="9876543210:ZYXwvuTSRqponMLKjiHGFedCBA"
            value={formData.copilot_bot_token}
            onChange={handleChange}
          />

          <div>
            <Input
              label="Allowed User IDs"
              name="copilot_allowed_users"
              placeholder="123456789, 987654321"
              value={formData.copilot_allowed_users}
              onChange={handleChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              Comma-separated list of user IDs allowed to use Copilot bot.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave} loading={loading}>
          Save Settings
        </Button>
      </div>

      {/* Help Section */}
      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-2">How to setup:</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Open Telegram and search for <code className="bg-gray-100 px-1 rounded">@BotFather</code></li>
          <li>Send <code className="bg-gray-100 px-1 rounded">/newbot</code> command</li>
          <li>Follow instructions to create bot</li>
          <li>Copy the bot token and paste above</li>
          <li>Get your Chat ID from <code className="bg-gray-100 px-1 rounded">@userinfobot</code></li>
          <li>Add Chat ID to allowed users list</li>
        </ol>
      </div>
    </div>
  );
}
