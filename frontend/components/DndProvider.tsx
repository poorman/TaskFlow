"use client";

import { ReactNode, useEffect, useState } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, Modifier, CollisionDetection, closestCenter } from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import dynamic from "next/dynamic";

// Dynamically import TaskBox to avoid SSR issues
const TaskBox = dynamic(() => import("@/components/TaskBox"), { ssr: false });

interface DndProviderProps {
  children: ReactNode;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onDragOver?: (event: any) => void;
  activeTask: any;
}

// Create snap-to-grid modifier with 20px grid size
const snapToGridModifier = createSnapModifier(20);

// Custom modifier to exclude header area from collisions
const excludeHeaderModifier: Modifier = ({ transform, draggingNodeRect, over }) => {
  if (!draggingNodeRect || !over) {
    return transform;
  }

  // Get header element
  const headerWrapper = document.querySelector('[data-dnd-header="true"]');
  if (!headerWrapper) {
    return transform;
  }

  const headerRect = headerWrapper.getBoundingClientRect();
  
  // Get the over element's position
  const overElement = document.getElementById(over.id as string);
  if (!overElement) {
    return transform;
  }

  const overRect = overElement.getBoundingClientRect();
  
  // Check if the collision is within header bounds
  const buffer = 50;
  if (overRect.top < headerRect.bottom + buffer && 
      overRect.bottom > headerRect.top - buffer &&
      overRect.left < headerRect.right + buffer && 
      overRect.right > headerRect.left - buffer) {
    // Collision is in header area, return original transform (no change)
    // This effectively prevents the drop
    return transform;
  }

  return transform;
};

function DndContextWrapper({ children, onDragStart, onDragEnd, onDragOver, activeTask }: DndProviderProps) {
  // Configure sensors for dnd-kit with press delay
  // Based on: https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/core-draggable-hooks-usedraggable--press-delay-or-distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // 200ms press delay before drag starts
        tolerance: 5, // Allow 5px of movement during press delay
      },
    })
  );

  // Custom collision detection that STRICTLY only allows drops in dashboard zone
  const customCollisionDetection: CollisionDetection = (args) => {
    // Get pointer position
    const pointer = args.pointerCoordinates;
    if (!pointer) {
      return [];
    }
    
    // Check header area first - reject if in header
    const headerWrapper = document.querySelector('[data-dnd-header="true"]');
    if (headerWrapper) {
      const headerRect = headerWrapper.getBoundingClientRect();
      const buffer = 100;
      
      if (pointer.y < headerRect.bottom + buffer) {
        // Pointer is in header area, no valid drops
        return [];
      }
    }
    
    // STRICT: Check if pointer is in dashboard droppable zone
    const dashboardZone = document.querySelector('[data-dnd-dashboard-zone="true"]');
    if (!dashboardZone) {
      // If no dashboard zone found, reject all drops
      return [];
    }
    
    const zoneRect = dashboardZone.getBoundingClientRect();
    
    // STRICT: Only allow drops if pointer is within the dashboard zone
    const isInZone = pointer.x >= zoneRect.left && 
                     pointer.x <= zoneRect.right &&
                     pointer.y >= zoneRect.top && 
                     pointer.y <= zoneRect.bottom;
    
    if (!isInZone) {
      // Pointer is outside dashboard zone, no valid drops
      return [];
    }
    
    // Get default collision detection
    const collisions = closestCenter(args);
    
    // STRICT: Filter collisions to only include the dashboard zone or its children
    let hasDashboardZone = false;
    const filteredCollisions = (collisions || []).filter((collision) => {
      const overId = collision.id;
      
      // Always allow the dashboard zone itself
      if (overId === 'dashboard-droppable-zone') {
        hasDashboardZone = true;
        return true;
      }
      
      const overElement = document.getElementById(overId as string) || 
                         document.querySelector(`[data-dnd-id="${overId}"]`);
      
      if (!overElement) {
        // If we can't find element, don't allow it
        return false;
      }
      
      // STRICT: Element must be a child of dashboard zone
      const isChildOfZone = dashboardZone.contains(overElement);
      if (!isChildOfZone) {
        return false;
      }
      
      // Check if element is in header (should be rejected)
      if (headerWrapper) {
        const headerRect = headerWrapper.getBoundingClientRect();
        const overRect = overElement.getBoundingClientRect();
        const isInHeader = overRect.top < headerRect.bottom + 50 && 
                          overRect.bottom > headerRect.top - 50;
        if (isInHeader || headerWrapper.contains(overElement)) {
          return false;
        }
      }
      
      return true;
    });
    
    // If we're in the zone but don't have the dashboard zone in collisions, add it
    // This ensures drops are always allowed when pointer is in the zone
    if (isInZone && !hasDashboardZone) {
      // Find the dashboard zone in the droppable containers
      const dashboardContainer = args.droppableContainers.find(
        container => container.id === 'dashboard-droppable-zone'
      );
      
      if (dashboardContainer) {
        // Add dashboard zone as the first collision
        return [
          {
            id: 'dashboard-droppable-zone',
            data: {
              droppableContainer: dashboardContainer,
            }
          },
          ...filteredCollisions
        ];
      }
    }
    
    return filteredCollisions;
  };

  return (
    <DndContext
      sensors={sensors}
      modifiers={[snapToGridModifier, excludeHeaderModifier]}
      collisionDetection={customCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      {children}
      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
            <TaskBox task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function DndProvider({ children, onDragStart, onDragEnd, onDragOver, activeTask }: DndProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <DndContextWrapper
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      activeTask={activeTask}
    >
      {children}
    </DndContextWrapper>
  );
}

