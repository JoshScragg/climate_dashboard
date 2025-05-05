import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...rest
}) => {
  let baseClasses = 'inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 focus:ring-secondary-500 text-white',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  };
  
  const allClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${fullWidth ? 'w-full' : ''} 
    ${className}
  `;
  
  return (
    <button className={allClasses} {...rest}>
      {children}
    </button>
  );
};

export default Button;