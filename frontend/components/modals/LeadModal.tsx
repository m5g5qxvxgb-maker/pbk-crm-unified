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
  const [activities, setActivities] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  
  // Modals for creating tasks/calls
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    value: 0,
    probability: 50,
    client_id: '',
    pipeline_id: '',
    stage_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_position: '',
    company_name: '',
    object_address: ''
  });
  
  const [taskFormData, setTaskFormData] = useState<any>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'pending'
  });
  
  const [callFormData, setCallFormData] = useState<any>({
    scheduled_at: '',
    notes: '',
    phone_number: ''
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
        setIsEditing(true); // Enable editing mode for new lead
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
        
        // Load stages for first pipeline
        await loadStagesForPipeline(firstPipeline.id, token);
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadStagesForPipeline = async (pipelineId: string, token?: string) => {
    if (!token) token = localStorage.getItem('token') || '';
    
    try {
      const response = await fetch(getApiUrl(`/api/pipelines/${pipelineId}/stages`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data?.length > 0) {
        setStages(data.data);
        setFormData(prev => ({ ...prev, stage_id: data.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load stages:', error);
    }
  };

  const loadLead = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    try {
      const [leadRes, clientsRes, pipelinesRes] = await Promise.all([
        fetch(getApiUrl(`/api/leads/${leadId}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(getApiUrl('/api/clients'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(getApiUrl('/api/pipelines'), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      if (leadRes.success) {
        setLead(leadRes.data);
        setFormData(leadRes.data);
        setIsEditing(false);
        
        setCallFormData(prev => ({
          ...prev,
          phone_number: leadRes.data.contact_phone || ''
        }));
      }
      
      if (clientsRes.success) setClients(clientsRes.data);
      if (pipelinesRes.success) {
        setPipelines(pipelinesRes.data);
        
        if (leadRes.data?.pipeline_id) {
          await loadStagesForPipeline(leadRes.data.pipeline_id, token);
        }
      }
      
      if (leadRes.success && leadRes.data) {
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
      const [tasksRes, callsRes] = await Promise.all([
        fetch(getApiUrl(`/api/tasks?lead_id=${id}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch(getApiUrl(`/api/calls?lead_id=${id}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json())
      ]);

      if (tasksRes.success) {
        setRelatedTasks(tasksRes.data || []);
      }
      
      if (callsRes.success) {
        setRelatedCalls(callsRes.data || []);
      }
    } catch (error) {
      console.error('Failed to load related data:', error);
    }

    // Load files
    loadFiles(id);
    
    // Load activities
    loadActivities(id);
  };

  const loadActivities = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/activities/lead/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleAddComment = async (activityId: string) => {
    const comment = newComment[activityId]?.trim();
    if (!comment) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/activities/${activityId}/comments`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Комментарий добавлен');
        setNewComment(prev => ({ ...prev, [activityId]: '' }));
        if (leadId) loadActivities(leadId);
      } else {
        toast.error(data.error || 'Ошибка добавления комментария');
      }
    } catch (error) {
      toast.error('Ошибка добавления комментария');
    }
  };

  const loadFiles = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/uploads/lead/${id}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRelatedFiles(data.attachments || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !leadId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('lead_id', leadId);
    formData.append('file_type', 'document');

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl('/api/uploads'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Файл загружен');
        loadFiles(leadId);
      } else {
        toast.error(data.error || 'Ошибка загрузки файла');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Ошибка загрузки файла');
    }

    // Reset input
    event.target.value = '';
  };

  const handleFileDownload = async (fileId: string, filename: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/uploads/${fileId}/download`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Ошибка скачивания файла');
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Удалить файл?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiUrl(`/api/uploads/${fileId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Файл удален');
        if (leadId) loadFiles(leadId);
      } else {
        toast.error(data.error || 'Ошибка удаления файла');
      }
    } catch (error) {
      toast.error('Ошибка удаления файла');
    }
  };

  const handleSave = async () => {
    console.log('handleSave called with formData:', formData);
    
    if (!formData.title) {
      toast.error('Название лида обязательно');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const method = isCreating ? 'POST' : 'PUT';
      const url = isCreating 
        ? getApiUrl('/api/leads')
        : getApiUrl(`/api/leads/${leadId}`);

      console.log(`Sending ${method} request to ${url}`);
      console.log('Request body:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        toast.success(isCreating ? 'Лид создан' : 'Лид обновлен');
        setIsEditing(false);
        setIsCreating(false);
        if (onUpdate) onUpdate();
        if (isCreating) onClose();
        else loadLead();
      } else {
        toast.error(data.error || 'Ошибка сохранения');
        console.error('Save failed:', data.error);
      }
    } catch (error: any) {
      console.error('handleSave error:', error);
      toast.error('Ошибка сохранения лида: ' + (error.message || ''));
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

  const handleCreateTask = async () => {
    if (!taskFormData.title) {
      toast.error('Введите название задачи');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/tasks'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...taskFormData,
          lead_id: leadId
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Задача создана');
        setShowTaskModal(false);
        setTaskFormData({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
        loadRelatedData(leadId!);
      } else {
        toast.error(data.error || 'Ошибка создания задачи');
      }
    } catch (error) {
      toast.error('Ошибка создания задачи');
    }
  };

  const handleScheduleCall = async () => {
    if (!callFormData.phone_number) {
      toast.error('Выберите номер телефона');
      return;
    }

    // For immediate calls, scheduled_at is optional
    const isImmediate = !callFormData.scheduled_at;

    console.log('handleScheduleCall called:', { leadId, callFormData, isImmediate });

    try {
      const token = localStorage.getItem('token');
      const payload = {
        lead_id: leadId,
        phone_number: callFormData.phone_number,
        scheduled_at: isImmediate ? new Date().toISOString() : callFormData.scheduled_at,
        notes: callFormData.notes,
        status: isImmediate ? 'completed' : 'scheduled'
      };
      
      console.log('Sending call request:', payload);
      
      const response = await fetch(getApiUrl('/api/calls'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Call response:', data);
      
      if (data.success) {
        toast.success(isImmediate ? 'Звонок записан' : 'Звонок запланирован');
        setShowCallModal(false);
        setCallFormData({ scheduled_at: '', notes: '', phone_number: lead?.contact_phone || '' });
        loadRelatedData(leadId!);
      } else {
        toast.error(data.error || 'Ошибка сохранения звонка');
        console.error('Call creation failed:', data.error);
      }
    } catch (error: any) {
      console.error('handleScheduleCall error:', error);
      toast.error('Ошибка сохранения звонка: ' + (error.message || ''));
    }
  };

  const handleCallNow = async () => {
    if (!callFormData.phone_number) {
      toast.error('Выберите номер телефона');
      return;
    }

    console.log('handleCallNow called:', { leadId, phone: callFormData.phone_number });

    try {
      const token = localStorage.getItem('token');
      const payload = {
        lead_id: leadId,
        phone_number: callFormData.phone_number,
        scheduled_at: new Date().toISOString(),
        notes: callFormData.notes,
        status: 'completed'
      };
      
      console.log('Sending call now request:', payload);
      
      const response = await fetch(getApiUrl('/api/calls'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('Call now response:', data);
      
      if (data.success) {
        toast.success('Звонок записан');
        setShowCallModal(false);
        setCallFormData({ scheduled_at: '', notes: '', phone_number: lead?.contact_phone || '' });
        loadRelatedData(leadId!);
      } else {
        toast.error(data.error || 'Ошибка создания звонка');
        console.error('Call now failed:', data.error);
      }
    } catch (error: any) {
      console.error('handleCallNow error:', error);
      toast.error('Ошибка создания звонка: ' + (error.message || ''));
    }
  };

  const handleQuickStageChange = async (newStageId: string) => {
    console.log('handleQuickStageChange called with:', newStageId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/leads/${leadId}/stage`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stage_id: newStageId
        })
      });

      const data = await response.json();
      console.log('Quick stage change response:', data);
      
      if (data.success) {
        toast.success('Этап изменен');
        loadLead();
        if (onUpdate) onUpdate();
      } else {
        toast.error(data.error || 'Ошибка изменения этапа');
      }
    } catch (error: any) {
      console.error('handleQuickStageChange error:', error);
      toast.error('Ошибка изменения этапа: ' + (error.message || ''));
    }
  };

  const handleCreateClientFromContact = async () => {
    if (!lead?.contact_name && !lead?.contact_email && !lead?.contact_phone) {
      toast.error('Нет контактных данных для создания клиента');
      return;
    }

    if (!confirm('Создать клиента из контактного лица?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/clients'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: lead.contact_name || 'Клиент из лида',
          contact_person: lead.contact_position || '',
          email: lead.contact_email,
          phone: lead.contact_phone,
          notes: `Создан из лида: ${lead.title}`
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Клиент создан');
        
        // Link lead to new client
        const updateResponse = await fetch(getApiUrl(`/api/leads/${leadId}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            client_id: data.data.id
          })
        });

        if (updateResponse.ok) {
          toast.success('Лид связан с клиентом');
          loadLead();
        }
      } else {
        toast.error(data.error || 'Ошибка создания клиента');
      }
    } catch (error) {
      toast.error('Ошибка создания клиента');
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
              <p className="text-sm text-gray-500">ID лида</p>
              <p className="text-sm font-mono text-blue-600">{lead.unique_id || lead.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Название</p>
              <p className="text-lg font-semibold text-gray-900">{lead.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Стоимость</p>
              <p className="text-lg font-semibold text-green-600">{lead.value?.toLocaleString()} zł</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Вероятность</p>
              <p className="text-lg text-gray-900">{lead.probability}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Этап</p>
              {stages.length > 0 ? (
                <select
                  value={lead.stage_id || ''}
                  onChange={(e) => handleQuickStageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-gray-900">{lead.stage_name || 'Не указан'}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Клиент</p>
              <p className="text-lg text-gray-900">{lead.client_name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Пайплайн</p>
              <p className="text-lg text-gray-900">{lead.pipeline_name || '-'}</p>
            </div>
            {lead.company_name && (
              <div>
                <p className="text-sm text-gray-500">Название компании</p>
                <p className="text-lg text-gray-900">{lead.company_name}</p>
              </div>
            )}
            {lead.object_address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Адрес объекта</p>
                <p className="text-lg text-gray-900">{lead.object_address}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          {(lead.contact_name || lead.contact_email || lead.contact_phone) && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-semibold text-gray-900">Контактное лицо</h4>
                {!lead.client_id && (
                  <button
                    onClick={handleCreateClientFromContact}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Создать клиента
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {lead.contact_name && (
                  <div>
                    <p className="text-sm text-gray-500">Имя</p>
                    <p className="text-gray-900">{lead.contact_name}</p>
                  </div>
                )}
                {lead.contact_position && (
                  <div>
                    <p className="text-sm text-gray-500">Должность</p>
                    <p className="text-gray-900">{lead.contact_position}</p>
                  </div>
                )}
                {lead.contact_email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{lead.contact_email}</p>
                  </div>
                )}
                {lead.contact_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="text-gray-900">{lead.contact_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость (PLN)</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пайплайн</label>
            <select
              value={formData.pipeline_id}
              onChange={(e) => {
                setFormData({ ...formData, pipeline_id: e.target.value });
                loadStagesForPipeline(e.target.value);
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
              value={formData.stage_id || ''}
              onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={stages.length === 0}
            >
              {stages.length === 0 && (
                <option value="">Загрузка стадий...</option>
              )}
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {stages.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Выберите пайплайн для загрузки стадий</p>
            )}
          </div>
        </div>

        {/* Contact Person Fields */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Контактное лицо</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя контакта</label>
              <input
                type="text"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input
                type="text"
                value={formData.contact_position || ''}
                onChange={(e) => setFormData({ ...formData, contact_position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email контакта</label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон контакта</label>
              <input
                type="tel"
                value={formData.contact_phone || ''}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Company and Address Fields */}
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Дополнительная информация</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название компании</label>
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Адрес объекта</label>
              <input
                type="text"
                value={formData.object_address || ''}
                onChange={(e) => setFormData({ ...formData, object_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>История активности пуста</p>
              <p className="text-sm mt-1">Действия с лидом будут отображаться здесь</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {activity.activity_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {activity.user_name || 'Система'}
                      </p>
                      <span className="text-gray-400">•</span>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comments section */}
                {activity.comments && activity.comments.length > 0 && (
                  <div className="mt-3 space-y-2 pl-4 border-l border-gray-300">
                    {activity.comments.map((comment: any) => (
                      <div key={comment.id} className="bg-white p-2 rounded text-sm">
                        <p className="text-gray-800">{comment.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.user_name} • {new Date(comment.created_at).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Добавить комментарий..."
                    value={newComment[activity.id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [activity.id]: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(activity.id);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleAddComment(activity.id)}
                    disabled={!newComment[activity.id]?.trim()}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Отправить
                  </button>
                </div>
              </div>
            ))
          )}
          
          {/* Initial creation activity */}
          <div className="border-l-2 border-gray-300 pl-4 py-2 opacity-60">
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
          <button 
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
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

        {/* Task Creation Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Создать задачу</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                  <textarea
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                  <input
                    type="datetime-local"
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setTaskFormData({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </div>
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
          <button 
            onClick={() => setShowCallModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + Запланировать звонок
          </button>
        </div>

        {relatedCalls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет звонков</p>
        ) : (
          <div className="space-y-3">
            {relatedCalls.map((call) => {
              const scheduledDate = call.scheduled_at ? new Date(call.scheduled_at) : null;
              const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime());
              
              return (
                <div key={call.id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        📞 {call.phone_number || 'Нет номера'} 
                        {call.duration && call.status === 'completed' && ` (${call.duration} мин)`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {isValidDate 
                          ? `${scheduledDate.toLocaleDateString('ru-RU')} ${scheduledDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Дата не указана'
                        }
                      </p>
                      {call.notes && <p className="text-sm text-gray-600 mt-1">{call.notes}</p>}
                      <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
                        call.status === 'completed' ? 'bg-green-100 text-green-800' :
                        call.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {call.status === 'completed' ? 'Завершен' : 
                         call.status === 'scheduled' ? 'Запланирован' : 
                         call.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call Scheduling Modal */}
        {showCallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Звонок</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Номер телефона *</label>
                  {lead?.contact_phone ? (
                    <select
                      value={callFormData.phone_number}
                      onChange={(e) => setCallFormData({ ...callFormData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Выберите номер --</option>
                      <option value={lead.contact_phone}>{lead.contact_phone} (Контакт лида)</option>
                    </select>
                  ) : (
                    <input
                      type="tel"
                      value={callFormData.phone_number}
                      onChange={(e) => setCallFormData({ ...callFormData, phone_number: e.target.value })}
                      placeholder="+48 123 456 789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата и время (опционально)</label>
                  <input
                    type="datetime-local"
                    value={callFormData.scheduled_at}
                    onChange={(e) => setCallFormData({ ...callFormData, scheduled_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым для немедленного звонка</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                  <textarea
                    value={callFormData.notes}
                    onChange={(e) => setCallFormData({ ...callFormData, notes: e.target.value })}
                    rows={3}
                    placeholder="Результат разговора, комментарии..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCallNow}
                  disabled={!callFormData.phone_number}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  📞 Позвонить сейчас
                </button>
                <button
                  onClick={handleScheduleCall}
                  disabled={!callFormData.phone_number || !callFormData.scheduled_at}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  📅 Запланировать
                </button>
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    setCallFormData({ scheduled_at: '', notes: '', phone_number: lead?.contact_phone || '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </div>
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
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
            ⬆️ Загрузить файл
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar"
            />
          </label>
        </div>

        {relatedFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Нет файлов</p>
        ) : (
          <div className="space-y-3">
            {relatedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 hover:shadow-md flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">📄 {file.original_filename}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.file_size / 1024 / 1024).toFixed(2)} МБ · {new Date(file.created_at).toLocaleDateString('ru-RU')} · {file.uploaded_by_name}
                  </p>
                  {file.description && (
                    <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFileDownload(file.id, file.original_filename)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    ⬇️ Скачать
                  </button>
                  <button
                    onClick={() => handleFileDelete(file.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
