"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { X, FolderPlus, Edit } from "lucide-react";
import { Project } from "@/lib/api";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null; // Optional project for editing
}

export default function AddProjectModal({ isOpen, onClose, project }: AddProjectModalProps) {
  const { fetchProjects } = useTaskStore();
  const isEditMode = !!project;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previousIsOpenRef = useRef(false);
  const previousProjectIdRef = useRef<number | null>(null);

  // Populate form when project is provided (edit mode) or reset when opening in create mode
  useEffect(() => {
    const isOpening = isOpen && !previousIsOpenRef.current;
    const projectChanged = project?.id !== previousProjectIdRef.current;
    
    if (isOpening || projectChanged) {
      if (project && isOpen) {
        // Edit mode - populate form with project data
        setName(project.name || "");
        setDescription(project.description || "");
        previousProjectIdRef.current = project.id;
      } else if (!project && isOpen) {
        // Create mode - reset form
        setName("");
        setDescription("");
        previousProjectIdRef.current = null;
      }
    }
    
    previousIsOpenRef.current = isOpen;
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { projectsApi } = await import("@/lib/api");
      
      if (isEditMode && project) {
        // Update existing project
        await projectsApi.update(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        // Create new project
        await projectsApi.create(name.trim(), description.trim() || undefined);
      }
      
      // Reset form
      setName("");
      setDescription("");
      await fetchProjects();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} project:`, error);
      alert(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} project`);
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
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ 
            color: 'var(--neumorphism-text)',
            letterSpacing: '-0.01em'
          }}>
            {isEditMode ? (
              <>
                <Edit className="w-5 h-5" />
                Edit Project
              </>
            ) : (
              <>
                <FolderPlus className="w-5 h-5" />
                Create New Project
              </>
            )}
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
          {/* Project Name */}
          <div className="space-y-2">
            <label className="neumorphism-form-label">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="neumorphism-form-input"
              placeholder="Enter project name"
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
              rows={4}
              placeholder="Enter project description (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-8 pt-8 mt-8">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="neumorphism-button-create"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {isEditMode ? (
                    <>
                      <Edit className="w-3 h-3" />
                      Update Project
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3 h-3" />
                      Create Project
                    </>
                  )}
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
      </div>
    </div>
  );
}



