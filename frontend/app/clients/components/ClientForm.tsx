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
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    zip: client?.zip || '',
    country: client?.country || '',
    website: client?.website || '',
    notes: client?.notes || '',
    type: client?.type || 'client',
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
              label="Company Name *"
              name="company_name"
              placeholder="Company name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Contact Person"
              name="contact_person"
              placeholder="Contact person name"
              value={formData.contact_person}
              onChange={handleChange}
            />
          </div>

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
              label="Phone"
              name="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Address"
            name="address"
            placeholder="Street address"
            value={formData.address}
            onChange={handleChange}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
            />

            <Input
              label="State"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
            />

            <Input
              label="ZIP"
              name="zip"
              placeholder="ZIP code"
              value={formData.zip}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Country"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleChange}
            />

            <Input
              label="Website"
              name="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="client">Client</option>
              <option value="partner">Partner</option>
              <option value="vendor">Vendor</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <Textarea
            label="Notes"
            name="notes"
            placeholder="Additional notes..."
            rows={3}
            value={formData.notes}
            onChange={handleChange}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </form>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {client ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}
