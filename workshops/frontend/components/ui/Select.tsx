import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-semibold text-gray-900 mb-1.5">
        {label}
      </label>
      <select
        {...props}
        className={`
          w-full px-4 py-2.5 border rounded-lg 
          text-gray-900 bg-white
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          transition-all duration-200
          ${error 
            ? 'border-red-300 bg-red-50 text-red-900' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

