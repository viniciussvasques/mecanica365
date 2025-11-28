import React from 'react';

interface PlanCardProps {
  value: string;
  label: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  selected: boolean;
  onClick: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  label,
  price,
  period,
  features,
  popular = false,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full p-6 border-2 rounded-xl text-left
        transition-all duration-300 transform
        ${selected
          ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg scale-105'
          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
        }
        ${popular ? 'ring-2 ring-primary-200' : ''}
      `}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">
          ⭐ MAIS POPULAR
        </div>
      )}
      
      <div className="mb-4">
        <h3 className={`text-2xl font-bold mb-2 ${selected ? 'text-primary-700' : 'text-gray-900'}`}>
          {label}
        </h3>
        <div className="flex items-baseline">
          <span className={`text-3xl font-extrabold ${selected ? 'text-primary-600' : 'text-gray-900'}`}>
            {price}
          </span>
          <span className="ml-2 text-sm text-gray-600">{period}</span>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {selected && (
        <div className="mt-4 pt-4 border-t border-primary-200">
          <div className="flex items-center justify-center text-primary-600 font-semibold text-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Selecionado
          </div>
        </div>
      )}
    </button>
  );
};

