const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export const getApiUrl = (path: string) => {
  return `${API_URL}${path}`;
};

// Заглушки для обратной совместимости
export const authAPI = {};
export const callsAPI = {};
export const clientsAPI = {};
export const leadsAPI = {};
export const emailsAPI = {};
export const proposalsAPI = {};
export const pipelinesAPI = {};
export const usersAPI = {};
export const settingsAPI = {};

export default API_URL;
