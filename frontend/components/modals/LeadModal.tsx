'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, DocumentIcon, CheckCircleIcon, PhoneIcon, PaperClipIcon, ClockIcon } from '@heroicons/react/24/outline';

interface LeadModalProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabType = 'details' | 'history' | 'tasks' | 'calls' | 'files';

export default function LeadModal({ leadId, isOpen, onClose, onUpdate }: LeadModalProps) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [relatedCalls, setRelatedCalls] = useState<any[]>([]);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    value: 0,
    probability: 50,
    client_id: '',
    pipeline_id: '',
    stage_id: ''
  });
  const [clients, setClients] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (leadId) {
        setIsCreating(false);
        loadLead();
      } else {
        setIsCreating(true);
        loadCreateData();
      }
    } else {
      setLead(null);
      setLoading(true);
      setActiveTab('details');
    }
  }, [isOpen, leadId]);

  const loadCreateData = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const [clientsRes, pipelinesRes] = await Promise.all([
        fetch(getApiUrl('/api/clients'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(getApiUrl('/api/pipelines'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      if (clientsRes.success) setClients(clientsRes.data);

      if (pipelinesRes.success && pipelinesRes.data?.length > 0) {
        setPipelines(pipelinesRes.data);
        const firstPipeline = pipelinesRes.data[0];
        setFormData(prev => ({ ...prev, pipeline_id: firstPipeline.id }));
        if (firstPipeline.stages) {
          setStages(firstPipeline.stages);
          setFormData(prev => ({ ...prev, stage_id: firstPipeline.stages[0].id }));
        }
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadLead = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const response = await fetch(getApiUrl(`/api/leads/${leadId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setLead(data.data);
        setFormData(data.data);
        setIsEditing(false);
        loadRelatedData(leadId);
      }
    } catch (error) {
      toast.error('Ошибка загрузки лида');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (id: string) => {
    const token = localStorage.getItem('token');

    try {
      const tasksRes = await fetch(getApiUrl(`/api/tasks?lead_id=${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      if (tasksRes.success) {
        setRelatedTasks(tasksRes.data.filter((t: any) => t.lead_id === id));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }

    // Mock calls и files для примера
    setRelatedCalls([
      { id: 1, date: new Date().toISOString(), time: '10:00', duration: 15, notes: 'Обсудили условия' }
    ]);

    setRelatedFiles([
      { id: 1, name: 'contract.pdf', size: 512000, uploadedAt: new Date().toISOString() },
      { id: 2, name: 'proposal.docx', size: 256000, uploadedAt: new Date().toISOString() }
    ]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isCreating ? 'POST' : 'PUT';
      const url = isCreating 
        ? getApiUrl('/api/leads')
        : getApiUrl(`/api/leads/${leadId}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(isCreating ? 'Лид создан' : 'Лид обновлен');
        setIsEditing(false);
        setIsCreating(false);
        if (onUpdate) onUpdate();
        if (isCreating) onClose();
        else loadLead();
      } else {
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch (error) {
      toast.error('Ошибка сохранения лида');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот лид?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/leads/${leadId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Лид удален');
        if (onUpdate) onUpdate();
        onClose();
      } else {
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления лида');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'details' as TabType, label: 'Детали', icon: DocumentIcon },
    { id: 'history' as TabType, label: 'История', icon: ClockIcon },
    { id: 'tasks' as TabType, label: `Задачи (${relatedTasks.length})`, icon: CheckCircleIcon },
    { id: 'calls' as TabType, label: `Звонки (${relatedCalls.length})`, icon: PhoneIcon },
    { id: 'files' as TabType, label: `Файлы (${relatedFiles.length})`, icon: PaperClipIcon }
  ];

  const renderDetailsTab = () => {
    if (!isEditing && !isCreating) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Название</p>
              <p className="text-lg font-semibold text-gray-900">{lead.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Стоимость</p>
              <p className="text-lg font-semibold text-green-600">${lead.value?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Вероятность</p>
              <p className="text-lg text-gray-900">{lead.probability}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Этап</p>
              <p className="text-lg text-gray-900">{lead.stage_name || 'Не указан'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Клиент</p>
              <p className="text-lg text-gray-900">{lead.client_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Пайплайн</p>
              <p className="text-lg text-gray-900">{lead.pipeline_name || '-'}</p>
            </div>
          </div>

          {lead.description && (
            <div>
              <p className="text-sm text-gray-500">Описание</p>
              <p className="text-gray-900 whitespace-pre-wrap">{lead.description}</p>
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

    // Edit/Create mode
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Вероятность (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клиент</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Выберите клиента --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пайплайн</label>
            <select
              value={formData.pipeline_id}
              onChange={(e) => {
                const pipeline = pipelines.find(p => p.id === e.target.value);
                setFormData({ ...formData, pipeline_id: e.target.value, stage_id: pipeline?.stages?.[0]?.id || '' });
                if (pipeline?.stages) setStages(pipeline.stages);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Этап</label>
            <select
              value={formData.stage_id}
              onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={loading || !formData.title}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setIsCreating(false);
              if (isCreating) onClose();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">История изменений</h3>
        <div className="space-y-3">
          <div className="flex gap-4 border-l-2 border-blue-500 pl-4 py-2">
            <div className="flex-1">
              <p className="text-sm text-gray-900">Лид создан</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(lead?.created_at).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>
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
              <div key={task.id} className="border rounded-lg p-4 hover:shadow-md">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
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
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCallsTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Звонки</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            + Запланировать звонок
          </button>
        </div>

        {relatedCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет звонков</p>
        ) : (
          <div className="space-y-3">
            {relatedCalls.map((call) => (
              <div key={call.id} className="border rounded-lg p-4 hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">📞 {call.time} ({call.duration} мин)</p>
                    <p className="text-sm text-gray-600 mt-1">{call.notes}</p>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(call.date).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFilesTab = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Файлы</h3>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            ⬆️ Загрузить файл
          </button>
        </div>

        {relatedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет файлов</p>
        ) : (
          <div className="space-y-3">
            {relatedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 hover:shadow-md flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">📄 {file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} МБ · {new Date(file.uploadedAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                  ⬇️ Скачать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {lead?.title || 'Новый лид'}
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
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Загрузка...</p>
            </div>
          ) : (
            <>
              {activeTab === 'details' && renderDetailsTab()}
              {activeTab === 'history' && renderHistoryTab()}
              {activeTab === 'tasks' && renderTasksTab()}
              {activeTab === 'calls' && renderCallsTab()}
              {activeTab === 'files' && renderFilesTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
