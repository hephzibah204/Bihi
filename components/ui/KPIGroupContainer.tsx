import React from 'react';

interface KPIGroupContainerProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const KPIGroupContainer: React.FC<KPIGroupContainerProps> = ({ 
  title, 
  icon, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Group Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {children}
      </div>
    </div>
  );
};

export default KPIGroupContainer;
