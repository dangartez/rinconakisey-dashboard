
import React from 'react';
import GlobalSearch from '../search/GlobalSearch';

const Header: React.FC = () => {
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 px-8 py-3 sticky top-0 z-30 flex items-center justify-between">
      {/* Global Search takes up the available space */}
      <div className="flex-1 max-w-2xl">
        <GlobalSearch />
      </div>

      {/* User profile section */}
      <div className="flex items-center ml-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
          <img 
            src="https://i.pravatar.cc/150?u=a042581f4e29026704d" 
            alt="User Avatar" 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
