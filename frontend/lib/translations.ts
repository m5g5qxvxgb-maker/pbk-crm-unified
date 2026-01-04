// frontend/lib/translations.ts
// Simple i18n translations for Russian
export const translations = {
  ru: {
    // Common
    'Loading': 'Загрузка...',
    'Loading...': 'Загрузка...',
    'Save': 'Сохранить',
    'Cancel': 'Отмена',
    'Delete': 'Удалить',
    'Edit': 'Редактировать',
    'Create': 'Создать',
    'Add': 'Добавить',
    'Close': 'Закрыть',
    'Search': 'Поиск',
    'Filter': 'Фильтр',
    'Settings': 'Настройки',
    'Back': 'Назад',

    // Kanban
    'Kanban Board': 'Доска Канбан',
    'Drag & drop deals through sales pipeline': 'Перетащите лиды через этапы продаж',
    'New Lead': 'Новый лид',
    'Create Pipeline': 'Создать пайплайн',
    'Total Deals': 'Всего лидов',
    'Total Value': 'Общая стоимость',
    'Weighted Value': 'Взвешенная стоимость',
    'Avg Deal Size': 'Средний размер лида',
    'Edit Pipeline': 'Редактировать пайплайн',
    'Drop leads here': 'Перетащите лиды сюда',
    'Moved to': 'Перемещено в',

    // Leads
    'Leads': 'Лиды',
    'Lead List': 'Список лидов',
    'No leads found': 'Лиды не найдены',
    'Lead Details': 'Детали лида',
    'Add Lead': 'Добавить лид',
    'Lead Title': 'Название лида',
    'Lead Value': 'Стоимость лида',
    'Probability': 'Вероятность (%)',
    'Description': 'Описание',
    'Client': 'Клиент',
    'Pipeline': 'Пайплайн',
    'Stage': 'Этап',

    // Clients
    'Clients': 'Клиенты',
    'Client List': 'Список клиентов',
    'Client Details': 'Детали клиента',
    'Add Client': 'Добавить клиента',
    'Company Name': 'Название компании',
    'Contact Person': 'Контактное лицо',
    'Email': 'Email',
    'Phone': 'Телефон',
    'Address': 'Адрес',
    'City': 'Город',
    'Country': 'Страна',
    'Position': 'Должность',
    'View Details': 'Подробнее',
    'Edit Client': 'Редактировать клиента',
    'Delete Client': 'Удалить клиента',

    // Tasks
    'Tasks': 'Задачи',
    'New Task': 'Новая задача',
    'Create Task': 'Создать задачу',
    'Task Title': 'Название задачи',
    'Task Description': 'Описание задачи',
    'Due Date': 'Дата выполнения',
    'Priority': 'Приоритет',
    'High': 'Высокий',
    'Medium': 'Средний',
    'Low': 'Низкий',
    'Status': 'Статус',
    'Pending': 'В ожидании',
    'Completed': 'Завершена',
    'Task created successfully': 'Задача создана успешно',
    'Failed to create task': 'Не удалось создать задачу',

    // Calls
    'Calls': 'Звонки',
    'Schedule Call': 'Запланировать звонок',
    'Call scheduled': 'Звонок запланирован',
    'Date': 'Дата',
    'Time': 'Время',
    'Call Time': 'Время звонка',
    'Call Date': 'Дата звонка',

    // Notes
    'Notes': 'Заметки',
    'Add Note': 'Добавить заметку',
    'Note': 'Заметка',
    'Note content is required': 'Содержание заметки обязательно',
    'Note added successfully': 'Заметка добавлена успешно',

    // Actions
    'Call': 'Звонок',
    'Task': 'Задача',

    // Dashboard
    'Dashboard': 'Панель управления',
    'Welcome': 'Добро пожаловать',
    'AI Assistant': 'AI Ассистент',
    'Ask me anything': 'Спросите у меня что угодно',

    // Pipelines
    'Pipelines': 'Пайплайны',
    'Pipeline Name': 'Название пайплайна',
    'New Pipeline': 'Новый пайплайн',

    // Settings
    'Language': 'Язык',
    'Theme': 'Тема',
    'Logout': 'Выход',

    // Messages
    'Успешно': 'Успешно',
    'Ошибка': 'Ошибка',
    'Подтверждение': 'Подтверждение',
    'Are you sure': 'Вы уверены?',
    'Success': 'Успешно',
    'Error': 'Ошибка',
    'No data': 'Нет данных',
    'Failed to load': 'Не удалось загрузить',
    'updated successfully': 'успешно обновлено',
    'deleted successfully': 'успешно удалено',
    'created successfully': 'успешно создано',

    // Related Data
    'Related Leads': 'Связанные лиды',
    'Active Leads': 'Активные лиды',
    'Deal History': 'История сделок',
    'Activities': 'Активность',
    'Contacts': 'Контакты',
    'Contact People': 'Контактные лица',
    'Client Contacts': 'Контакты клиента',
    'No contacts': 'Нет контактов',
    'No tasks': 'Нет задач',
    'No activities': 'Нет активности',

    // Form Validation
    'This field is required': 'Это поле обязательно',
    'Invalid email': 'Неверный email',
    'Password is required': 'Пароль обязателен',
    'Passwords do not match': 'Пароли не совпадают',

    // API Messages
    'Failed to save': 'Не удалось сохранить',
    'Failed to delete': 'Не удалось удалить',
    'Failed to load data': 'Не удалось загрузить данные',
    'Network error': 'Ошибка сети',
  }
};

// Hook to get translation
export function useTranslation() {
  const t = (key: string) => {
    return translations.ru[key as keyof typeof translations.ru] || key;
  };

  return { t };
}
