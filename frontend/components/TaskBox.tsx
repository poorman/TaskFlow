"use client";

import { useState, useRef, useEffect } from "react";
import { Task } from "@/lib/api";
import { useTaskStore } from "@/store/useTaskStore";
import { CheckCircle2, Circle, GripVertical } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TaskBoxProps {
  task: Task;
}

export default function TaskBox({ task }: TaskBoxProps) {
  const { updateTask } = useTaskStore();
  
  // Use dnd-kit's useDraggable hook
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id: `task-${task.id}`,
    data: {
      task,
    },
  });
  
  const [size, setSize] = useState({ 
    width: task.box_width ?? 180, 
    height: task.box_height ?? 100 
  });
  const [isResizing, setIsResizing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  
  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    boxRef.current = node;
    if (setDraggableRef) {
      setDraggableRef(node);
    }
  };
  
  // Get transform style from dnd-kit
  const dragTransform = transform ? CSS.Translate.toString(transform) : undefined;
  
  // Update size when task changes (e.g., after refresh)
  useEffect(() => {
    if (task.box_width !== null && task.box_width !== undefined) {
      setSize({ width: task.box_width, height: task.box_height ?? 100 });
    }
  }, [task.box_width, task.box_height]);

  // Calculate remaining days (7-day progress bar)
  const getRemainingDays = (): number => {
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, Math.min(7, diffDays)); // Cap at 7 days for progress bar
    }
    // If no due date, calculate based on 7 days from creation
    const createdAt = new Date(task.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    createdAt.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 7 - diffDays);
    return Math.min(7, remaining); // Cap at 7 days
  };

  const remainingDays = getRemainingDays();
  const isCompleted = task.status === "done";

  // Get color based on remaining days - use chart blue for borders
  const getColor = (): string => {
    if (isCompleted) return "#9CA3AF"; // Gray for completed
    if (remainingDays >= 5) return "#10B981"; // Green for 7-5 days
    if (remainingDays >= 3) return "#F59E0B"; // Orange for 4-3 days
    return "#EF4444"; // Red for 2 days or less
  };

  // Chart blue color for borders - matching the chart blue (#0E9BEF)
  const chartBlue = "#0E9BEF";
  const color = getColor();
  // Calculate progress: days passed out of 7 total days
  const progressPercent = Math.min(100, ((7 - remainingDays) / 7) * 100);

  // Calculate dynamic font size based on box width
  // Base: 180px width = 12px font (text-xs)
  // Scale proportionally with min/max limits
  const baseWidth = 180;
  const baseFontSize = 12; // text-xs = 0.75rem = 12px
  const minFontSize = 8; // Minimum readable font size
  const maxFontSize = 14; // Maximum font size
  const fontSize = Math.max(
    minFontSize,
    Math.min(maxFontSize, (size.width / baseWidth) * baseFontSize)
  );

  // Note: Drag handling is now done by dnd-kit via useDraggable
  // The drag end will be handled in the parent DndContext's onDragEnd handler

  // Resize handlers - optimized for speed
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    let currentSize = { width: size.width, height: size.height };

    const handleMouseMove = (e: MouseEvent) => {
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      
      // Update directly without requestAnimationFrame for immediate response
      // Allow smaller sizes for more compact boxes
      const newSize = {
        width: Math.max(120, Math.min(500, startWidth + diffX)),
        height: Math.max(70, Math.min(400, startHeight + diffY)),
      };
      currentSize = newSize;
      setSize(newSize);
    };

    const handleMouseUp = async () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Save size to database using the latest size
      try {
        await updateTask(task.id, { 
          box_width: currentSize.width,
          box_height: currentSize.height
        });
      } catch (error) {
        console.error("Failed to save size:", error);
      }
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
    const newStatus = isCompleted ? "todo" : "done";
    await updateTask(task.id, { status: newStatus });
    } catch (error: any) {
      console.error("Failed to toggle task status:", error);
      // Only show error if it's not a network/refresh error
      // The task might have been updated successfully but refresh failed
      const errorMessage = error.response?.data?.detail || error.message || "Failed to update task status";
      if (!errorMessage.includes("refresh") && !errorMessage.includes("fetch") && !errorMessage.includes("500")) {
        // Only show non-server errors
        console.warn("Task status update error:", errorMessage);
      } else {
        // Server error or refresh error - task might have been updated, just refresh failed
        console.warn("Task may have been updated but refresh failed:", errorMessage);
      }
    }
  };

  return (
    <div
      ref={combinedRef}
      data-task-id={task.id}
      className={`neumorphism-task-box ${isDndDragging ? "cursor-grabbing" : "cursor-grab"} ${isResizing ? "resizing" : ""}`}
      style={{
        transform: dragTransform,
        width: `${size.width}px`,
        minHeight: `${size.height}px`,
        opacity: isCompleted ? 0.7 : isDndDragging ? 0.5 : 1,
        borderColor: isCompleted ? "#9CA3AF" : chartBlue, // Use chart blue for borders
        transition: isDndDragging || isResizing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: isDndDragging || isResizing ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        perspective: 1000,
        zIndex: isDndDragging ? 1000 : 'auto',
      }}
      {...listeners}
      {...attributes}
    >
      {/* Resize Handle - Bottom right corner */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-80 transition-opacity z-20"
        onMouseDown={(e) => {
          e.stopPropagation(); // Prevent drag from starting
          handleResizeStart(e);
        }}
        style={{
          background: 'radial-gradient(circle at bottom right, var(--neumorphism-shadow-dark) 0%, transparent 70%)',
          borderBottomRightRadius: '0.75rem',
          pointerEvents: 'auto', // Ensure resize handle is clickable
        }}
        title="Resize"
      >
        <div 
          className="absolute bottom-0.5 right-0.5"
          style={{
            width: 0,
            height: 0,
            borderLeft: '4px solid transparent',
            borderBottom: '4px solid var(--neumorphism-shadow-dark)',
          }}
        ></div>
        <div 
          className="absolute bottom-1 right-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: '3px solid transparent',
            borderBottom: '3px solid var(--neumorphism-shadow-dark)',
          }}
        ></div>
      </div>

      {/* Task Header - Grip handle moved next to task name */}
      <div className="flex items-center justify-between gap-1.5" style={{ marginTop: 0, marginBottom: 0 }}>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div 
            className="opacity-40 hover:opacity-70 cursor-grab active:cursor-grabbing flex-shrink-0"
            {...listeners} // Apply listeners to the grip handle for dragging
            {...attributes} // Apply attributes to the grip handle
          >
            <GripVertical className="w-3 h-3 text-gray-500" />
          </div>
          <h3 
            className="font-semibold neumorphism-text-primary truncate"
            style={{ fontSize: `${fontSize}px` }}
          >
            {task.title}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag from starting
            handleStatusToggle(e);
          }}
          className="neumorphism-icon-button-sm flex-shrink-0 z-10"
          style={{ color: isCompleted ? "#9CA3AF" : color }}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-3 h-3" fill="currentColor" />
          ) : (
            <Circle className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Progress Bar - Right under task name */}
      <div className="mb-0.5" style={{ marginTop: '0.25rem' }}>
        <div className="neumorphism-progress-container">
          <div
            className="neumorphism-progress-bar"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <div 
          className="neumorphism-text-secondary mt-0.5"
          style={{ fontSize: `${Math.max(7, fontSize * 0.83)}px` }}
        >
          Remaining: {remainingDays} {remainingDays === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Task Description (if exists) */}
      {task.description && (
        <p 
          className="neumorphism-text-secondary line-clamp-1"
          style={{ fontSize: `${Math.max(7, fontSize * 0.83)}px` }}
        >
          {task.description}
        </p>
      )}

      {/* Price Display - Bottom right corner */}
      {task.price !== null && task.price !== undefined && (
        <div 
          className="absolute bottom-5 right-2 z-10"
          style={{ 
            color: '#EF4444',
            fontSize: `${Math.max(8, fontSize * 0.9)}px`,
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}
        >
          ${task.price.toFixed(2)}
        </div>
      )}
    </div>
  );
}
