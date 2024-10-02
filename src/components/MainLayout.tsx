import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { HomeIcon, MapIcon, PlusCircleIcon, InboxStackIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolidIcon, MapIcon as MapSolidIcon, PlusCircleIcon as PlusCircleSolidIcon, InboxStackIcon as InboxStackSolidIcon, UserIcon as UserSolidIcon } from '@heroicons/react/24/solid';

const tabs = [
  { name: 'Home', icon: HomeIcon, solidIcon: HomeSolidIcon, path: '/' },
  { name: 'Map', icon: MapIcon, solidIcon: MapSolidIcon, path: '/map' },
  { name: 'Post', icon: PlusCircleIcon, solidIcon: PlusCircleSolidIcon, path: '/post' },
  { name: 'Inbox', icon: InboxStackIcon, solidIcon: InboxStackSolidIcon, path: '/inbox' },
  { name: 'Profile', icon: UserIcon, solidIcon: UserSolidIcon, path: '/profile' },
];

const MainLayout: React.FC = () => {
  const location = useLocation();

  const isTabActive = (tab: typeof tabs[0]) => {
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from');

    if (tab.path === '/') {
      return (location.pathname === '/' || 
              (location.pathname.startsWith('/view/') && (!from || from === 'home')) ||
              (location.pathname.startsWith('/edit/') && (!from || from === 'home'))) &&
              from !== 'inbox';
    }
    if (tab.path === '/inbox') {
      return location.pathname === '/inbox' || 
             location.pathname === '/resolve' || 
             (location.pathname.startsWith('/view/') && from === 'inbox') ||
             (location.pathname.startsWith('/edit/') && from === 'inbox');
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
      <nav className="bg-white border-t border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 pt-2 pb-3 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.path}
                className={`flex flex-col items-center pt-2 pb-1 w-14 ${
                  isTabActive(tab) ? 'text-blue-600 bg-blue-50 rounded-lg' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isTabActive(tab) ? (
                  <tab.solidIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <tab.icon className="h-6 w-6" aria-hidden="true" />
                )}
                <span className={`mt-1 text-xs ${isTabActive(tab) ? 'font-bold' : ''}`}>{tab.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;