"use client";

import { useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Project } from "@/lib/api";
import AddProjectModal from "./AddProjectModal";

export default function ProjectSelector() {
  const { projects, selectedProject, setSelectedProject, fetchProjects } = useTaskStore();
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    
    try {
      const { projectsApi } = await import("@/lib/api");
      await projectsApi.create(projectName);
      setProjectName("");
      setShowCreate(false);
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsAddProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      const { projectsApi } = await import("@/lib/api");
      await projectsApi.delete(projectId);
      
      // If the deleted project was selected, clear selection
      if (selectedProject === projectId) {
        setSelectedProject(null);
      }
      
      await fetchProjects();
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      alert(error.response?.data?.detail || "Failed to delete project");
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <>
      <div className="neumorphism-dashboard-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <label className="text-sm font-semibold neumorphism-text-primary whitespace-nowrap">Project:</label>
            <select
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
              className="neumorphism-select flex-1"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {showCreate ? (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateProject()}
                placeholder="Project name"
                className="neumorphism-input flex-1 sm:min-w-[200px]"
                autoFocus
              />
              <button
                onClick={handleCreateProject}
                className="neumorphism-button-primary px-4 py-2 text-sm"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setProjectName("");
                }}
                className="neumorphism-button-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="neumorphism-button-primary px-4 py-2 text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>

        {/* Edit/Delete buttons for selected project */}
        {selectedProjectData && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-300/30">
            <span className="text-sm text-gray-600 flex-1">
              Managing: <span className="font-semibold">{selectedProjectData.name}</span>
            </span>
            <button
              onClick={() => handleEditProject(selectedProjectData)}
              className="neumorphism-button-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
              title="Edit project"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDeleteProject(selectedProjectData.id)}
              className="neumorphism-button-secondary px-3 py-1.5 text-sm flex items-center gap-1.5 text-red-600 hover:text-red-700"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={async () => {
          setIsAddProjectModalOpen(false);
          setEditingProject(null);
          await fetchProjects();
        }}
        project={editingProject}
      />
    </>
  );
}

