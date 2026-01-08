'use client';
import { getApiUrl } from '@/lib/api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/layout/AppLayout';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    deal_amount: '',
    budget_amount: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/projects'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/clients'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/projects'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setShowModal(false);
        setFormData({ name: '', client_id: '', deal_amount: '', budget_amount: '', start_date: '', end_date: '', description: '' });
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskLevel = (percentage) => {
    if (percentage >= 100) return { level: 'critical', color: 'bg-red-500', text: 'Превышение!' };
    if (percentage >= 90) return { level: 'high', color: 'bg-orange-500', text: 'Высокий' };
    if (percentage >= 75) return { level: 'medium', color: 'bg-yellow-500', text: 'Средний' };
    return { level: 'low', color: 'bg-emerald-500', text: 'Низкий' };
  };

  const filteredProjects = projects.filter(p => 
    filterStatus === 'all' || p.status === filterStatus
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Проекты и бюджеты</h1>
              <p className="text-gray-600">Управление проектами, контроль бюджетов и прогноз прибыли</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">+</span>
                Новый проект
              </span>
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-sm text-blue-600 font-medium mb-1">Всего проектов</div>
              <div className="text-2xl font-bold text-blue-900">{projects.length}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
              <div className="text-sm text-emerald-600 font-medium mb-1">Активных</div>
              <div className="text-2xl font-bold text-emerald-900">
                {projects.filter(p => p.status === 'active').length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="text-sm text-purple-600 font-medium mb-1">Общий бюджет</div>
              <div className="text-2xl font-bold text-purple-900">
                {projects.reduce((sum, p) => sum + parseFloat(p.budget_amount || 0), 0).toLocaleString()} PLN
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
              <div className="text-sm text-amber-600 font-medium mb-1">Общая прибыль</div>
              <div className="text-2xl font-bold text-amber-900">
                {projects.reduce((sum, p) => sum + parseFloat(p.profit || 0), 0).toLocaleString()} PLN
              </div>
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {status === 'all' ? 'Все' : status === 'active' ? 'Активные' : status === 'completed' ? 'Завершенные' : 'Отмененные'}
                </button>
              ))}
            </div>
            <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">⊞</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded transition-all ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Нет проектов</h3>
            <p className="text-gray-600 mb-6">Создайте первый проект для управления бюджетом</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Создать проект
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredProjects.map((project) => {
              const percentage = parseFloat(project.spent_percentage) || 0;
              const remaining = parseFloat(project.remaining) || 0;
              const profit = parseFloat(project.profit) || 0;
              const risk = getRiskLevel(percentage);
              
              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className={`bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 ${
                    viewMode === 'list' ? 'p-4' : 'p-6'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                          <p className="text-sm text-gray-600">{project.client_name}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>

                      {/* Financial Metrics */}
                      <div className="space-y-2 mb-4">
                        {project.deal_amount && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">💵 Сумма сделки:</span>
                            <span className="font-semibold text-blue-600">{parseFloat(project.deal_amount).toLocaleString()} PLN</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">📋 Плановый бюджет:</span>
                          <span className="font-semibold text-gray-900">{parseFloat(project.budget_amount).toLocaleString()} PLN</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">💸 Потрачено:</span>
                          <span className="font-semibold text-red-600">{parseFloat(project.total_spent || 0).toLocaleString()} PLN</span>
                        </div>
                        {profit !== 0 && project.deal_amount && (
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-700 font-medium">💰 Прибыль:</span>
                            <span className={`font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {profit.toLocaleString()} PLN
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                          <span>Использование бюджета</span>
                          <span className="font-semibold">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full ${risk.color} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-xs font-medium ${
                            percentage >= 100 ? 'text-red-600' : 
                            percentage >= 75 ? 'text-yellow-600' : 'text-emerald-600'
                          }`}>
                            {risk.text}
                          </span>
                          <span className="text-xs text-gray-500">📝 {project.expense_count || 0} расходов</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    // List View
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex items-center gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600">{project.client_name}</p>
                        </div>
                        <div className="flex items-center gap-8">
                          {project.deal_amount && (
                            <div>
                              <div className="text-xs text-gray-500">Сумма сделки</div>
                              <div className="text-sm font-semibold text-blue-600">{parseFloat(project.deal_amount).toLocaleString()} PLN</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-500">Бюджет</div>
                            <div className="text-sm font-semibold">{parseFloat(project.budget_amount).toLocaleString()} PLN</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Потрачено</div>
                            <div className="text-sm font-semibold text-red-600">{parseFloat(project.total_spent || 0).toLocaleString()} PLN</div>
                          </div>
                          {profit !== 0 && (
                            <div>
                              <div className="text-xs text-gray-500">Прибыль</div>
                              <div className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {profit.toLocaleString()} PLN
                              </div>
                            </div>
                          )}
                          <div className="w-32">
                            <div className="text-xs text-gray-500 mb-1">{percentage.toFixed(0)}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-full ${risk.color} rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)} ml-4`}>
                        {project.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-gray-900">Создать новый проект</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Название проекта *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Например: Ремонт офиса"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Клиент
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  >
                    <option value="">Выберите клиента</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name || client.contact_person}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      💵 Сумма сделки (PLN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deal_amount}
                      onChange={(e) => setFormData({ ...formData, deal_amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="50000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Договоренная сумма с клиентом</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📋 Плановый бюджет (PLN) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.budget_amount}
                      onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="35000"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Планируемые затраты</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Дата начала
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Дата окончания
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none"
                    rows={3}
                    placeholder="Опишите проект..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    Создать проект
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
