'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PipelinesSettingsPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPipeline, setEditingPipeline] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [creatingStageForPipeline, setCreatingStageForPipeline] = useState<any>(null);
  const [stageFormData, setStageFormData] = useState({
    name: '',
    color: '#6366f1',
    default_probability: 50,
    position: 0
  });

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/pipelines'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPipelines(data.data);
      }
    } catch (error) {
      toast.error('Ошибка загрузки воронок');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить воронку?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/pipelines/${id}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Воронка удалена');
        loadPipelines();
      } else {
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления воронки');
    }
  };

  const handleEditStage = (pipeline: any, stage: any) => {
    setEditingPipeline(pipeline);
    setEditingStage(stage);
    setStageFormData({
      name: stage.name,
      color: stage.color,
      default_probability: stage.default_probability,
      position: stage.sort_order
    });
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !editingPipeline) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/pipelines/stages/${editingStage.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stageFormData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Этап обновлен');
        setEditingStage(null);
        setEditingPipeline(null);
        loadPipelines();
      } else {
        toast.error(data.error || 'Ошибка обновления');
      }
    } catch (error) {
      toast.error('Ошибка обновления этапа');
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Удалить этап?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/pipelines/stages/${stageId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Этап удален');
        loadPipelines();
      } else {
        toast.error(data.error || 'Ошибка удаления');
      }
    } catch (error) {
      toast.error('Ошибка удаления этапа');
    }
  };

  const handleCreateStage = (pipeline: any) => {
    setCreatingStageForPipeline(pipeline);
    setStageFormData({
      name: '',
      color: '#6366f1',
      default_probability: 50
    });
  };

  const handleSaveNewStage = async () => {
    if (!creatingStageForPipeline) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`/api/pipelines/${creatingStageForPipeline.id}/stages`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stageFormData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Этап создан');
        setCreatingStageForPipeline(null);
        loadPipelines();
      } else {
        toast.error(data.error || 'Ошибка создания');
      }
    } catch (error) {
      toast.error('Ошибка создания этапа');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Настройки воронок продаж</h1>
          <button
            onClick={() => router.push('/kanban')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Назад к Kanban
          </button>
        </div>

        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <div key={pipeline.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{pipeline.name}</h3>
                  <p className="text-gray-600 text-sm">{pipeline.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(pipeline.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Удалить
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Этапы:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pipeline.stages?.map((stage: any) => (
                    <div
                      key={stage.id}
                      className="border rounded-lg p-3 hover:shadow-md transition"
                      style={{ borderLeftColor: stage.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{stage.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stage.default_probability}% вероятность
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span className="text-xs text-gray-400">{stage.color}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditStage(pipeline, stage)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteStage(stage.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleCreateStage(pipeline)}
                  className="mt-3 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 w-full transition"
                >
                  + Добавить этап
                </button>
              </div>
            </div>
          ))}

          {pipelines.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Нет воронок продаж</p>
              <p className="text-sm mt-2">Создайте воронку на странице Kanban</p>
            </div>
          )}
        </div>

        {/* Edit Stage Modal */}
        {editingStage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setEditingStage(null);
              setEditingPipeline(null);
            }}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Редактировать этап</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={stageFormData.name}
                    onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цвет
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={stageFormData.color}
                      onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={stageFormData.color}
                      onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Вероятность по умолчанию (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stageFormData.default_probability}
                    onChange={(e) => setStageFormData({ ...stageFormData, default_probability: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Позиция (порядок)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stageFormData.position}
                    onChange={(e) => setStageFormData({ ...stageFormData, position: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = первая позиция, чем больше число - тем дальше в воронке</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => {
                    setEditingStage(null);
                    setEditingPipeline(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateStage}
                  disabled={!stageFormData.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Stage Modal */}
        {creatingStageForPipeline && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setCreatingStageForPipeline(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">Создать новый этап</h2>
              <p className="text-gray-600 text-sm mb-4">
                Воронка: <strong>{creatingStageForPipeline.name}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    value={stageFormData.name}
                    onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Новый этап"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цвет
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={stageFormData.color}
                      onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={stageFormData.color}
                      onChange={(e) => setStageFormData({ ...stageFormData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="#6366f1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Вероятность по умолчанию (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={stageFormData.default_probability}
                    onChange={(e) => setStageFormData({ ...stageFormData, default_probability: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setCreatingStageForPipeline(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveNewStage}
                  disabled={!stageFormData.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
