import React from 'react';
import { ContactsIcon, RentalsIcon, RepairsIcon, UsersIcon } from './Icons';
import { Contact, Rental, Repair, User } from '../types';

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-xl flex items-center space-x-4 shadow-sm border border-gray-200">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-brand-text">{value}</p>
    </div>
  </div>
);

interface DashboardProps {
    contacts: Contact[];
    rentals: Rental[];
    repairs: Repair[];
    users: User[];
    currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ contacts, rentals, repairs, users, currentUser }) => {
  const activeRentals = rentals.filter(r => r.status === 'Active').length;
  const openRepairs = repairs.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  
  return (
    <div className="p-8 text-brand-text">
       <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {currentUser.name}!</h1>
        <p className="text-gray-500 mt-1">Here's a snapshot of your business activities.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<ContactsIcon className="w-6 h-6 text-white"/>} title="Total Clients" value={contacts.length} color="bg-brand-green"/>
        <StatCard icon={<RentalsIcon className="w-6 h-6 text-white"/>} title="Active Rentals" value={activeRentals} color="bg-blue-500"/>
        <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="Open Repairs" value={openRepairs} color="bg-yellow-500"/>
        <StatCard icon={<UsersIcon className="w-6 h-6 text-white"/>} title="System Users" value={users.length} color="bg-purple-500"/>
      </div>

      <div className="bg-lime-50 text-lime-800 p-6 rounded-xl border border-lime-200 shadow-sm mt-8">
        <h2 className="text-2xl font-bold mb-2 text-brand-text">Quick Tips</h2>
        <p className="text-lime-700">
            Use the sidebar to manage clients, track rentals, and log repairs. Admins can access advanced settings and user management through the sidebar as well.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;