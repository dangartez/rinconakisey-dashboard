
import React from 'react';
import { InformationCircleIcon } from '../icons/Icons';

interface InfoTooltipProps {
  info: string;
  widthClass?: string; // e.g., 'w-64', 'w-80'
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ info, widthClass = 'w-64' }) => {
  return (
    <div className="relative flex items-center group">
      <InformationCircleIcon className="w-5 h-5 text-gray-400 cursor-pointer" />
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${widthClass} p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10`}
      >
        {info}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
      </div>
    </div>
  );
};
