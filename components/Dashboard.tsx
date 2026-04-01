
// Added React import to fix "Cannot find namespace 'React'" errors.
import React from 'react';
import { Contact, Rental, Repair, User, SiteContact, SiteRental, SiteRepair, InventoryItem } from '../types';
// Added icon imports to fix "Cannot find name" errors.
import { ContactsIcon, RentalsIcon, RepairsIcon, UsersIcon } from './Icons';

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-2xl flex items-center space-x-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl ${color} shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-brand-text">{value}</p>
    </div>
  </div>
);

interface DashboardProps {
    contacts: Contact[];
    rentals: Rental[];
    repairs: Repair[];
    // Fix: Added inventory to props to avoid "Cannot find name 'inventory'" error
    inventory: InventoryItem[];
    users: User[];
    currentUser: User;
    siteContacts: SiteContact[];
    siteRentals: SiteRental[];
    siteRepairs: SiteRepair[];
}

// Fix: Destructured inventory from props
const Dashboard: React.FC<DashboardProps> = ({ contacts, rentals, repairs, inventory, users, currentUser, siteContacts, siteRentals, siteRepairs }) => {
  const activeRentals = rentals.filter(r => r.status === 'Active').length;
  const openRepairs = repairs.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  
  const pendingSiteSubmissions = [
      ...siteContacts.filter(s => s.status !== 'completed'),
      ...siteRentals.filter(s => s.status !== 'completed'),
      ...siteRepairs.filter(s => s.status !== 'completed'),
  ];

  return (
    <div className="p-6 sm:p-10 text-brand-text">
       <div className="mb-10">
        <h1 className="text-4xl font-black text-brand-text tracking-tight">SpinCity HQ</h1>
        <p className="text-gray-500 mt-2 font-medium">System status for {currentUser.name} as of today.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        <StatCard icon={<ContactsIcon className="w-8 h-8 text-white"/>} title="Total Clients" value={contacts.length} color="bg-brand-green"/>
        <StatCard icon={<RentalsIcon className="w-8 h-8 text-white"/>} title="Active Units" value={activeRentals} color="bg-blue-600"/>
        <StatCard icon={<RepairsIcon className="w-8 h-8 text-white"/>} title="Service Calls" value={openRepairs} color="bg-orange-500"/>
        <StatCard icon={<UsersIcon className="w-8 h-8 text-white"/>} title="Site Tasks" value={pendingSiteSubmissions.length} color="bg-red-600"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                    Immediate Site Actions
                </h2>
                <span className="text-xs font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500">REAL-TIME FEED</span>
              </div>
              {pendingSiteSubmissions.length > 0 ? (
                  <ul className="space-y-4">
                      {pendingSiteSubmissions.slice(0, 6).map((item, idx) => (
                          <li key={idx} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                              <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${item.type === 'repair' ? 'bg-orange-100 text-orange-600' : item.type === 'rental' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'}`}>
                                     {item.type === 'repair' ? '🔧' : item.type === 'rental' ? '📄' : '✉️'}
                                  </div>
                                  <div>
                                      <p className="font-bold text-brand-text capitalize text-sm">{item.type}: {(item as any).name || (item as any).renter_name || (item as any).customerName}</p>
                                      <p className="text-xs text-gray-400">Received {(item as any).timestamp || (item as any).submissionDate}</p>
                                  </div>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-tighter text-white bg-red-500 px-2 py-1 rounded-md">Urgent</span>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <div className="text-center py-16">
                      <div className="text-4xl mb-4">🎉</div>
                      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">System Clear - No Pending Actions</p>
                  </div>
              )}
          </div>

          <div className="space-y-8">
              <div className="bg-brand-green p-8 rounded-3xl shadow-lg text-white">
                  <h3 className="text-lg font-black uppercase tracking-widest mb-4">Operations</h3>
                  <div className="space-y-6">
                      <div>
                          <p className="text-lime-200 text-xs font-bold uppercase tracking-tighter mb-1">Fleet Occupancy</p>
                          <div className="w-full bg-lime-900 rounded-full h-3">
                              <div className="bg-white h-3 rounded-full shadow-inner" style={{width: `${(activeRentals / (inventory.length || 1)) * 100}%`}}></div>
                          </div>
                          <p className="text-right text-xs mt-2 font-bold">{Math.round((activeRentals / (inventory.length || 1)) * 100)}% Utilization</p>
                      </div>
                      <div className="pt-4 border-t border-lime-500">
                          <p className="text-xs font-bold uppercase mb-2">New Acquisitions</p>
                          <p className="text-3xl font-black">{contacts.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}</p>
                          <p className="text-xs font-medium opacity-80">Clients added this month</p>
                      </div>
                  </div>
              </div>
              
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">System Help</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                      Need a business summary? Use the <strong>AI Assistant</strong> in the sidebar to query your data using natural language.
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;