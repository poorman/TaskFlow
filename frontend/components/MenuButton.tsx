"use client";

import { useId } from "react";

interface MenuButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function MenuButton({ label, isActive, onClick }: MenuButtonProps) {
  const uniqueId = useId().replace(/:/g, '-');
  
  if (isActive) {
    // Active button - Blue gradient
    return (
      <button
        onClick={onClick}
        className="menu-button menu-button-active"
        type="button"
      >
        <svg 
          width="179" 
          height="167" 
          viewBox="0 0 179 167" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <g filter={`url(#filter0_dd_${uniqueId})`}>
            <rect x="128.75" y="133.75" width="78.7499" height="78.7499" rx="39.375" transform="rotate(-180 128.75 133.75)" fill={`url(#paint0_linear_${uniqueId})`}/>
          </g>
          <g filter={`url(#filter1_f_${uniqueId})`}>
            <rect x="129.375" y="134.375" width="79.9999" height="79.9999" rx="40" transform="rotate(-180 129.375 134.375)" fill={`url(#paint1_linear_${uniqueId})`}/>
          </g>
          <rect x="126.375" y="131.375" width="73.9999" height="73.9999" rx="37" transform="rotate(-180 126.375 131.375)" fill={`url(#paint2_linear_${uniqueId})`} stroke="#058DD9"/>
          <g filter={`url(#filter2_f_${uniqueId})`}>
            <rect x="126.375" y="132.375" width="74.9999" height="74.9999" rx="37.5" transform="rotate(-180 126.375 132.375)" fill={`url(#paint3_linear_${uniqueId})`}/>
          </g>
          
          <defs>
            <path 
              id={`textPath_active_${uniqueId}`} 
              d="M 45 65 A 35 45 0 0 1 133 110" 
              fill="none"
            />
            <filter id={`filter0_dd_${uniqueId}`} x="0" y="0" width="178.75" height="188.75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="-10" dy="-15"/>
              <feGaussianBlur stdDeviation="5"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.183073 0 0 0 0 0.224583 0 0 0 0 0.2375 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="10" dy="15"/>
              <feGaussianBlur stdDeviation="5"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
            </filter>
            <filter id={`filter1_f_${uniqueId}`} x="48.375" y="53.375" width="81.9999" height="81.9999" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="0.125" result="effect1_foregroundBlur"/>
            </filter>
            <filter id={`filter2_f_${uniqueId}`} x="50.375" y="56.375" width="76.9999" height="76.9999" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="0.125" result="effect1_foregroundBlur"/>
            </filter>
            <linearGradient id={`paint0_linear_${uniqueId}`} x1="194.077" y1="203.551" x2="141.278" y2="144.489" gradientUnits="userSpaceOnUse">
              <stop stopColor="#11A8FD"/>
              <stop offset="1" stopColor="#0081C9"/>
            </linearGradient>
            <linearGradient id={`paint1_linear_${uniqueId}`} x1="195.375" y1="204.375" x2="145.375" y2="143.375" gradientUnits="userSpaceOnUse">
              <stop stopColor="#11A8FD"/>
              <stop offset="1" stopColor="#0081C9"/>
            </linearGradient>
            <linearGradient id={`paint2_linear_${uniqueId}`} x1="188.75" y1="197.5" x2="141.875" y2="140.312" gradientUnits="userSpaceOnUse">
              <stop stopColor="#005EA3"/>
              <stop offset="1" stopColor="#11A8FD"/>
            </linearGradient>
            <linearGradient id={`paint3_linear_${uniqueId}`} x1="188.25" y1="198" x2="141.375" y2="140.812" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016BB8"/>
              <stop offset="1" stopColor="#11A8FD"/>
            </linearGradient>
          </defs>
          
          {/* Curved text path around the top of the circle */}
          <text 
            fill="#1F2124" 
            fontSize="18" 
            fontWeight="600"
            fontFamily="Arial, sans-serif"
            dominantBaseline="alphabetic"
            dy="0"
          >
            <textPath 
              href={`#textPath_active_${uniqueId}`} 
              startOffset="35%"
              textAnchor="middle"
            >
              {label}
            </textPath>
          </text>
        </svg>
      </button>
    );
  } else {
    // Inactive button - Dark gray
    return (
      <button
        onClick={onClick}
        className="menu-button menu-button-inactive"
        type="button"
      >
        <svg 
          width="170" 
          height="149" 
          viewBox="0 0 170 149" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <g filter={`url(#filter0_dd_${uniqueId})`}>
            <rect x="115.49" y="115.491" width="78.4905" height="78.4905" rx="39.2453" transform="rotate(-180 115.49 115.491)" fill={`url(#paint0_linear_${uniqueId})`}/>
          </g>
          <rect x="116.247" y="116.245" width="80" height="80" rx="40" transform="rotate(-180 116.247 116.245)" fill={`url(#paint1_linear_${uniqueId})`}/>
          <g filter={`url(#filter1_i_${uniqueId})`}>
            <rect x="112.246" y="112.246" width="72" height="72" rx="36" transform="rotate(-180 112.246 112.246)" fill={`url(#paint2_linear_${uniqueId})`}/>
          </g>
          <g filter={`url(#filter2_f_${uniqueId})`}>
            <rect x="112.246" y="112.246" width="72" height="72" rx="36" transform="rotate(-180 112.246 112.246)" fill={`url(#paint3_linear_${uniqueId})`}/>
          </g>
          
          <defs>
            <path 
              id={`textPath_inactive_${uniqueId}`} 
              d="M 22 34 A 42 42 0 0 1 108 64" 
              fill="none"
            />
            <filter id={`filter0_dd_${uniqueId}`} x="0" y="0" width="169.49" height="169.491" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="-7" dy="-7"/>
              <feGaussianBlur stdDeviation="3.75"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.14902 0 0 0 0 0.180392 0 0 0 0 0.196078 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dx="14" dy="14"/>
              <feGaussianBlur stdDeviation="5"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.0646354 0 0 0 0 0.0646354 0 0 0 0 0.0708333 0 0 0 0.1875 0"/>
              <feBlend mode="normal" in2="effect1_dropShadow" result="effect2_dropShadow"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow" result="shape"/>
            </filter>
            <filter id={`filter1_i_${uniqueId}`} x="40.2462" y="40.2463" width="72" height="71.9999" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset/>
              <feGaussianBlur stdDeviation="0.375"/>
              <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0.245833 0 0 0 0 0.245833 0 0 0 0 0.245833 0 0 0 0.1125 0"/>
              <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
            </filter>
            <filter id={`filter2_f_${uniqueId}`} x="39.2462" y="39.2463" width="74" height="73.9999" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="0.125" result="effect1_foregroundBlur"/>
            </filter>
            <linearGradient id={`paint0_linear_${uniqueId}`} x1="180.602" y1="185.062" x2="127.978" y2="126.194" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1D2328"/>
              <stop offset="1" stopColor="#131314"/>
            </linearGradient>
            <linearGradient id={`paint1_linear_${uniqueId}`} x1="182.611" y1="187.154" x2="128.974" y2="127.154" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1D2328"/>
              <stop offset="1" stopColor="#131314"/>
            </linearGradient>
            <linearGradient id={`paint2_linear_${uniqueId}`} x1="171.646" y1="175.246" x2="126.646" y2="120.346" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2F353A"/>
              <stop offset="1" stopColor="#1C1F22"/>
            </linearGradient>
            <linearGradient id={`paint3_linear_${uniqueId}`} x1="171.646" y1="175.246" x2="126.646" y2="120.346" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2F353A"/>
              <stop offset="1" stopColor="#1C1F22"/>
            </linearGradient>
          </defs>
          
          {/* Curved text path around the top of the circle */}
          <text 
            fill="#1F2124" 
            fontSize="18" 
            fontWeight="600"
            fontFamily="Arial, sans-serif"
            dominantBaseline="alphabetic"
            dy="8"
          >
            <textPath 
              href={`#textPath_inactive_${uniqueId}`} 
              startOffset="40%"
              textAnchor="middle"
            >
              {label}
            </textPath>
          </text>
        </svg>
      </button>
    );
  }
}

