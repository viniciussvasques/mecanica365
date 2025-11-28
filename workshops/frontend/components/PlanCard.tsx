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
          ? 'border-[#00E0B8] bg-gradient-to-br from-[#00E0B8]/10 to-[#3ABFF8]/10 shadow-lg scale-105'
          : 'border-[#2A3038] bg-[#1A1E23] hover:border-[#00E0B8]/50 hover:shadow-md'
        }
        ${popular ? 'ring-2 ring-[#00E0B8]/30' : ''}
      `}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-[#0F1115] text-xs font-bold px-4 py-1 rounded-full shadow-md">
          ⭐ MAIS POPULAR
        </div>
      )}
      
      <div className="mb-4">
        <h3 className={`text-2xl font-bold mb-2 ${selected ? 'text-[#00E0B8]' : 'text-[#D0D6DE]'}`}>
          {label}
        </h3>
        <div className="flex items-baseline">
          <span className={`text-3xl font-extrabold ${selected ? 'text-[#00E0B8]' : 'text-[#D0D6DE]'}`}>
            {price}
          </span>
          <span className="ml-2 text-sm text-[#7E8691]">{period}</span>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-[#D0D6DE]">
            <svg className="w-5 h-5 text-[#00E0B8] mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {selected && (
        <div className="mt-4 pt-4 border-t border-[#00E0B8]/30">
          <div className="flex items-center justify-center text-[#00E0B8] font-semibold text-sm">
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

