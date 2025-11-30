"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { X, Plus, FolderPlus, Edit } from "lucide-react";
import { Task, Project } from "@/lib/api";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject?: () => void;
  task?: Task | null; // Optional task for editing
}

export default function AddTaskModal({ isOpen, onClose, onCreateProject, task }: AddTaskModalProps) {
  const { createTask, updateTask, projects, fetchProjects, fetchTasks } = useTaskStore();
  const isEditMode = !!task;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [price, setPrice] = useState("");
  
  // Format price with commas for display
  const formatPrice = (value: string): string => {
    // Remove all non-digit characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    if (!numericValue) return '';
    
    // Split by decimal point
    const parts = numericValue.split('.');
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Rejoin with decimal point
    return parts.join('.');
  };
  
  // Parse price value (remove commas) for storage
  const parsePrice = (value: string): string => {
    return value.replace(/,/g, '');
  };
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousIsOpenRef = useRef(false);
  const previousTaskIdRef = useRef<number | null>(null);

  // Ensure we have projects loaded
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen, fetchProjects]);

  // Update selected project when projects change (only if no project is selected)
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Populate form when task is provided (edit mode) or reset when opening in create mode
  // Only run when modal opens or task changes, not when projects change
  useEffect(() => {
    const isOpening = isOpen && !previousIsOpenRef.current;
    const taskChanged = task?.id !== previousTaskIdRef.current;
    
    if (isOpening || taskChanged) {
      if (task && isOpen) {
        // Edit mode - populate form with task data
        setTitle(task.title || "");
        setDescription(task.description || "");
        setPriority(task.priority || "medium");
        setSelectedProjectId(task.project_id);
        if (task.due_date) {
          // Convert ISO date to YYYY-MM-DD format for date input
          const dueDateObj = new Date(task.due_date);
          const year = dueDateObj.getFullYear();
          const month = String(dueDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dueDateObj.getDate()).padStart(2, '0');
          setDueDate(`${year}-${month}-${day}`);
        } else {
          setDueDate("");
        }
        if (task.price !== null && task.price !== undefined) {
          setPrice(formatPrice(task.price.toString()));
        } else {
          setPrice("");
        }
        previousTaskIdRef.current = task.id;
      } else if (!task && isOpen) {
        // Create mode - reset form
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setPrice("");
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
        }
        previousTaskIdRef.current = null;
      }
    }
    
    previousIsOpenRef.current = isOpen;
  }, [task, isOpen]); // Removed 'projects' from dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have a project
    let projectId = selectedProjectId;
    if (!projectId && projects.length === 0) {
      // Create a default project if none exists
      try {
        const { projectsApi } = await import("@/lib/api");
        const defaultProject = await projectsApi.create("My Tasks", "Default task project");
        projectId = defaultProject.id;
        setSelectedProjectId(projectId);
        await fetchProjects();
      } catch (error: any) {
        console.error("Failed to create default project:", error);
        alert("Failed to create default project. Please try again.");
        return;
      }
    }
    
    if (!title.trim() || !projectId) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure priority is valid (low, medium, high, urgent)
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const taskPriority = validPriorities.includes(priority) ? priority : 'medium';
      
      if (isEditMode && task) {
        // Update existing task
        const updateData: any = {
          title: title.trim(),
          project_id: projectId,
          priority: taskPriority,
        };
        
        // Only include optional fields if they have values
        if (description && description.trim()) {
          updateData.description = description.trim();
        } else if (description === "") {
          updateData.description = null;
        }
        
        if (dueDate) {
          updateData.due_date = new Date(dueDate).toISOString();
        } else {
          updateData.due_date = null;
        }
        
        if (price && price.trim()) {
          const priceValue = parseFloat(parsePrice(price));
          if (!isNaN(priceValue) && priceValue >= 0) {
            updateData.price = priceValue;
          }
        } else {
          updateData.price = null;
        }
        
        await updateTask(task.id, updateData);
        onClose();
      } else {
        // Create new task
        // Calculate due date - 7 days from now if not specified
        let dueDateValue: string | undefined = undefined;
        if (dueDate) {
          dueDateValue = new Date(dueDate).toISOString();
        } else {
          // Default to 7 days from now
          const defaultDueDate = new Date();
          defaultDueDate.setDate(defaultDueDate.getDate() + 7);
          dueDateValue = defaultDueDate.toISOString();
        }
        
        // Prepare task data - ensure all fields are properly formatted
        const taskData: any = {
          title: title.trim(),
          project_id: projectId,
          status: "todo",
          priority: taskPriority,
        };
        
        // Only include optional fields if they have values
        if (description && description.trim()) {
          taskData.description = description.trim();
        }
        
        if (dueDateValue) {
          taskData.due_date = dueDateValue;
        }
        
        if (price && price.trim()) {
          const priceValue = parseFloat(parsePrice(price));
          if (!isNaN(priceValue) && priceValue >= 0) {
            taskData.price = priceValue;
          }
        }
        
        await createTask(taskData);

        // Reset form
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        setPrice("");
        onClose();
      }
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} task:`, error);
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message || `Failed to ${isEditMode ? 'update' : 'create'} task`;
      
      // If we get a 500 error, the task might have been created but response failed
      // Try to refresh tasks to check if it was actually created
      if (statusCode === 500 && !isEditMode) {
        try {
          // Wait a bit for the backend to finish
          await new Promise(resolve => setTimeout(resolve, 500));
          // Try to refresh tasks - if this succeeds, the task was likely created
          await fetchProjects();
          await fetchTasks({ project_id: selectedProjectId || undefined });
          
          // If refresh succeeded, assume task was created and close modal
          setTitle("");
          setDescription("");
          setDueDate("");
          setPriority("medium");
          onClose();
          return; // Don't show error if task was actually created
        } catch (refreshError) {
          // Refresh failed, so we can't confirm if task was created
          console.warn("Could not verify if task was created:", refreshError);
        }
      }
      
      // Only show error if it's not a network/refresh error
      // The task might have been created successfully but refresh failed
      if (!errorMessage.includes("refresh") && !errorMessage.includes("fetch")) {
        alert(errorMessage);
      } else if (!isEditMode) {
        // Task was likely created, just refresh failed - close modal and let user refresh manually
        setTitle("");
        setDescription("");
        setDueDate("");
        setPriority("medium");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="neumorphism-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="neumorphism-modal-form"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ 
          borderBottom: '1px solid rgba(163, 177, 198, 0.3)',
          boxShadow: '0 1px 0 rgba(255, 255, 255, 0.5)'
        }}>
          <h2 className="text-xl font-semibold" style={{ 
            color: 'var(--neumorphism-text)',
            letterSpacing: '-0.01em'
          }}>
            {isEditMode ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="neumorphism-modal-close"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="neumorphism-form-label">
                Project <span className="text-red-500">*</span>
              </label>
              {onCreateProject && projects.length > 0 && (
                <button
                  type="button"
                  onClick={onCreateProject}
                  className="neumorphism-link-button flex items-center gap-1.5 text-xs"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  Create Project
                </button>
              )}
            </div>
            {projects.length === 0 ? (
              <div className="neumorphism-form-empty-state p-3 text-center rounded-lg">
                <p className="text-xs text-gray-500 mb-2">
                  No projects available
                </p>
                {onCreateProject && (
                  <button
                    type="button"
                    onClick={onCreateProject}
                    className="neumorphism-button-small"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Create Your First Project</span>
                  </button>
                )}
              </div>
            ) : (
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
                className="neumorphism-form-select"
                required
              >
                {projects.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="neumorphism-form-label">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="neumorphism-form-input"
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="neumorphism-form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="neumorphism-form-textarea"
              rows={3}
              placeholder="Enter task description (optional)"
            />
          </div>

          {/* Priority, Due Date, and Price Row */}
          <div className="grid grid-cols-[140px_1fr_120px] gap-8">
            <div className="space-y-2">
              <label className="neumorphism-form-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="neumorphism-form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2" style={{ marginLeft: '20px', marginRight: '24px'}}>
              <label className="neumorphism-form-label">
                Due Date <span style={{ color: 'var(--neumorphism-text-light)', fontSize: '0.75rem', fontWeight: 'normal' }}>(optional)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="neumorphism-form-input"
                min={new Date().toISOString().split("T")[0]} style={{ width: '100%' }}
              />
            </div>
            <div className="space-y-2">
              <label className="neumorphism-form-label">
                Price <span style={{ color: 'var(--neumorphism-text-light)', fontSize: '0.75rem', fontWeight: 'normal' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Allow empty input
                  if (inputValue === '') {
                    setPrice('');
                    return;
                  }
                  // Format the input with commas
                  setPrice(formatPrice(inputValue));
                }}
                className="neumorphism-form-input"
                placeholder="0.00"
                style={{ width: '100%', maxWidth: '120px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex pt-8 mt-8" style={{ marginTop: '20px', gap: '0.75rem'}}>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !selectedProjectId}
              className="neumorphism-button-create"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {isEditMode ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {isEditMode ? 'Update Task' : 'Create Task'}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="neumorphism-button-cancel"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Footer Note */}
        {!dueDate && !isEditMode && (
          <p className="text-xs mt-4 text-center" style={{ color: 'var(--neumorphism-text-light)' }}>
            Due date will default to 7 days from now if not specified
          </p>
        )}
      </div>
    </div>
  );
}

