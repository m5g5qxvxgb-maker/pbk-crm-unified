'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, UserIcon, PhoneIcon, EnvelopeIcon, BriefcaseIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface ClientModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

type TabType = 'details' | 'contacts' | 'leads' | 'tasks' | 'activity';

export default function ClientModal({ clientId, isOpen, onClose, onSave }: ClientModalProps) {
  const [client, setClient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [relatedLeads, setRelatedLeads] = useState<any[]>([]);
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    actual_company_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && clientId) {
      loadClient();
      loadRelatedData();
    } else {
      setClient(null);
      setIsEditing(false);
      setActiveTab('details');
    }
  }, [isOpen, clientId]);

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/clients/${clientId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setClient(data.data);
        setFormData({
          company_name: data.data.company_name || '',
          contact_person: data.data.contact_person || '',
          actual_company_name: data.data.actual_company_name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          website: data.data.website || '',
          address: data.data.address || '',
          city: data.data.city || '',
          country: data.data.country || '',
          notes: data.data.notes || ''
        });
      }
    } catch (error) {
      toast.error('Не удалось загрузить клиента');
    }
  };

  const loadRelatedData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(getApiUrl(`/api/leads?client_id=${clientId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const clientLeads = data.data.filter((l: any) => String(l.client_id) === String(clientId));
        setRelatedLeads(clientLeads);
        loadRelatedTasks(clientLeads.map((l: any) => l.id));
      }
    } catch (error) {
      console.error('Failed to load related leads:', error);
    }
  };

  const loadRelatedTasks = async (leadIds: string[]) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/tasks`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const clientTasks = data.data.filter((t: any) => leadIds.includes(t.lead_id));
        setRelatedTasks(clientTasks);
      }
    } catch (error) {
      console.error('Failed to load related tasks:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/clients/${clientId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Клиент обновлен');
        setIsEditing(false);
        loadClient();
        onSave();
      } else {
        toast.error(data.error || 'Не удалось обновить клиента');
      }
    } catch (error) {
      toast.error('Не удалось обновить клиента');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/clients/${clientId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Клиент удален');
        onSave();
        onClose();
      } else {
        toast.error(data.error || 'Не удалось удалить клиента');
      }
    } catch (error) {
      toast.error('Не удалось удалить клиента');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'details' as TabType, label: 'Детали', icon: UserIcon },
    { id: 'contacts' as TabType, label: 'Контакты', icon: PhoneIcon },
    { id: 'leads' as TabType, label: `Лиды (${relatedLeads.length})`, icon: BriefcaseIcon },
    { id: 'tasks' as TabType, label: `Задачи (${relatedTasks.length})`, icon: ClipboardDocumentListIcon },
    { id: 'activity' as TabType, label: 'История', icon: EnvelopeIcon },
  ];

  const renderDetailsTab = () => {
    if (!isEditing) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Имя клиента</p>
              <p className="text-lg text-gray-900">{client.company_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Должность</p>
              <p className="text-lg text-gray-900">{client.contact_person || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Название компании</p>
              <p className="text-lg text-gray-900">{client.actual_company_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg text-gray-900">{client.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Телефон</p>
              <p className="text-lg text-gray-900">{client.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Веб-сайт</p>
              <p className="text-lg text-gray-900">{client.website || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Город</p>
              <p className="text-lg text-gray-900">{client.city || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Страна</p>
              <p className="text-lg text-gray-900">{client.country || '-'}</p>
            </div>
          </div>

          {client.address && (
            <div>
              <p className="text-sm text-gray-500">Адрес клиента</p>
              <p className="text-lg text-gray-900">{client.address}</p>
            </div>
          )}

          {client.notes && (
            <div>
              <p className="text-sm text-gray-500">Заметки</p>
              <p className="text-gray-900 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя клиента *
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Должность
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название компании
            </label>
            <input
              type="text"
              value={formData.actual_company_name}
              onChange={(e) => setFormData({ ...formData, actual_company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Веб-сайт
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Страна
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Адрес клиента
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Адрес
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Заметки
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={loading || !formData.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  };

  const renderContactsTab = () => {
    const contactsList = [
      { id: 1, name: client?.name, email: client?.email, phone: client?.phone, position: client?.position, isPrimary: true }
    ];

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Контакты</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            + Добавить контакт
          </button>
        </div>
        
        <div className="space-y-3">
          {contactsList.map((contact) => (
            <div key={contact.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                  {contact.isPrimary && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Основной</span>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{contact.position}</p>
                  <p className="text-sm text-gray-600">📧 {contact.email}</p>
                  <p className="text-sm text-gray-600">📞 {contact.phone}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLeadsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Активные лиды</h3>
        </div>
        
        {relatedLeads.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет активных лидов</p>
        ) : (
          <div className="space-y-3">
            {relatedLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  window.location.href = `/kanban?leadId=${lead.id}`;
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{lead.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{lead.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-gray-600">📍 {lead.stage_name || 'Не указан этап'}</span>
                      <span className="text-gray-600">📊 {lead.probability}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      {lead.value ? lead.value.toLocaleString() : '0'} zł
                    </p>
                    {lead.closed_at && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Закрыт</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTasksTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Задачи</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            + Создать задачу
          </button>
        </div>
        
        {relatedTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет задач</p>
        ) : (
          <div className="space-y-3">
            {relatedTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                      {task.due_date && (
                        <span className="text-gray-600">📅 {new Date(task.due_date).toLocaleDateString('ru-RU')}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status === 'completed' ? 'Завершена' :
                       task.status === 'in_progress' ? 'В работе' : 'Ожидает'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActivityTab = () => {
    const activityList = [
      { id: 1, type: 'created', description: 'Клиент создан', date: new Date().toISOString() }
    ];

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">История активности</h3>
        
        <div className="space-y-3">
          {activityList.map((activity) => (
            <div key={activity.id} className="flex gap-4 border-l-2 border-blue-500 pl-4 py-2">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.date).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">\n        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {client?.company_name || 'Детали клиента'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="border-b bg-gray-50">
          <div className="flex gap-1 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!client ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <>
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'contacts' && renderContactsTab()}
              {activeTab === 'leads' && renderLeadsTab()}
              {activeTab === 'tasks' && renderTasksTab()}
              {activeTab === 'activity' && renderActivityTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
