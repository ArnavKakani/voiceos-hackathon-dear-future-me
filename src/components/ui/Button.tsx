import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'game';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-[#5D8E67] text-[#F9F5ED] hover:bg-[#4a7254] shadow-soft border-2 border-[#5D8E67]',
  secondary: 'bg-transparent text-[#5D8E67] border-2 border-[#5D8E67] hover:bg-[#5D8E67]/10',
  ghost: 'bg-[#9FD89C]/25 text-[#5D8E67] border-2 border-[#9FD89C] hover:bg-[#9FD89C]/40',
  game: 'bg-[#F9F5ED] text-[#5D8E67] border-2 border-[#5D8E67] hover:bg-[#9FD89C]/20 w-full',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`
        font-comfortaa font-semibold transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#5D8E67] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
