/**
 * API client for TaskFlow backend
 */
import axios from 'axios';

// Determine API base URL
// Use relative paths when frontend and backend are on the same domain
const getApiBaseUrl = (): string => {
  // If NEXT_PUBLIC_API_URL is explicitly set, use it
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  
  if (typeof window !== 'undefined') {
    // In browser: check if API URL matches current host
    const currentOrigin = window.location.origin; // protocol + host (no trailing slash)
    const currentHost = window.location.host;
    
    if (envApiUrl) {
      // Normalize URLs for comparison (remove trailing slashes, normalize protocol)
      const normalizedEnvUrl = envApiUrl.replace(/\/+$/, ''); // Remove trailing slashes
      const normalizedCurrentOrigin = currentOrigin.replace(/\/+$/, '');
      
      // Check if API URL matches current origin (same domain)
      if (normalizedEnvUrl === normalizedCurrentOrigin || 
          normalizedEnvUrl === normalizedCurrentOrigin.replace('http://', 'https://') || 
          normalizedEnvUrl === normalizedCurrentOrigin.replace('https://', 'http://') ||
          normalizedEnvUrl.includes(currentHost)) {
        console.log('Using relative paths - API URL matches current host');
        return ''; // Use relative paths
      }
      console.log('Using absolute API URL:', normalizedEnvUrl);
      return normalizedEnvUrl;
    }
    
    // No env var set, use relative paths (same domain)
    console.log('No API URL env var set - using relative paths');
    return '';
  }
  
  // Server-side: use env var or default to localhost
  return envApiUrl || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

// Log API URL for debugging (always log in browser)
if (typeof window !== 'undefined') {
  console.log('API Configuration:', JSON.stringify({
    baseURL: API_BASE_URL || '(empty - using relative paths)',
    currentHost: window.location.host,
    currentProtocol: window.location.protocol,
    fullOrigin: window.location.origin,
    envApiUrl: process.env.NEXT_PUBLIC_API_URL || '(not set)',
  }, null, 2));
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout - increased for slower queries
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request details for debugging
  const fullUrl = config.baseURL && config.url 
    ? `${config.baseURL}${config.url}` 
    : config.url || 'unknown';
  console.log('API Request:', JSON.stringify({
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL || '(empty - relative)',
    fullUrl: fullUrl,
    hasAuth: !!config.headers.Authorization,
  }, null, 2));
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip logging for health check endpoints (expected to potentially fail)
    const isHealthCheck = error.config?.url === '/health' || error.config?.url?.endsWith('/health');
    
    // Log error details for debugging (always log, not just in development)
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: error.config?.baseURL && error.config?.url 
        ? `${error.config.baseURL}${error.config.url}` 
        : error.config?.url || 'unknown',
      hasResponse: !!error.response,
      hasRequest: !!error.request,
    };
    
    // Only log non-health-check errors to avoid noise
    if (!isHealthCheck) {
      console.error('API Error:', JSON.stringify(errorDetails, null, 2));
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      // Enhance error message for network issues
      if (!error.response) {
        error.message = 'Unable to connect to server. Please check your connection and try again.';
        error.isNetworkError = true;
      } else if (error.code === 'ECONNABORTED') {
        error.message = 'Connection timeout. Please check your internet connection and try again.';
      }
    }
    
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  organization_id: number;
  organization_name?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  organization_id: number;
  owner_id: number;
  is_active: boolean;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: number;
  assignee_id: number | null;
  created_by_id: number;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  price: number | null;
  tags: string[];
  position_x?: number | null;
  position_y?: number | null;
  box_width?: number | null;
  box_height?: number | null;
  is_archived?: boolean;
  created_at: string;
  updated_at: string | null;
  assignee_name?: string;
  creator_name?: string;
  project_name?: string;
}

export interface Analytics {
  total_tasks: number;
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  tasks_completed_today: number;
  tasks_completed_this_week: number;
  average_completion_time_hours: number | null;
  tasks_overdue: number;
  productivity_score: number;
  top_contributors: Array<{
    user_id: number;
    name: string;
    email: string;
    tasks_completed: number;
  }>;
  total_price: number;
  price_by_status: Record<string, number>;
  price_by_priority: Record<string, number>;
}

// Auth API
export const authApi = {
  register: async (email: string, password: string, fullName?: string, orgName?: string) => {
    const response = await api.post('/api/v1/auth/register', {
      email,
      password,
      full_name: fullName,
      organization_name: orgName,
    });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', {
      email,
      password,
    });
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },
  
  updateUser: async (updates: { full_name?: string; email?: string }) => {
    const response = await api.patch('/api/v1/auth/me', updates);
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/api/v1/projects');
    return response.data;
  },
  
  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/api/v1/projects/${id}`);
    return response.data;
  },
  
  create: async (name: string, description?: string, color?: string): Promise<Project> => {
    const response = await api.post('/api/v1/projects', {
      name,
      description,
      color: color || '#3B82F6',
    });
    return response.data;
  },
  
  update: async (id: number, updates: { name?: string; description?: string; color?: string }): Promise<Project> => {
    const response = await api.patch(`/api/v1/projects/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/projects/${id}`);
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (params?: {
    project_id?: number;
    status?: string;
    assignee_id?: number;
  }): Promise<Task[]> => {
    const response = await api.get('/api/v1/tasks', { params });
    return response.data;
  },
  
  getById: async (id: number): Promise<Task> => {
    const response = await api.get(`/api/v1/tasks/${id}`);
    return response.data;
  },
  
  create: async (task: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    project_id: number;
    assignee_id?: number;
    due_date?: string;
    estimated_hours?: number;
    tags?: string[];
  }): Promise<Task> => {
    const response = await api.post('/api/v1/tasks', task);
    return response.data;
  },
  
  update: async (id: number, updates: Partial<Task>): Promise<Task> => {
    const response = await api.patch(`/api/v1/tasks/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/tasks/${id}`);
  },
  
  archive: async (id: number): Promise<Task> => {
    const response = await api.patch(`/api/v1/tasks/${id}/archive`);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async (days: number = 30): Promise<Analytics> => {
    const response = await api.get('/api/v1/analytics/dashboard', {
      params: { days },
    });
    return response.data;
  },
  
  getTimeSeries: async (days: number = 30) => {
    const response = await api.get('/api/v1/analytics/timeseries', {
      params: { days },
    });
    return response.data;
  },
};

export default api;

