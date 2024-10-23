import React from 'react';
import '../styles/ShiningButton.css';

interface ShiningButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const ShiningButton: React.FC<ShiningButtonProps> = ({ onClick, children }) => {
  return (
    <button
      className='
        shining-button relative overflow-hidden text-sm py-2 px-4 rounded-full text-white 
        bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:ring-opacity-50 transition-all duration-300 ease-in-out'
      onClick={onClick}>
      {children}
    </button>
  );
};

export default ShiningButton;
