import React from "react";

export interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  ariaLabel,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed bottom-6 right-6 h-14 w-14 rounded-full
        bg-primary text-primary-foreground
        shadow-lg shadow-green-100/50
        hover:bg-primary/90 hover:shadow-xl hover:shadow-green-100/70
        hover:scale-105
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center justify-center
        ${className}
      `}
      aria-label={ariaLabel}
      type="button"
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
};
