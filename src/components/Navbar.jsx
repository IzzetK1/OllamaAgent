import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { FiSun, FiMoon, FiSettings, FiMessageSquare } from 'react-icons/fi';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-dark-700 border-b border-gray-200 dark:border-dark-600 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="https://ollama.com/ollama-logo.svg" alt="Ollama Logo" className="h-8 w-8 mr-2" />
            <span className="text-xl font-semibold">Ollama AI Geliştirme Platformu</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-600"
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          >
            {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
          </button>
          
          <Link 
            to="/chat" 
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-600"
            aria-label="Sohbet"
          >
            <FiMessageSquare className="h-5 w-5" />
          </Link>
          
          <Link 
            to="/settings" 
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-600"
            aria-label="Ayarlar"
          >
            <FiSettings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;