"use client";

import { useId } from "react";

export default function AddTaskButton() {
  const uniqueId = useId().replace(/:/g, '-');
  
  return (
    <svg 
      width="226" 
      height="236" 
      viewBox="0 0 226 236" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <g filter={`url(#filter0_dd_${uniqueId})`}>
        <rect x="176" y="181" width="126" height="126" rx="63" transform="rotate(-180 176 181)" fill={`url(#paint0_linear_${uniqueId})`}/>
      </g>
      <g filter={`url(#filter1_f_${uniqueId})`}>
        <rect x="177" y="182" width="128" height="128" rx="64" transform="rotate(-180 177 182)" fill={`url(#paint1_linear_${uniqueId})`}/>
      </g>
      <rect x="172.5" y="177.5" width="119" height="119" rx="59.5" transform="rotate(-180 172.5 177.5)" fill={`url(#paint2_linear_${uniqueId})`} stroke="#058DD9"/>
      <g filter={`url(#filter2_f_${uniqueId})`}>
        <rect x="173" y="178" width="120" height="120" rx="60" transform="rotate(-180 173 178)" fill={`url(#paint3_linear_${uniqueId})`}/>
      </g>
      
      {/* Plus Icon - Centered */}
      <g transform="translate(113, 118)">
        <line x1="0" y1="-25" x2="0" y2="25" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        <line x1="-25" y1="0" x2="25" y2="0" stroke="white" strokeWidth="8" strokeLinecap="round"/>
      </g>
      
      <defs>
        <filter id={`filter0_dd_${uniqueId}`} x="0" y="0" width="226" height="236" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="-10" dy="-15"/>
          <feGaussianBlur stdDeviation="20"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.183073 0 0 0 0 0.224583 0 0 0 0 0.2375 0 0 0 1 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="10" dy="15"/>
          <feGaussianBlur stdDeviation="20"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
          <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
        </filter>
        <filter id={`filter1_f_${uniqueId}`} x="48" y="53" width="130" height="130" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur"/>
        </filter>
        <filter id={`filter2_f_${uniqueId}`} x="52" y="57" width="122" height="122" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="0.5" result="effect1_foregroundBlur"/>
        </filter>
        <linearGradient id={`paint0_linear_${uniqueId}`} x1="280.523" y1="292.682" x2="196.045" y2="198.182" gradientUnits="userSpaceOnUse">
          <stop stopColor="#11A8FD"/>
          <stop offset="1" stopColor="#0081C9"/>
        </linearGradient>
        <linearGradient id={`paint1_linear_${uniqueId}`} x1="282.6" y1="294" x2="202.6" y2="196.4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#11A8FD"/>
          <stop offset="1" stopColor="#0081C9"/>
        </linearGradient>
        <linearGradient id={`paint2_linear_${uniqueId}`} x1="272" y1="283" x2="197" y2="191.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#005EA3"/>
          <stop offset="1" stopColor="#11A8FD"/>
        </linearGradient>
        <linearGradient id={`paint3_linear_${uniqueId}`} x1="272" y1="283" x2="197" y2="191.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#005EA3"/>
          <stop offset="1" stopColor="#11A8FD"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

