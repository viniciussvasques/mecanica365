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
      <label htmlFor={props.id} className="block text-sm font-medium text-[#D0D6DE] mb-2">
        {label}
      </label>
      <select
        {...props}
        className={`
          w-full px-4 py-3 border rounded-lg 
          text-[#F0F4F8] bg-[#1A1E23] border-[#3A4048]
          focus:outline-none focus:ring-2 focus:ring-[#00E0B8]/50 focus:border-[#00E0B8] focus:bg-[#1F2329]
          transition-all duration-200
          ${error 
            ? 'border-[#FF4E3D] bg-[#FF4E3D]/10 text-[#FF4E3D]' 
            : 'hover:border-[#00E0B8]/40 hover:bg-[#1F2329]'
          }
          ${className}
        `}
        style={{
          ...(props.style || {}),
          WebkitTextFillColor: error ? '#FF4E3D' : '#F0F4F8',
          color: error ? '#FF4E3D' : '#F0F4F8',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#1A1E23] text-[#F0F4F8]">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-[#FF4E3D] flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

