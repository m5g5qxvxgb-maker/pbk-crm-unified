'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { clientsAPI } from '@/lib/api';

interface ClientFormProps {
  client?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientForm({ client, onClose, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: client?.company_name || '',
    contact_person: client?.contact_person || '',
    actual_company_name: client?.actual_company_name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    country: client?.country || '',
    website: client?.website || '',
    notes: client?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (client) {
        await clientsAPI.update(client.id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {client ? 'Edit Client' : 'New Client'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Имя клиента *"
              name="company_name"
              placeholder="Имя клиента"
              value={formData.company_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Должность"
              name="contact_person"
              placeholder="Должность"
              value={formData.contact_person}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Название компании"
            name="actual_company_name"
            placeholder="Название компании (если есть)"
            value={formData.actual_company_name}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="Телефон"
              name="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Адрес клиента"
            name="address"
            placeholder="Полный адрес"
            value={formData.address}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Веб-сайт"
              name="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleChange}
            />

            <Input
              label="Город"
              name="city"
              placeholder="Город"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Страна"
            name="country"
            placeholder="Страна"
            value={formData.country}
            onChange={handleChange}
          />

          <Textarea
            label="Заметки"
            name="notes"
            placeholder="Дополнительные заметки..."
            rows={3}
            value={formData.notes}
            onChange={handleChange}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              {client ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
