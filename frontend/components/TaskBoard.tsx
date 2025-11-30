"use client";

import { useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { Plus, X } from "lucide-react";
import EditIcon from "./EditIcon";
import { Task, tasksApi } from "@/lib/api";
import AddTaskModal from "./AddTaskModal";

const statusColumns = [
  { id: "todo", label: "To Do", color: "gray" },
  { id: "in_progress", label: "In Progress", color: "blue" },
  { id: "in_review", label: "In Review", color: "yellow" },
  { id: "done", label: "Done", color: "green" },
  { id: "blocked", label: "Blocked", color: "red" },
];

const priorityClassMap: Record<string, string> = {
  low: "neumorphism-priority-low",
  medium: "neumorphism-priority-medium",
  high: "neumorphism-priority-high",
  urgent: "neumorphism-priority-urgent",
};

const statusColumnColors: Record<string, string> = {
  todo: "#9CA3AF",
  in_progress: "#3B82F6",
  in_review: "#F59E0B",
  done: "#10B981",
  blocked: "#EF4444",
};

export default function TaskBoard() {
  const { tasks, fetchTasks, updateTask, selectedProject } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTask(taskId, { status: newStatus as any });
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    try {
      await tasksApi.archive(taskId);
      // Refresh tasks to remove archived task from view
      await fetchTasks({ project_id: selectedProject || undefined });
    } catch (error) {
      console.error("Failed to archive task:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold neumorphism-text-primary" style={{ 
          background: 'linear-gradient(135deg, var(--neumorphism-primary) 0%, var(--neumorphism-primary-dark) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          Task Board
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="neumorphism-button-primary px-4 py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      <AddTaskModal
        isOpen={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statusColumns.map((column) => (
          <div key={column.id} className="neumorphism-status-column">
            <h3 
              className="mb-4 text-sm font-bold uppercase tracking-wide"
              style={{ color: statusColumnColors[column.id] }}
            >
              {column.label}
              <span className="ml-2 neumorphism-text-secondary font-normal">
                ({tasksByStatus[column.id]?.length || 0})
              </span>
            </h3>
            <div className="space-y-3">
              {(tasksByStatus[column.id] || []).map((task) => (
                <div
                  key={task.id}
                  className="neumorphism-task-card"
                  // Drag and drop is now handled by dnd-kit in TaskBox component
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold neumorphism-text-primary flex-1 line-clamp-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="neumorphism-icon-button flex-shrink-0 neumorphism-icon-button-edit"
                        title="Edit task"
                        style={{ width: '1.5rem', height: '1.5rem', minWidth: '1.5rem', minHeight: '1.5rem', color: '#4F46E5', marginRight: '10px' }}
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleArchiveTask(task.id)}
                        className="neumorphism-icon-button flex-shrink-0"
                        title="Archive task"
                        style={{ color: '#EF4444', width: '1.5rem', height: '1.5rem', minWidth: '1.5rem', minHeight: '1.5rem' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="mb-3 text-xs neumorphism-text-secondary line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`neumorphism-badge ${priorityClassMap[task.priority]} text-xs`}>
                      {task.priority}
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="neumorphism-select text-xs py-1 px-2 flex-1 min-w-[100px]"
                    >
                      {statusColumns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {(!tasksByStatus[column.id] || tasksByStatus[column.id].length === 0) && (
                <div className="text-center py-8 neumorphism-text-secondary text-xs">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

