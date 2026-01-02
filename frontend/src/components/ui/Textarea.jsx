import React from 'react';

const Textarea = ({
  label,
  error,
  required,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-3 bg-bg-primary border border-border-light
          rounded-lg text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
          transition-all duration-200 resize-none
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Textarea;
