
import React from 'react';
import { Professional } from '../../types';

interface ProfessionalBadgeProps {
  professional: Professional;
}

const colorVariants = {
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    pink: 'bg-pink-100 text-pink-800',
};

const ProfessionalBadge: React.FC<ProfessionalBadgeProps> = ({ professional }) => {
  const badgeColor = colorVariants[professional.color] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${badgeColor}`}>
      {professional.name}
    </span>
  );
};

export default ProfessionalBadge;
