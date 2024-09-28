import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HomeIcon, MapIcon, PlusCircleIcon, BellIcon, UserIcon } from '@heroicons/react/24/outline';

const tabs = [
  { name: 'Home', icon: HomeIcon, path: '/' },
  { name: 'Map', icon: MapIcon, path: '/map' },
  { name: 'Post', icon: PlusCircleIcon, path: '/post' },
  { name: 'Inbox', icon: BellIcon, path: '/notifications' },
  { name: 'Profile', icon: UserIcon, path: '/profile' },
];

const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
      <nav className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-1 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.path}
                className={({ isActive }) =>
                  `flex flex-col items-center pt-2 pb-1 ${
                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <tab.icon className="h-6 w-6" aria-hidden="true" />
                <span className="mt-1 text-xs">{tab.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;