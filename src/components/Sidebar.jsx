import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFolder, FiMessageSquare, FiSettings } from 'react-icons/fi';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white dark:bg-dark-700 border-r border-gray-200 dark:border-dark-600 shadow-sm hidden md:block">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Menü</h2>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-2">
            <li>
              <NavLink 
                to="/projects" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-dark-600'
                  }`
                }
              >
                <FiFolder className="mr-3 h-5 w-5" />
                <span>Projeler</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/chat" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-dark-600'
                  }`
                }
              >
                <FiMessageSquare className="mr-3 h-5 w-5" />
                <span>Sohbet</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/settings" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-md ${
                    isActive 
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-dark-600'
                  }`
                }
              >
                <FiSettings className="mr-3 h-5 w-5" />
                <span>Ayarlar</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-dark-600">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
              <span>AI</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Ollama AI</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Aktif</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;