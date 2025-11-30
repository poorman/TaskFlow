"use client";

interface EditIconProps {
  className?: string;
  size?: number;
}

export default function EditIcon({ className = "", size = 12 }: EditIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Modern pencil edit icon with refined curves */}
      <g>
        <path
          d="M9.75 1.25C9.94487 1.05513 10.1758 0.900635 10.4291 0.79518C10.6824 0.689724 10.9532 0.635498 11.2273 0.635498C11.5014 0.635498 11.7722 0.689724 12.0255 0.79518C12.2788 0.900635 12.5097 1.05513 12.7045 1.25C12.8994 1.44487 13.0539 1.67576 13.1594 1.92906C13.2648 2.18237 13.3191 2.45322 13.3191 2.72727C13.3191 3.00132 13.2648 3.27217 13.1594 3.52548C13.0539 3.77878 12.8994 4.00967 12.7045 4.20455L4.45455 12.4545L0.75 13.25L1.54545 9.54545L9.75 1.25Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M7.5 3.5L10.5 6.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

