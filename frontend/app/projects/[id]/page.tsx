'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import AppLayout from '../../../components/layout/AppLayout';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'general',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [categories] = useState([
    { value: 'materials', label: 'Материалы', icon: '🛠️' },
    { value: 'labor', label: 'Работа', icon: '👷' },
    { value: 'equipment', label: 'Оборудование', icon: '🔧' },
    { value: 'transport', label: 'Транспорт', icon: '🚚' },
    { value: 'subcontractors', label: 'Субподрядчики', icon: '🤝' },
    { value: 'general', label: 'Общие расходы', icon: '💰' },
  ]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [projectRes, analyticsRes, expensesRes] = await Promise.all([
        fetch(getApiUrl(`/api/projects/${projectId}`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(getApiUrl(`/api/projects/${projectId}/analytics`), {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(getApiUrl(`/api/projects/${projectId}/expenses`), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const projectData = await projectRes.json();
      const analyticsData = await analyticsRes.json();
      const expensesData = await expensesRes.json();

      setProject(projectData);
      setAnalytics(analyticsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/expenses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseForm,
          project_id: projectId
        })
      });

      if (response.ok) {
        setShowExpenseModal(false);
        setExpenseForm({
          amount: '',
          category: 'general',
          description: '',
          expense_date: new Date().toISOString().split('T')[0],
          notes: ''
        });
        fetchProjectData();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626'
    };
    return colors[level] || '#6B7280';
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
          <div style={{ fontSize: '1.25rem' }}>Загрузка...</div>
        </div>
      </AppLayout>
    );
  }

  if (!project || !analytics) {
    return (
      <AppLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Проект не найден</h2>
        </div>
      </AppLayout>
    );
  }

  const { summary, variance, forecast, risk, trends } = analytics;

  return (
    <AppLayout>
      <div style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => router.push('/projects')}
            style={{ 
              marginBottom: '1rem', 
              color: '#3B82F6', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← Назад к проектам
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{project.name}</h1>
              <p style={{ color: '#6B7280', marginTop: '0.25rem' }}>{project.client_name}</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #10B981, #059669)',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              + Добавить расход
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {summary.deal_amount && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '0.75rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '2px solid #3B82F6'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Сумма сделки</div>
              <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#3B82F6' }}>
                {parseFloat(summary.deal_amount).toLocaleString()} PLN
              </div>
            </div>
          )}

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Плановый бюджет</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>
              {parseFloat(summary.budget_amount).toLocaleString()} PLN
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Потрачено</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#EF4444' }}>
              {parseFloat(summary.total_spent).toLocaleString()} PLN
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
              {parseFloat(summary.spent_percentage).toFixed(1)}% от бюджета
            </div>
          </div>

          {summary.profit !== null && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '0.75rem', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: `2px solid ${parseFloat(summary.profit) >= 0 ? '#10B981' : '#EF4444'}`
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Прибыль</div>
              <div style={{ 
                fontSize: '1.875rem', 
                fontWeight: 'bold', 
                color: parseFloat(summary.profit) >= 0 ? '#10B981' : '#EF4444' 
              }}>
                {parseFloat(summary.profit).toLocaleString()} PLN
              </div>
              {summary.profit_margin !== null && (
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  Маржа: {parseFloat(summary.profit_margin).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Forecast & Analytics */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>📊 Прогноз и аналитика</h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Средний расход в день</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                  {forecast.daily_burn_rate ? forecast.daily_burn_rate.toLocaleString() : '0'} PLN/день
                </div>
              </div>

              {forecast.projected_total_cost && (
                <div style={{ padding: '1rem', backgroundColor: '#FEF3C7', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#92400E', marginBottom: '0.5rem' }}>Прогноз итоговых затрат</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#92400E' }}>
                    {forecast.projected_total_cost.toLocaleString()} PLN
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.25rem' }}>
                    На дату окончания проекта
                  </div>
                </div>
              )}

              {forecast.days_of_budget_remaining && (
                <div style={{ padding: '1rem', backgroundColor: '#DBEAFE', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#1E40AF', marginBottom: '0.5rem' }}>Дней до исчерпания бюджета</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1E40AF' }}>
                    ~{forecast.days_of_budget_remaining} дней
                  </div>
                  {forecast.estimated_completion_date && (
                    <div style={{ fontSize: '0.75rem', color: '#1E40AF', marginTop: '0.25rem' }}>
                      До {new Date(forecast.estimated_completion_date).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Risk Assessment */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.75rem', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `3px solid ${getRiskColor(risk.level)}`
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>⚠️ Оценка рисков</h3>
            
            <div style={{ 
              padding: '1rem', 
              backgroundColor: `${getRiskColor(risk.level)}15`,
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>Уровень риска</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: getRiskColor(risk.level),
                textTransform: 'uppercase'
              }}>
                {risk.level === 'low' && 'Низкий'}
                {risk.level === 'medium' && 'Средний'}
                {risk.level === 'high' && 'Высокий'}
                {risk.level === 'critical' && 'Критический'}
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{risk.message}</p>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Отклонение от бюджета</div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600',
                color: variance.amount >= 0 ? '#10B981' : '#EF4444'
              }}>
                {variance.amount.toLocaleString()} PLN
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>💰 Расходы</h3>
          
          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div>
              <p>Нет расходов</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Дата</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Категория</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', color: '#6B7280' }}>Описание</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#6B7280' }}>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {new Date(expense.expense_date).toLocaleDateString('ru-RU')}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        <span>{expense.icon} {expense.category}</span>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{expense.description}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', textAlign: 'right' }}>
                        {parseFloat(expense.amount).toLocaleString()} PLN
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expense Modal */}
        {showExpenseModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '32rem',
              width: '100%',
              padding: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Добавить расход</h2>
              
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Сумма (PLN) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Категория *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Описание *
                  </label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Дата расхода *
                  </label>
                  <input
                    type="date"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Примечания
                  </label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #D1D5DB',
                      color: '#374151',
                      borderRadius: '0.5rem',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(to right, #10B981, #059669)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Добавить
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
