
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-4xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className="text-pink-500">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
