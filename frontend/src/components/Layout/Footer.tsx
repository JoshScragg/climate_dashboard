import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="flex justify-between items-center px-4">
        <div className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Climate Dashboard. All rights reserved.
        </div>
        <div className="text-sm text-gray-500">
          Data provided by NOAA, NASA, and World Bank
        </div>
      </div>
    </footer>
  );
};

export default Footer;