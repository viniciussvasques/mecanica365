import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-[#D0D6DE] mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`
            w-full px-4 py-3 border rounded-lg 
            text-[#D0D6DE] 
            placeholder:text-[#7E8691] placeholder:opacity-70 placeholder:font-normal
            bg-[#2A3038] border-[#2A3038]
            focus:outline-none focus:ring-2 focus:ring-[#00E0B8]/50 focus:border-[#00E0B8]
            transition-all duration-200
            ${error 
              ? 'border-[#FF4E3D] bg-[#FF4E3D]/10 text-[#FF4E3D] placeholder:text-[#FF4E3D]/60' 
              : 'hover:border-[#00E0B8]/30 hover:bg-[#2A3038]/80'
            }
            ${className}
          `}
          style={{
            ...(props.style || {}),
            WebkitTextFillColor: error ? '#FF4E3D' : '#D0D6DE',
          }}
        />
        {!error && (
          <div className="absolute inset-0 pointer-events-none rounded-lg border border-transparent focus-within:border-[#00E0B8]/20 transition-colors"></div>
        )}
      </div>
      {helperText && !error && (
        <p className="mt-2 text-xs text-[#7E8691] flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E0B8] opacity-70 mr-1"></span>
          <span className="text-[#7E8691]">{helperText}</span>
        </p>
      )}
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
