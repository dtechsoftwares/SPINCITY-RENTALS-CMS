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
}

const Dashboard: React.FC<DashboardProps> = ({ contacts, rentals, repairs, users }) => {
  const activeRentals = rentals.filter(r => r.status === 'Active').length;
  const openRepairs = repairs.filter(r => r.status === 'Open' || r.status === 'In Progress').length;
  
  return (
    <div className="p-8 text-brand-text">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<ContactsIcon className="w-6 h-6 text-white"/>} title="Total Clients" value={contacts.length} color="bg-brand-green"/>
        <StatCard icon={<RentalsIcon className="w-6 h-6 text-white"/>} title="Active Rentals" value={activeRentals} color="bg-blue-500"/>
        <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="Open Repairs" value={openRepairs} color="bg-yellow-500"/>
        <StatCard icon={<UsersIcon className="w-6 h-6 text-white"/>} title="System Users" value={users.length} color="bg-purple-500"/>
      </div>

      <div className="bg-lime-50 text-lime-800 p-6 rounded-xl border border-lime-200 shadow-sm">
        <h2 className="text-2xl font-bold mb-2 text-brand-text">Welcome to SpinCity Rentals CRM</h2>
        <p className="text-lime-700">
          This dashboard provides a high-level overview of your property management activities. Use the sidebar to navigate to specific sections for detailed information and actions. You can add new clients, rentals, and more. Our integrated AI will provide helpful summaries and feedback to streamline your workflow.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
