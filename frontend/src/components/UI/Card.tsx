import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div 
      ref={cardRef}
      className={`
        bg-white rounded-lg shadow-md overflow-hidden 
        ${isFullScreen ? 'fixed top-0 left-0 w-full h-full z-50' : ''}
        ${className}
      `}
    >
      <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="flex space-x-2">
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            title="More Info"
          >
            <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button 
            onClick={toggleFullScreen}
            className="p-1 rounded-full hover:bg-gray-100"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className={`p-4 ${isFullScreen ? 'h-[calc(100%-3.5rem)] overflow-auto' : ''}`}>
        <div className={isFullScreen ? 'h-full' : ''}>
          {React.isValidElement(children) 
            ? React.cloneElement(children as React.ReactElement<any>, { isFullScreen }) 
            : children
          }
        </div>
      </div>
    </div>
  );
};

export default Card;