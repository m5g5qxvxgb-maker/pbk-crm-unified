import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-gold-500 to-gold-600
      text-text-inverse hover:from-gold-600 hover:to-gold-700
      focus:ring-gold-500 shadow-md hover:shadow-lg
    `,
    secondary: `
      bg-bg-tertiary text-text-primary border border-border-medium
      hover:bg-bg-hover focus:ring-gold-500
    `,
    outline: `
      bg-transparent text-text-primary border border-border-medium
      hover:bg-bg-tertiary focus:ring-gold-500
    `,
    ghost: `
      bg-transparent text-text-primary hover:bg-bg-tertiary
      focus:ring-gold-500
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700
      focus:ring-red-500 shadow-md hover:shadow-lg
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {icon && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;
