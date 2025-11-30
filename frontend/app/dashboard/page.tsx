"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/lib/api";
import Header from "@/components/Header";
import { useDroppable } from "@dnd-kit/core";
// Dynamically import components
const NeumorphismChart = dynamic(() => import("@/components/NeumorphismChart"), { ssr: false });
const TaskBox = dynamic(() => import("@/components/TaskBox"), { ssr: false });
import AddTaskModal from "@/components/AddTaskModal";
import AddProjectModal from "@/components/AddProjectModal";
import AddTaskButton from "@/components/AddTaskButton";
import { Search, CheckCircle2, ChevronRight, ChevronLeft, X } from "lucide-react";
import EditIcon from "@/components/EditIcon";
import { tasksApi } from "@/lib/api";
// Dynamically import DndProvider to avoid SSR issues
const DndProvider = dynamic(() => import("@/components/DndProvider"), { ssr: false });

// Droppable zone component for main dashboard area
function DashboardDroppableZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: 'dashboard-droppable-zone',
    data: {
      type: 'dashboard-zone',
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-dnd-dashboard-zone="true"
      className="flex-1"
      style={{
        position: 'relative',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, fetchUser, user } = useAuthStore();
  const { tasks, fetchTasks, projects, fetchProjects, updateTask, selectedProject } = useTaskStore();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isCompletedTasksExpanded, setIsCompletedTasksExpanded] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.task) {
      setActiveTask(active.data.current.task);
    }
  };
  
  // Handle drag over - prevent dragging over header and outside dashboard zone
  const handleDragOver = (event: any) => {
    const { over, collision } = event;
    
    // STRICT: Only allow drag over if target is in dashboard zone
    const dashboardZone = document.querySelector('[data-dnd-dashboard-zone="true"]');
    if (!dashboardZone) {
      return;
    }
    
    // Check if over target is the dashboard zone or a child of it
    if (over) {
      if (over.id === 'dashboard-droppable-zone') {
        // Valid - dashboard zone itself
      } else {
        const overElement = document.getElementById(over.id as string) || 
                           (over.id && document.querySelector(`[data-dnd-id="${over.id}"]`)) ||
                           null;
        
        if (overElement) {
          // Must be a child of dashboard zone
          const isChildOfZone = dashboardZone.contains(overElement);
          if (!isChildOfZone) {
            // Not in dashboard zone, prevent
            return;
          }
        }
      }
    }
    
    // Always check header area during drag
    const headerWrapper = document.querySelector('[data-dnd-header="true"]');
    if (headerWrapper) {
      const headerRect = headerWrapper.getBoundingClientRect();
      
      // Get current mouse position from the document
      // This is the most reliable way to check if we're over the header
      const mouseEvent = (event as any).activatorEvent || 
                       (typeof window !== 'undefined' && (window as any).lastMouseEvent);
      
      if (mouseEvent) {
        const mouseY = mouseEvent.clientY || mouseEvent.pageY;
        if (mouseY !== undefined && mouseY < headerRect.bottom + 30) {
          // Mouse is in header area, prevent drop by not setting over
          return;
        }
      }
      
      // Check collision data
      if (collision && collision.data) {
        const collisionRect = collision.data.droppableContainer?.rect;
        if (collisionRect) {
          if (collisionRect.top < headerRect.bottom + 30 && 
              collisionRect.bottom > headerRect.top - 30) {
            // Collision is in header area
            return;
          }
        }
      }
      
      // Check if over element is in header
      if (over) {
        const overElement = document.getElementById(over.id as string) || 
                           (over.id && document.querySelector(`[data-dnd-id="${over.id}"]`)) ||
                           null;
        
        if (overElement && headerWrapper.contains(overElement)) {
          // Prevent drop on header
          return;
        }
      }
    }
  };
  
  // Handle drag end - save positions in real-time with snap-to-grid
  const handleDragEnd = async (event: any) => {
    const { active, over, delta } = event;
    setActiveTask(null);

    // Handle chart dragging
    if (active.data.current?.type === 'chart') {
      // Chart position is handled by NeumorphismChart component's useEffect
      return;
    }

    // Handle task dropping
    const draggedTask = active.data.current?.task as Task | undefined;
    if (!draggedTask) return;

    // STRICT CHECK: Only allow drops in the dashboard droppable zone
    const dashboardZone = document.querySelector('[data-dnd-dashboard-zone="true"]');
    if (!dashboardZone) {
      console.log('Drop prevented: dashboard zone not found');
      return;
    }
    
    // CRITICAL CHECK: The over target MUST be the dashboard zone or a child of it
    if (!over) {
      console.log('Drop prevented: no over target');
      return;
    }
    
    // Check if over is the dashboard zone itself
    if (over.id === 'dashboard-droppable-zone') {
      // Valid drop target, continue
    } else {
      // Check if over element is a child of dashboard zone
      const overElement = document.getElementById(over.id as string) || 
                         (over.id && document.querySelector(`[data-dnd-id="${over.id}"]`)) ||
                         null;
      
      if (!overElement) {
        console.log('Drop prevented: over element not found');
        return;
      }
      
      // STRICT: Element must be a child of dashboard zone
      const isChildOfZone = dashboardZone.contains(overElement);
      if (!isChildOfZone) {
        console.log('Drop prevented: over element is not a child of dashboard zone');
        return;
      }
      
      // Also check if element is in header (should be rejected)
      const headerWrapper = document.querySelector('[data-dnd-header="true"]');
      if (headerWrapper && headerWrapper.contains(overElement)) {
        console.log('Drop prevented: over element is in header');
        return;
      }
    }
    
    // Additional pointer position check for extra safety
    const zoneRect = dashboardZone.getBoundingClientRect();
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    
    // Try multiple methods to get pointer position
    if (event.activatorEvent) {
      pointerX = event.activatorEvent.clientX;
      pointerY = event.activatorEvent.clientY;
    } else if ((event as any).pointerCoordinates) {
      pointerX = (event as any).pointerCoordinates.x;
      pointerY = (event as any).pointerCoordinates.y;
    }
    
    // Verify pointer is within dashboard zone
    if (pointerX !== null && pointerY !== null) {
      const isInZone = pointerX >= zoneRect.left && 
                       pointerX <= zoneRect.right &&
                       pointerY >= zoneRect.top && 
                       pointerY <= zoneRect.bottom;
      
      if (!isInZone) {
        console.log('Drop prevented: pointer is outside dashboard zone', { 
          pointerX, 
          pointerY, 
          zoneLeft: zoneRect.left, 
          zoneRight: zoneRect.right,
          zoneTop: zoneRect.top,
          zoneBottom: zoneRect.bottom
        });
        return;
      }
    }

    // Get the original position
    const originalX = draggedTask.position_x ?? 0;
    const originalY = draggedTask.position_y ?? 0;

    // Calculate new position using delta from drag event (already includes snap-to-grid)
    // Delta represents the change in position during drag (already snapped to grid by modifier)
    const deltaX = delta?.x ?? 0;
    const deltaY = delta?.y ?? 0;
    
    // Calculate new position
    const newX = originalX + deltaX;
    const newY = originalY + deltaY;
    
    // Snap to grid manually (20px grid) to ensure alignment
    const gridSize = 20;
    const snappedX = Math.round(newX / gridSize) * gridSize;
    const snappedY = Math.round(newY / gridSize) * gridSize;
    
    // Clamp position to reasonable bounds (within chart area)
    const maxDistance = 400;
    const clampedX = Math.max(-maxDistance, Math.min(maxDistance, snappedX));
    const clampedY = Math.max(-maxDistance, Math.min(maxDistance, snappedY));

    // Only save if position actually changed
    const threshold = 1; // 1px threshold
    if (Math.abs(clampedX - originalX) < threshold && Math.abs(clampedY - originalY) < threshold) {
      // Position hasn't changed significantly, don't save
      return;
    }

    // Optimistically update the task position immediately in the store
    // This prevents any bounce by updating React state before the API call
    const currentTasks = tasks.map(t => 
      t.id === draggedTask.id 
        ? { ...t, position_x: clampedX, position_y: clampedY }
        : t
    );
    
    // Update store directly using the store's setState to prevent bounce
    useTaskStore.setState({ tasks: currentTasks });

    // Save the new position to the backend (without triggering refresh)
    try {
      // Call the API directly to avoid the refresh in updateTask
      const { tasksApi } = await import('@/lib/api');
      await tasksApi.update(draggedTask.id, {
        position_x: clampedX,
        position_y: clampedY,
      });
      console.log('Task position saved (snapped to grid):', { x: clampedX, y: clampedY });
      
      // Don't refresh immediately - the optimistic update is already in place
      // Only refresh in the background after a longer delay to sync with server
      setTimeout(async () => {
        try {
          await fetchTasks({ project_id: selectedProject || undefined });
        } catch (error) {
          console.warn('Background refresh failed, but position was saved:', error);
        }
      }, 2000); // Longer delay to prevent any bounce
    } catch (error) {
      console.error('Failed to save task position:', error);
      // On error, revert the optimistic update and refresh
      useTaskStore.setState({ tasks: tasks });
      await fetchTasks({ project_id: selectedProject || undefined });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUser();
        if (isAuthenticated && user) {
          await fetchProjects();
          await fetchTasks();
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    if (isAuthenticated && user) {
      loadData();
    } else {
      fetchUser();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((t: Task) => t.status === "done").length;
    return (completedTasks / tasks.length) * 100;
  }, [tasks]);

  // Get incomplete tasks for display around chart
  const incompleteTasks = useMemo(() => {
    return tasks.filter((t: Task) => t.status !== "done" && t !== null && t !== undefined);
  }, [tasks]);

  // Get completed tasks for the right sidebar
  const completedTasks = useMemo(() => {
    return tasks.filter((t: Task) => t.status === "done" && t !== null && t !== undefined);
  }, [tasks]);

  // Search state for completed tasks
  const [completedTasksSearch, setCompletedTasksSearch] = useState("");
  
  // Filter completed tasks by search
  const filteredCompletedTasks = useMemo(() => {
    if (!completedTasksSearch.trim()) return completedTasks;
    const searchLower = completedTasksSearch.toLowerCase();
    return completedTasks.filter((t: Task) => 
      t.title.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower))
    );
  }, [completedTasks, completedTasksSearch]);

  const handleArchiveTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the task click
    try {
      await tasksApi.archive(taskId);
      // Refresh tasks to remove archived task from view
      await fetchTasks({ project_id: selectedProject || undefined });
    } catch (error) {
      console.error("Failed to archive task:", error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="neumorphism-card text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      activeTask={activeTask}
    >
      <div className="neumorphism-dashboard relative min-h-screen">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div 
            data-dnd-header="true" 
            data-dnd-disabled="true"
            style={{ 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1000
            }}
          >
            <Header />
          </div>
          <div className="flex gap-6 min-h-[calc(100vh-150px)] py-8">
            {/* Main Chart Area - Droppable Zone */}
            <DashboardDroppableZone>
              <div className="flex-1 flex flex-col items-center justify-center relative gap-8" style={{ justifyContent: 'center', alignItems: 'center' }}>
              {/* Chart Container with Tasks Around It */}
                <div 
                  className="relative" 
                  style={{ 
                    width: "600px", 
                    height: "600px", 
                    margin: '0 auto',
                  }}
                >
              {/* Chart - Draggable, Resizable, and Droppable */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0">
                <NeumorphismChart 
                  tasks={tasks} 
                  completionPercentage={completionPercentage}
                  positionX={0}
                  positionY={0}
                  onPositionChange={async (x, y) => {
                    // Chart position can be saved here if needed
                    // For now, chart position is relative to its container, so we don't need to save it
                    console.log('Chart position changed:', { x, y });
                  }}
                />
              </div>

                {/* Draggable Task Boxes - Only incomplete tasks */}
                {incompleteTasks.length > 0 && (
                  <div className="neumorphism-tasks-container absolute inset-0" style={{ zIndex: 10 }}>
                    {incompleteTasks.map((task: Task, index: number) => {
                      // Ensure task is valid
                      if (!task || !task.id) {
                        return null;
                      }
                      
                      // Use saved position if available and not at origin (0,0), otherwise use circular layout
                    const hasSavedPosition = task.position_x !== null && task.position_x !== undefined && 
                                              task.position_y !== null && task.position_y !== undefined &&
                                              (task.position_x !== 0 || task.position_y !== 0);
                    
                    let x = 0;
                    let y = 0;
                    
                    if (hasSavedPosition) {
                      // Use saved position (relative to center)
                        // Clamp position to reasonable bounds to ensure visibility
                        x = Math.max(-400, Math.min(400, task.position_x ?? 0));
                        y = Math.max(-400, Math.min(400, task.position_y ?? 0));
                    } else {
                        // Default circular layout - distribute tasks evenly around the chart
                        const angle = (index * (360 / incompleteTasks.length)) * (Math.PI / 180);
                      const radius = 280; // Distance from center
                      x = Math.cos(angle) * radius;
                      y = Math.sin(angle) * radius;
                    }

                    return (
                      <div
                        key={task.id}
                        className="absolute task-wrapper"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: "translate(-50%, -50%)",
                          zIndex: 10,
                        }}
                      >
                        <TaskBox task={task} />
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              </div>
            </DashboardDroppableZone>

            {/* Completed Tasks Sidebar */}
            {completedTasks.length > 0 && (
              <div 
                className="flex-shrink-0 transition-all duration-300 ease-in-out"
                style={{ width: isCompletedTasksExpanded ? '224px' : '40px' }}
              >
                {isCompletedTasksExpanded ? (
                  <div className="neumorphism-card sticky top-4 max-h-[calc(100vh-120px)] flex flex-col" style={{ padding: '0.75rem', overflow: 'hidden' }}>
                    <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2" style={{ borderBottom: '1px solid rgba(163, 177, 198, 0.3)' }}>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <h2 className="font-semibold neumorphism-text-primary" style={{ fontSize: '0.625rem' }}>
                          Completed ({completedTasks.length})
                        </h2>
                      </div>
                      <button
                        onClick={() => setIsCompletedTasksExpanded(false)}
                        className="neumorphism-icon-button-sm p-0.5"
                        style={{ minWidth: '20px', minHeight: '20px' }}
                        title="Collapse"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative" style={{ flexShrink: 0, marginBottom: '1.25rem' }}>
                      <Search className="absolute top-1/2 transform -translate-y-1/2 text-gray-400" style={{ left: '0.625rem', width: '0.625rem', height: '0.625rem' }} />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={completedTasksSearch}
                        onChange={(e) => setCompletedTasksSearch(e.target.value)}
                        className="neumorphism-input w-full pl-8 pr-2 text-[10px]"
                        style={{ 
                          fontSize: '0.625rem', 
                          maxWidth: '100%', 
                          boxSizing: 'border-box',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem'
                        }}
                      />
                    </div>

                    {/* Completed Tasks List */}
                    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0, paddingRight: '0.25rem' }}>
                      {filteredCompletedTasks.length === 0 ? (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center py-2" style={{ fontSize: '0.625rem' }}>
                          {completedTasksSearch ? "No tasks found" : "No completed tasks"}
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {filteredCompletedTasks.map((task: Task) => (
                            <div
                              key={task.id}
                              className="neumorphism-card-small cursor-pointer transition-all"
                              style={{
                                borderRadius: '0.75rem',
                                padding: '0.25rem 0.375rem',
                              }}
                              onClick={() => {
                                // Toggle back to incomplete
                                updateTask(task.id, { status: "todo" });
                              }}
                            >
                            <div className="flex items-center justify-between" style={{ gap: '0.5rem' }}>
                              <div className="flex items-center flex-1 min-w-0" style={{ gap: '0.5rem' }}>
                                <CheckCircle2 className="text-green-500 flex-shrink-0" style={{ width: '12px', height: '12px', minWidth: '12px' }} />
                                <h3 
                                  className="neumorphism-text-primary truncate flex-1" 
                                  style={{ 
                                    fontSize: '0.625rem',
                                    fontWeight: '500',
                                    lineHeight: '1.2'
                                  }}
                                >
                                  {task.title}
                                </h3>
                              </div>
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTask(task);
                                  }}
                                  className="neumorphism-icon-button-sm flex-shrink-0 neumorphism-icon-button-edit"
                                  title="Edit task"
                                  style={{ 
                                    width: '16px',
                                    height: '16px',
                                    minWidth: '16px',
                                    minHeight: '16px',
                                    padding: '2px',
                                    color: '#4F46E5',
                                    marginRight: '10px'
                                  }}
                                >
                                  <EditIcon size={12} />
                                </button>
                                <button
                                  onClick={(e) => handleArchiveTask(task.id, e)}
                                  className="neumorphism-icon-button-sm flex-shrink-0"
                                  title="Archive task"
                                  style={{ 
                                    color: '#EF4444',
                                    width: '16px',
                                    height: '16px',
                                    minWidth: '16px',
                                    minHeight: '16px',
                                    padding: '2px'
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="neumorphism-card sticky top-4 flex flex-col items-center" style={{ padding: '0.5rem', width: '40px', minHeight: '100px' }}>
                    <button
                      onClick={() => setIsCompletedTasksExpanded(true)}
                      className="neumorphism-icon-button-sm p-1 mb-2"
                      style={{ minWidth: '28px', minHeight: '28px' }}
                      title="Expand completed tasks"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-semibold neumorphism-text-primary" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                        {completedTasks.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Add Task Button - Fixed Position */}
      <button
        onClick={() => setIsAddTaskModalOpen(true)}
        className="fab-add-task"
        aria-label="Add new task"
        type="button"
      >
        <AddTaskButton />
      </button>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen || !!editingTask}
        onClose={async () => {
          setIsAddTaskModalOpen(false);
          setEditingTask(null);
          // Refresh tasks and projects after closing to ensure UI is in sync
          try {
          await fetchProjects();
          await fetchTasks();
          } catch (error) {
            console.error("Error refreshing data after modal close:", error);
            // Still try to refresh tasks even if projects fail
            try {
              await fetchTasks();
            } catch (taskError) {
              console.error("Error refreshing tasks:", taskError);
            }
          }
        }}
        onCreateProject={() => {
          setIsAddTaskModalOpen(false);
          setEditingTask(null);
          setIsAddProjectModalOpen(true);
        }}
        task={editingTask}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={async () => {
          setIsAddProjectModalOpen(false);
          await fetchProjects();
          // Reopen task modal if it was opened first
          if (projects.length === 0) {
            setTimeout(() => setIsAddTaskModalOpen(true), 300);
          }
        }}
      />
      </div>
    </DndProvider>
  );
}

