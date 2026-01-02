import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  error,
  required,
  options = [],
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
      <div className="relative">
        <select
          className={`
            w-full px-4 py-3 bg-bg-primary border border-border-light
            rounded-lg text-text-primary
            focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent
            transition-all duration-200
            appearance-none cursor-pointer
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option, idx) => (
            <option key={idx} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <ChevronDown size={20} />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
