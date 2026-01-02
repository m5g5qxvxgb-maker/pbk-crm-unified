import React from 'react';

const Card = ({ 
  children, 
  hover = true, 
  padding = 'md', 
  className = '', 
  onClick 
}) => {
  const paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }[padding];

  return (
    <div
      onClick={onClick}
      className={`
        bg-bg-secondary rounded-xl border border-border-light
        transition-all duration-300
        ${hover ? 'hover:shadow-xl hover:border-gold-500/50 hover:-translate-y-1 cursor-pointer' : ''}
        ${paddingClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
