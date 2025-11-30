/**
 * Task store using Zustand
 */
import { create } from 'zustand';
import { tasksApi, Task, projectsApi, Project, analyticsApi, Analytics } from '@/lib/api';

interface TaskState {
  tasks: Task[];
  projects: Project[];
  selectedProject: number | null;
  analytics: Analytics | null;
  isLoading: boolean;
  fetchTasks: (params?: { project_id?: number; status?: string }) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchAnalytics: (days?: number) => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  setSelectedProject: (projectId: number | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  projects: [],
  selectedProject: null,
  analytics: null,
  isLoading: false,

  fetchTasks: async (params) => {
    set({ isLoading: true });
    try {
      const tasks = await tasksApi.getAll(params);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await projectsApi.getAll();
      set({ projects });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  },

  fetchAnalytics: async (days = 30) => {
    try {
      const analytics = await analyticsApi.getDashboard(days);
      set({ analytics });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  },

  createTask: async (task) => {
    try {
      const newTask = await tasksApi.create(task as any);
      
      // Optimistically add the new task to the store immediately
      const currentTasks = get().tasks;
      set({ tasks: [...currentTasks, newTask] });
      
      // Refresh tasks and analytics in the background (non-blocking)
      // Don't wait for these - they happen asynchronously
      get().fetchTasks({ project_id: get().selectedProject || undefined }).catch(err => {
        console.warn("Background task refresh failed:", err);
      });
      
      get().fetchAnalytics().catch(err => {
        console.warn("Background analytics refresh failed:", err);
      });
    } catch (error) {
      // Only throw if the actual creation failed
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    // Optimistically update the task in the store immediately
    const currentTasks = get().tasks;
    const updatedTasks = currentTasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks: updatedTasks });
    
    try {
      // Update the task on the server
      await tasksApi.update(id, updates);
      
      // Refresh tasks and analytics in the background (non-blocking)
      // Don't wait for these - they happen asynchronously
      get().fetchTasks({ project_id: get().selectedProject || undefined }).catch(err => {
        console.warn("Background task refresh failed:", err);
      });
      
      get().fetchAnalytics().catch(err => {
        console.warn("Background analytics refresh failed:", err);
      });
    } catch (error) {
      // Revert optimistic update on error
      set({ tasks: currentTasks });
      // Only throw if the actual update failed
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await tasksApi.delete(id);
      await get().fetchTasks({ project_id: get().selectedProject || undefined });
      await get().fetchAnalytics();
    } catch (error) {
      throw error;
    }
  },

  setSelectedProject: (projectId) => {
    set({ selectedProject: projectId });
    get().fetchTasks({ project_id: projectId || undefined });
  },
}));

