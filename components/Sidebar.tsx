import React from 'react';
import { AppView, User } from '../types';
import { DashboardIcon, ContactsIcon, RentalsIcon, RepairsIcon, UsersIcon, SettingsIcon, LogoutIcon, NotificationsIcon, ReportsIcon, InventoryIcon, SalesLogIcon, VendorsIcon, MonitorIcon, HtmlViewerIcon } from './Icons';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onLogout: () => void;
  appLogo: string | null;
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout, appLogo, currentUser }) => {
  const isAdmin = currentUser.role === 'Admin';

  // Splitting nav items into main and footer sections for better layout control.
  const mainNavItems = [
    { view: AppView.Dashboard, icon: DashboardIcon, label: 'Dashboard', adminOnly: false },
    { view: AppView.Inventory, icon: InventoryIcon, label: 'Inventory', adminOnly: false },
    { view: AppView.Contacts, icon: ContactsIcon, label: 'Clients', adminOnly: false },
    { view: AppView.Rentals, icon: RentalsIcon, label: 'Rentals', adminOnly: false },
    { view: AppView.SalesLog, icon: SalesLogIcon, label: 'Sales Log', adminOnly: false },
    { view: AppView.Repairs, icon: RepairsIcon, label: 'Repairs', adminOnly: false },
    { view: AppView.Vendors, icon: VendorsIcon, label: 'Vendors', adminOnly: false },
    { view: AppView.MonitorSite, icon: MonitorIcon, label: 'Monitor Site', adminOnly: true },
    { view: AppView.HtmlViewer, icon: HtmlViewerIcon, label: 'HTML Viewer', adminOnly: true },
    { view: AppView.Reports, icon: ReportsIcon, label: 'Reports', adminOnly: true },
    { view: AppView.Notifications, icon: NotificationsIcon, label: 'Notifications', adminOnly: true },
    { view: AppView.Users, icon: UsersIcon, label: 'Users', adminOnly: true },
  ];

  // Settings is moved to the footer to keep it always visible.
  const footerNavItems = [
    { view: AppView.Settings, icon: SettingsIcon, label: 'Settings', adminOnly: true },
  ];

  const visibleMainNavItems = mainNavItems.filter(item => !item.adminOnly || isAdmin);
  const visibleFooterNavItems = footerNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 bg-brand-light text-brand-text flex flex-col border-r border-gray-200">
      {/* Header (fixed top) */}
      <div className="p-6 flex items-center space-x-3 flex-shrink-0">
        <div className="bg-brand-green p-2 rounded-lg flex justify-center items-center w-12 h-12">
          {appLogo ? (
            <img src={appLogo} alt="App Logo" className="w-8 h-8 object-contain" />
          ) : (
            <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m3 1v5.25m-3-5.25v5.25m-3-5.25l3 1m-3-1l-3 1m0 0v5.25m0 0l3 1m-3-1l-3-1" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold">SpinCity Rentals CMS</h1>
      </div>

      {/* Main Navigation (scrollable) */}
      <nav className="flex-1 px-4 py-2 min-h-0 overflow-y-auto">
        <ul>
          {visibleMainNavItems.map((item) => (
            <li key={item.view}>
              <button
                onClick={() => setCurrentView(item.view)}
                className={`w-full flex items-center space-x-3 p-3 my-1 rounded-lg transition-colors duration-200 font-medium ${
                  currentView === item.view
                    ? 'bg-lime-100 text-lime-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer (fixed bottom) */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <ul className="space-y-1">
            {visibleFooterNavItems.map((item) => (
                <li key={item.view}>
                <button
                    onClick={() => setCurrentView(item.view)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 font-medium ${
                    currentView === item.view
                        ? 'bg-lime-100 text-lime-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                </button>
                </li>
            ))}
          <li>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 font-medium text-gray-600 hover:bg-gray-100"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
