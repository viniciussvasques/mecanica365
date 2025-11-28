import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`border-t border-[#2A3038] pt-6 mt-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#D0D6DE]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-[#7E8691]">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
};

