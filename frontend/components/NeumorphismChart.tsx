"use client";

import { Task } from "@/lib/api";
import { useId, useState, useRef, useEffect, useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface NeumorphismChartProps {
  tasks: Task[];
  completionPercentage: number;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  onDrop?: (task: Task) => void;
}

export default function NeumorphismChart({ 
  tasks, 
  completionPercentage,
  positionX = 0,
  positionY = 0,
  width: initialWidth = 355,
  height: initialHeight = 355,
  onPositionChange,
  onSizeChange,
  onDrop
}: NeumorphismChartProps) {
  const uniqueId = useId().replace(/:/g, '-');
  
  // Calculate task counts
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: Task) => t.status === "done").length;
  
  // Calculate money earned from completed tasks vs money still to earn
  const moneyEarned = useMemo(() => {
    return tasks
      .filter((t: Task) => t.status === "done" && t.price !== null && t.price !== undefined)
      .reduce((sum, t) => sum + (t.price || 0), 0);
  }, [tasks]);

  const moneyToEarn = useMemo(() => {
    return tasks
      .filter((t: Task) => t.status !== "done" && t.price !== null && t.price !== undefined)
      .reduce((sum, t) => sum + (t.price || 0), 0);
  }, [tasks]);

  const totalMoney = moneyEarned + moneyToEarn;
  
  // Calculate percentage based on money (0-100), fallback to task completion if no money data
  const percentage = useMemo(() => {
    if (totalMoney > 0) {
      return Math.round((moneyEarned / totalMoney) * 100);
    }
    return totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;
  }, [moneyEarned, totalMoney, totalTasks, completedTasks]);
  
  // Animated percentage state for smooth transitions
  const [animatedPercentage, setAnimatedPercentage] = useState(percentage);
  const [animatedMoneyEarned, setAnimatedMoneyEarned] = useState(moneyEarned);
  const [animatedMoneyToEarn, setAnimatedMoneyToEarn] = useState(moneyToEarn);
  
  // Refs to track animation state
  const percentageAnimationRef = useRef<number | null>(null);
  const moneyAnimationRef = useRef<number | null>(null);
  const animatedPercentageRef = useRef(percentage);
  const animatedMoneyEarnedRef = useRef(moneyEarned);
  const animatedMoneyToEarnRef = useRef(moneyToEarn);
  
  // Update refs when state changes
  useEffect(() => {
    animatedPercentageRef.current = animatedPercentage;
  }, [animatedPercentage]);
  
  useEffect(() => {
    animatedMoneyEarnedRef.current = animatedMoneyEarned;
    animatedMoneyToEarnRef.current = animatedMoneyToEarn;
  }, [animatedMoneyEarned, animatedMoneyToEarn]);
  
  // Animate percentage changes smoothly
  useEffect(() => {
    const currentAnimated = animatedPercentageRef.current;
    if (Math.abs(currentAnimated - percentage) < 0.1) {
      if (currentAnimated !== percentage) {
        setAnimatedPercentage(percentage);
      }
      return;
    }
    
    // Cancel any ongoing animation
    if (percentageAnimationRef.current) {
      cancelAnimationFrame(percentageAnimationRef.current);
    }
    
    const duration = 800; // Animation duration in ms
    const startPercentage = currentAnimated;
    const endPercentage = percentage;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentPercentage = startPercentage + (endPercentage - startPercentage) * easeOutCubic;
      
      setAnimatedPercentage(currentPercentage);
      
      if (progress < 1) {
        percentageAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedPercentage(endPercentage);
        percentageAnimationRef.current = null;
      }
    };
    
    percentageAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (percentageAnimationRef.current) {
        cancelAnimationFrame(percentageAnimationRef.current);
        percentageAnimationRef.current = null;
      }
    };
  }, [percentage]); // Only depend on percentage, not animatedPercentage
  
  // Animate money values smoothly
  useEffect(() => {
    const currentEarned = animatedMoneyEarnedRef.current;
    const currentToEarn = animatedMoneyToEarnRef.current;
    
    if (Math.abs(currentEarned - moneyEarned) < 0.01 && Math.abs(currentToEarn - moneyToEarn) < 0.01) {
      if (currentEarned !== moneyEarned || currentToEarn !== moneyToEarn) {
        setAnimatedMoneyEarned(moneyEarned);
        setAnimatedMoneyToEarn(moneyToEarn);
      }
      return;
    }
    
    // Cancel any ongoing animation
    if (moneyAnimationRef.current) {
      cancelAnimationFrame(moneyAnimationRef.current);
    }
    
    const duration = 600;
    const startEarned = currentEarned;
    const endEarned = moneyEarned;
    const startToEarn = currentToEarn;
    const endToEarn = moneyToEarn;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentEarnedValue = startEarned + (endEarned - startEarned) * easeOutCubic;
      const currentToEarnValue = startToEarn + (endToEarn - startToEarn) * easeOutCubic;
      
      setAnimatedMoneyEarned(currentEarnedValue);
      setAnimatedMoneyToEarn(currentToEarnValue);
      
      if (progress < 1) {
        moneyAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedMoneyEarned(endEarned);
        setAnimatedMoneyToEarn(endToEarn);
        moneyAnimationRef.current = null;
      }
    };
    
    moneyAnimationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (moneyAnimationRef.current) {
        cancelAnimationFrame(moneyAnimationRef.current);
        moneyAnimationRef.current = null;
      }
    };
  }, [moneyEarned, moneyToEarn]); // Only depend on the target values
  
  // Calculate the arc path for the progress indicator
  // The arc fills between the inner and outer circles, starting from approximately 7 o'clock and going clockwise
  // Uses animatedPercentage for smooth transitions
  const getProgressArcPath = () => {
    const currentPercentage = Math.max(0, Math.min(100, animatedPercentage));
    if (currentPercentage === 0) {
      return "";
    }
    
    const centerX = 171.5;
    const centerY = 171.5;
    // Outer radius: from center (171.5) to outer edge (approximately 139.5 radius)
    // Inner radius: from center to inner edge (approximately 107.2 radius)
    // Based on the ring structure: outer circle at ~311, inner at ~278.704
    const outerRadius = 139.5;
    const innerRadius = 107.2;
    
    // Start from approximately 7 o'clock position (210 degrees or -150 degrees)
    const startAngle = -150;
    // For 100%, use 359.99 degrees instead of 360 to ensure the arc renders properly
    const angleSpan = currentPercentage >= 100 ? 359.99 : (currentPercentage / 100) * 360;
    const endAngle = startAngle + angleSpan;
    
    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calculate points on outer arc
    const outerX1 = centerX + outerRadius * Math.cos(startRad);
    const outerY1 = centerY + outerRadius * Math.sin(startRad);
    const outerX2 = centerX + outerRadius * Math.cos(endRad);
    const outerY2 = centerY + outerRadius * Math.sin(endRad);
    
    // Calculate points on inner arc
    const innerX1 = centerX + innerRadius * Math.cos(startRad);
    const innerY1 = centerY + innerRadius * Math.sin(startRad);
    const innerX2 = centerX + innerRadius * Math.cos(endRad);
    const innerY2 = centerY + innerRadius * Math.sin(endRad);
    
    // Large arc flag: 1 if angle > 180 degrees, 0 otherwise
    const largeArcFlag = currentPercentage > 50 ? 1 : 0;
    
    // Create a ring segment path (donut slice)
    return `M ${outerX1} ${outerY1}
            A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
            L ${innerX2} ${innerY2}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
            Z`;
  };
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [position, setPosition] = useState({ x: positionX, y: positionY });
  // Ensure square dimensions - use width for both
  const [size, setSize] = useState({ width: initialWidth, height: initialWidth });
  const [isHovered, setIsHovered] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);
  
  // Use dnd-kit's useDraggable hook for chart dragging
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDraggableRef,
    transform: dragTransform,
    isDragging: isChartDragging,
  } = useDraggable({
    id: `chart-${uniqueId}`,
    data: {
      type: 'chart',
    },
  });
  
  // Use dnd-kit's useDroppable hook for dropping tasks on chart
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `chart-drop-${uniqueId}`,
  });
  
  // Combine refs for both dragging and dropping
  const combinedRef = (node: SVGSVGElement | null) => {
    chartRef.current = node;
    // dnd-kit expects HTMLElement, but SVGElement works too - cast if needed
    if (node) {
      setDraggableRef(node as any);
      setDroppableRef(node as any);
    }
  };
  
  // Get transform style from dnd-kit for chart dragging
  const chartDragTransform = dragTransform ? CSS.Translate.toString(dragTransform) : undefined;
  
  // Update position when prop changes
  useEffect(() => {
    setPosition({ x: positionX, y: positionY });
  }, [positionX, positionY]);
  
  // Update size when prop changes - maintain square
  useEffect(() => {
    setSize({ width: initialWidth, height: initialWidth });
  }, [initialWidth]);
  
  // Save chart position when dragging ends
  useEffect(() => {
    if (!isChartDragging && dragTransform && onPositionChange) {
      const newX = positionX + dragTransform.x;
      const newY = positionY + dragTransform.y;
      onPositionChange(newX, newY);
    }
  }, [isChartDragging, dragTransform, positionX, positionY, onPositionChange]);

  // Resize handlers - uniform scaling from corner, maintains square aspect ratio
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    // Get the chart's initial position and size on the page
    const chartRect = chartRef.current?.getBoundingClientRect();
    if (!chartRef.current || !chartRect) return;
    
    // Store the initial top-left corner position (anchor point for scaling)
    const initialTopLeftX = chartRect.left;
    const initialTopLeftY = chartRect.top;
    const startWidth = size.width;
    const startHeight = size.width; // Always square
    
    // Calculate initial distance from top-left corner to mouse position
    const initialDistance = Math.sqrt(
      Math.pow(e.clientX - initialTopLeftX, 2) + Math.pow(e.clientY - initialTopLeftY, 2)
    );
    
    // Calculate initial distance from top-left to bottom-right corner (diagonal)
    const initialDiagonal = Math.sqrt(
      Math.pow(startWidth, 2) + Math.pow(startHeight, 2)
    );
    
    // Calculate initial scale (distance to mouse / diagonal)
    const initialScale = initialDistance / initialDiagonal;
    
    let currentSize = { width: size.width, height: size.width };

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate current distance from top-left corner to current mouse position
      const currentDistance = Math.sqrt(
        Math.pow(e.clientX - initialTopLeftX, 2) + Math.pow(e.clientY - initialTopLeftY, 2)
      );
      
      // Calculate new scale factor based on distance change (uniform scaling)
      const newScale = currentDistance / initialDiagonal;
      const scaleFactor = newScale / initialScale;
      
      // Apply uniform scaling, maintaining square aspect ratio
      const newWidth = Math.max(200, Math.min(800, startWidth * scaleFactor));
      const newSize = {
        width: newWidth,
        height: newWidth, // Always square
      };
      currentSize = newSize;
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (onSizeChange) {
        onSizeChange(currentSize.width, currentSize.width);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <svg 
      ref={combinedRef}
      width={size.width}
      height={size.width}
      viewBox="0 0 355 355" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className="group"
      style={{ 
        position: 'relative',
        transform: chartDragTransform 
          ? `${chartDragTransform} translate(${position.x}px, ${position.y}px)`
          : `translate(${position.x}px, ${position.y}px)`,
        cursor: isChartDragging ? 'grabbing' : (isOver ? 'copy' : 'grab'),
        zIndex: isChartDragging || isResizing ? 1000 : 1,
        transition: isChartDragging || isResizing ? 'none' : 'transform 0.2s ease',
        willChange: isChartDragging || isResizing ? 'transform' : 'auto',
        borderRadius: '8px',
        userSelect: 'none',
      }}
      {...(dragListeners as any)}
      {...(dragAttributes as any)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Prevent drag if clicking on resize handle
        if ((e.target as HTMLElement).closest('.resize-handle')) {
          e.stopPropagation();
        }
      }}
    >
          <g filter={`url(#filter0_ddd_${uniqueId})`}>
            <mask id={`path-1-inside-1_${uniqueId}`} fill="white">
              <path fillRule="evenodd" clipRule="evenodd" d="M171.5 32C94.4563 32 32 94.4563 32 171.5C32 248.544 94.4563 311 171.5 311C248.544 311 311 248.544 311 171.5C311 94.4563 248.544 32 171.5 32ZM171.5 64.2958C112.293 64.2958 64.2958 112.293 64.2958 171.5C64.2958 230.707 112.293 278.704 171.5 278.704C230.707 278.704 278.704 230.707 278.704 171.5C278.704 112.293 230.707 64.2958 171.5 64.2958Z"/>
            </mask>
            <path fillRule="evenodd" clipRule="evenodd" d="M171.5 32C94.4563 32 32 94.4563 32 171.5C32 248.544 94.4563 311 171.5 311C248.544 311 311 248.544 311 171.5C311 94.4563 248.544 32 171.5 32ZM171.5 64.2958C112.293 64.2958 64.2958 112.293 64.2958 171.5C64.2958 230.707 112.293 278.704 171.5 278.704C230.707 278.704 278.704 230.707 278.704 171.5C278.704 112.293 230.707 64.2958 171.5 64.2958Z" fill="#D1D6DA" stroke="#A4AEB7" strokeWidth="2"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M171.5 32C94.4563 32 32 94.4563 32 171.5C32 248.544 94.4563 311 171.5 311C248.544 311 311 248.544 311 171.5C311 94.4563 248.544 32 171.5 32ZM171.5 64.2958C112.293 64.2958 64.2958 112.293 64.2958 171.5C64.2958 230.707 112.293 278.704 171.5 278.704C230.707 278.704 278.704 230.707 278.704 171.5C278.704 112.293 230.707 64.2958 171.5 64.2958Z" fill={`url(#paint0_radial_${uniqueId})`}/>
            <path fillRule="evenodd" clipRule="evenodd" d="M171.5 32C94.4563 32 32 94.4563 32 171.5C32 248.544 94.4563 311 171.5 311C248.544 311 311 248.544 311 171.5C311 94.4563 248.544 32 171.5 32ZM171.5 64.2958C112.293 64.2958 64.2958 112.293 64.2958 171.5C64.2958 230.707 112.293 278.704 171.5 278.704C230.707 278.704 278.704 230.707 278.704 171.5C278.704 112.293 230.707 64.2958 171.5 64.2958Z" fill={`url(#paint1_radial_${uniqueId})`}/>
            <path d="M33 171.5C33 95.0086 95.0086 33 171.5 33V31C93.904 31 31 93.904 31 171.5H33ZM171.5 310C95.0086 310 33 247.991 33 171.5H31C31 249.096 93.904 312 171.5 312V310ZM310 171.5C310 247.991 247.991 310 171.5 310V312C249.096 312 312 249.096 312 171.5H310ZM171.5 33C247.991 33 310 95.0086 310 171.5H312C312 93.904 249.096 31 171.5 31V33ZM65.2958 171.5C65.2958 112.845 112.845 65.2958 171.5 65.2958V63.2958C111.741 63.2958 63.2958 111.741 63.2958 171.5H65.2958ZM171.5 277.704C112.845 277.704 65.2958 230.155 65.2958 171.5H63.2958C63.2958 231.26 111.741 279.704 171.5 279.704V277.704ZM277.704 171.5C277.704 230.155 230.155 277.704 171.5 277.704V279.704C231.26 279.704 279.704 231.26 279.704 171.5H277.704ZM171.5 65.2958C230.155 65.2958 277.704 112.845 277.704 171.5H279.704C279.704 111.741 231.26 63.2958 171.5 63.2958V65.2958Z" fill="white" mask={`url(#path-1-inside-1_${uniqueId})`}/>
          </g>

          <path d="M168.181 179.662L168.59 180.29L168.931 180.069V179.662H168.181ZM173.922 179.662H173.172V180.069L173.513 180.29L173.922 179.662ZM175.684 184.35C175.684 187.016 173.59 189.141 171.052 189.141V190.641C174.459 190.641 177.184 187.803 177.184 184.35H175.684ZM171.052 189.141C168.513 189.141 166.419 187.016 166.419 184.35H164.919C164.919 187.803 167.644 190.641 171.052 190.641V189.141ZM166.419 184.35C166.419 182.634 167.289 181.136 168.59 180.29L167.772 179.033C166.053 180.151 164.919 182.118 164.919 184.35H166.419ZM173.513 180.29C174.814 181.136 175.684 182.634 175.684 184.35H177.184C177.184 182.118 176.05 180.151 174.331 179.033L173.513 180.29ZM173.172 154.983V179.662H174.672V154.983H173.172ZM168.931 179.662V154.983H167.431V179.662H168.931ZM170.872 152.962C171.416 152.962 172.008 153.194 172.463 153.59C172.915 153.983 173.172 154.483 173.172 154.983H174.672C174.672 153.953 174.147 153.067 173.447 152.458C172.748 151.85 171.814 151.462 170.872 151.462V152.962ZM170.872 151.462C168.951 151.462 167.431 153.059 167.431 154.983H168.931C168.931 153.846 169.82 152.962 170.872 152.962V151.462ZM171.41 157.395H172.487V155.895H171.41V157.395ZM171.41 161.828H172.487V160.328H171.41V161.828ZM171.41 166.26H172.487V164.76H171.41V166.26ZM171.41 170.693H172.487V169.193H171.41V170.693ZM171.41 175.126H172.487V173.626H171.41V175.126ZM171.41 179.559H172.487V178.059H171.41V179.559Z" fill="#A4AEB7"/>

          <path 
            d={getProgressArcPath()} 
            fill={`url(#paint2_radial_${uniqueId})`} 
            stroke="#11A8FD" 
            strokeWidth="3"
            style={{
              transition: 'd 0.1s linear',
            }}
          />

          <path d="M171.051 40.9711V50.3907M171.051 292.161V301.58M157.431 41.6849L158.416 51.0529M183.687 291.499L184.672 300.867M143.96 43.8185L145.918 53.0323M196.185 289.519L198.143 298.733M130.785 47.3486L133.696 56.3072M208.407 286.244L211.318 295.203M118.052 52.2365L121.883 60.8417M220.22 281.71L224.051 290.315M105.899 58.4286L110.609 66.5862M231.494 275.965L236.204 284.123M94.4603 65.857L99.997 73.4777M242.106 269.074L247.643 276.694M83.8606 74.4405L90.1636 81.4406M251.939 261.111L258.242 268.111M74.2162 84.0849L81.2164 90.3878M260.887 252.164L267.887 258.467M65.6328 94.6846L73.2534 100.221M268.85 242.33L276.47 247.867M58.2043 106.123L66.3619 110.833M275.741 231.718L283.899 236.428M52.0122 118.276L60.6175 122.107M281.485 220.444L290.091 224.275M47.1244 131.009L56.083 133.92M286.02 208.631L294.979 211.542M43.5944 144.184L52.8081 146.142M289.295 196.409L298.509 198.368M41.4607 157.655L50.8287 158.64M291.274 183.912L300.642 184.896M40.7469 171.276H50.1665M291.937 171.276H301.356M41.4607 184.896L50.8287 183.912M291.274 158.64L300.642 157.655M43.5944 198.368L52.8081 196.409M289.295 146.142L298.509 144.184M47.1244 211.542L56.083 208.631M286.02 133.92L294.979 131.009M52.0123 224.275L60.6175 220.444M281.486 122.107L290.091 118.276M58.2044 236.428L66.362 231.718M275.741 110.833L283.899 106.123M65.6328 247.867L73.2535 242.33M268.85 100.221L276.47 94.6846M74.2163 258.467L81.2164 252.164M260.887 90.3879L267.887 84.0849M83.8607 268.111L90.1636 261.111M251.939 81.4407L258.242 74.4405M94.4604 276.694L99.9971 269.074M242.106 73.4777L247.643 65.8571M105.899 284.123L110.609 275.965M231.494 66.5863L236.204 58.4286M118.052 290.315L121.883 281.71M220.22 60.8418L224.051 52.2365M130.785 295.203L133.696 286.244M208.407 56.3073L211.318 47.3487M143.96 298.733L145.918 289.519M196.185 53.0324L198.143 43.8186M157.431 300.867L158.416 291.499M183.687 51.0529L184.672 41.6849" stroke="#CFD5DA" strokeLinecap="round"/>

          <g filter={`url(#filter1_dd_${uniqueId})`}>
            <mask id={`path-6-inside-2_${uniqueId}`} fill="white">
              <path d="M83.7066 171.5C83.7066 123.013 123.013 83.7065 171.5 83.7065C219.987 83.7065 259.293 123.013 259.293 171.5C259.293 219.987 219.987 259.293 171.5 259.293C123.013 259.293 83.7066 219.987 83.7066 171.5Z"/>
            </mask>
            <path d="M83.7066 171.5C83.7066 123.013 123.013 83.7065 171.5 83.7065C219.987 83.7065 259.293 123.013 259.293 171.5C259.293 219.987 219.987 259.293 171.5 259.293C123.013 259.293 83.7066 219.987 83.7066 171.5Z" fill="#D1D6DA"/>
            <path d="M83.7066 171.5C83.7066 123.013 123.013 83.7065 171.5 83.7065C219.987 83.7065 259.293 123.013 259.293 171.5C259.293 219.987 219.987 259.293 171.5 259.293C123.013 259.293 83.7066 219.987 83.7066 171.5Z" fill={`url(#paint3_radial_${uniqueId})`}/>
            <path d="M83.7066 171.5C83.7066 123.013 123.013 83.7065 171.5 83.7065C219.987 83.7065 259.293 123.013 259.293 171.5C259.293 219.987 219.987 259.293 171.5 259.293C123.013 259.293 83.7066 219.987 83.7066 171.5Z" fill={`url(#paint4_radial_${uniqueId})`}/>
            <path d="M81.7066 170.5C81.7066 121.461 121.461 81.7065 170.5 81.7065C219.539 81.7065 259.293 121.461 259.293 170.5V171.5C259.293 124.118 219.987 85.7065 171.5 85.7065C124.118 85.7065 85.7066 124.118 85.7066 171.5L81.7066 170.5ZM259.293 259.293H83.7066H259.293ZM170.5 259.293C121.461 259.293 81.7066 219.539 81.7066 170.5C81.7066 121.461 121.461 81.7065 170.5 81.7065L171.5 85.7065C124.118 85.7065 85.7066 124.118 85.7066 171.5C85.7066 219.987 124.118 259.293 171.5 259.293H170.5ZM259.293 83.7065V259.293V83.7065Z" fill="white" mask={`url(#path-6-inside-2_${uniqueId})`}/>
          </g>

          {/* Dynamic text for money earned */}
          <text
            x="171.5"
            y="155"
            textAnchor="middle"
            fill={`url(#textGradient_${uniqueId})`}
            fontSize="32"
            fontWeight="bold"
            fontFamily="sans-serif"
            style={{
              transition: 'opacity 0.3s ease',
            }}
          >
            ${Math.round(animatedMoneyEarned).toLocaleString()}
          </text>
          
          {/* Label for earned money */}
          <text
            x="171.5"
            y="175"
            textAnchor="middle"
            fill="#A4AEB7"
            fontSize="12"
            fontFamily="sans-serif"
          >
            Earned
          </text>
          
          {/* Dynamic text for money to earn */}
          <text
            x="171.5"
            y="200"
            textAnchor="middle"
            fill={`url(#textGradient2_${uniqueId})`}
            fontSize="24"
            fontWeight="600"
            fontFamily="sans-serif"
            style={{
              transition: 'opacity 0.3s ease',
            }}
          >
            ${Math.round(animatedMoneyToEarn).toLocaleString()}
          </text>
          
          {/* Label for money to earn */}
          <text
            x="171.5"
            y="215"
            textAnchor="middle"
            fill="#A4AEB7"
            fontSize="11"
            fontFamily="sans-serif"
          >
            To Earn
          </text>

          <defs>
            <filter id={`filter0_ddd_${uniqueId}`} x="0" y="0" width="355" height="355" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="-4" dy="-4"/>
              <feGaussianBlur stdDeviation="14"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result={`effect1_dropShadow_${uniqueId}`}/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="12" dy="12"/>
              <feGaussianBlur stdDeviation="16"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.643137 0 0 0 0 0.682353 0 0 0 0 0.717647 0 0 0 0.15 0"/>
              <feBlend mode="normal" in2={`effect1_dropShadow_${uniqueId}`} result={`effect2_dropShadow_${uniqueId}`}/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="4"/>
              <feGaussianBlur stdDeviation="9"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.643137 0 0 0 0 0.682353 0 0 0 0 0.717647 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2={`effect2_dropShadow_${uniqueId}`} result={`effect3_dropShadow_${uniqueId}`}/>
              <feBlend mode="normal" in="SourceGraphic" in2={`effect3_dropShadow_${uniqueId}`} result="shape"/>
            </filter>

            <filter id={`filter1_dd_${uniqueId}`} x="75.7066" y="79.7065" width="211.587" height="207.587" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="12" dy="12"/>
              <feGaussianBlur stdDeviation="8"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.643137 0 0 0 0 0.682353 0 0 0 0 0.717647 0 0 0 0.15 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result={`effect1_dropShadow_${uniqueId}`}/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="4"/>
              <feGaussianBlur stdDeviation="4"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
              <feBlend mode="normal" in2={`effect1_dropShadow_${uniqueId}`} result={`effect2_dropShadow_${uniqueId}`}/>
              <feBlend mode="normal" in="SourceGraphic" in2={`effect2_dropShadow_${uniqueId}`} result="shape"/>
            </filter>

            <radialGradient id={`paint0_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(171.5 171.5) rotate(90) scale(139.5)">
              <stop stopColor="white"/>
              <stop offset="1" stopColor="white" stopOpacity="0"/>
            </radialGradient>

            <radialGradient id={`paint1_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(171.5 171.5) rotate(90) scale(478.851)">
              <stop stopColor="white"/>
              <stop offset="1" stopColor="white" stopOpacity="0"/>
            </radialGradient>

            <radialGradient id={`paint2_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientTransform="matrix(192.096 0 117.548 313.636 86.6085 253.274)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#005EA3"/>
              <stop offset="0.942708" stopColor="#11A8FD"/>
            </radialGradient>
            
            {/* Linear gradient for text - blue gradient from ADD button */}
            <linearGradient id={`textGradient_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#11A8FD"/>
              <stop offset="100%" stopColor="#005EA3"/>
            </linearGradient>
            
            <linearGradient id={`textGradient2_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#11A8FD"/>
              <stop offset="100%" stopColor="#0081C9"/>
            </linearGradient>

            <radialGradient id={`paint3_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(171.5 171.5) rotate(90) scale(87.7934)">
              <stop stopColor="white"/>
              <stop offset="1" stopColor="white" stopOpacity="0"/>
            </radialGradient>

            <radialGradient id={`paint4_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(171.5 171.5) rotate(90) scale(301.362)">
              <stop stopColor="white"/>
              <stop offset="1" stopColor="white" stopOpacity="0"/>
            </radialGradient>

            <radialGradient id={`paint5_radial_${uniqueId}`} cx="0" cy="0" r="1" gradientTransform="matrix(98.7408 0 60.4218 91.5002 124.886 195.357)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#005EA3"/>
              <stop offset="0.942708" stopColor="#11A8FD"/>
            </radialGradient>
          </defs>
          
          {/* Resize Handle - Bottom right corner using foreignObject */}
          <foreignObject
            x="335"
            y="335"
            width="20"
            height="20"
            className="resize-handle"
            style={{
              cursor: 'se-resize',
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div
              className="w-full h-full cursor-se-resize"
              onMouseDown={handleResizeStart}
              style={{
                background: 'radial-gradient(circle at bottom right, rgba(17, 168, 253, 0.3) 0%, transparent 70%)',
                borderBottomRightRadius: '8px',
                position: 'relative',
              }}
              title="Resize chart"
            >
              <div 
                className="absolute bottom-1 right-1"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderBottom: '6px solid #11A8FD',
                }}
              ></div>
            </div>
          </foreignObject>
      </svg>
  );
}

