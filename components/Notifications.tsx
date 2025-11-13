import React from 'react';
import { Contact, SmsSettings } from '../types';

interface NotificationsProps {
    contacts: Contact[];
    smsSettings: SmsSettings;
    handleAction: (action: () => void) => void;
    showNotification: (message: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ contacts, smsSettings, handleAction, showNotification }) => {
  return (
    <div className="p-8 text-brand-text">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-200">
        <p className="text-gray-500">Bulk SMS notification feature is coming soon.</p>
        <p className="text-gray-400 text-sm mt-2">This section will allow admins to send bulk SMS messages to all clients.</p>
      </div>
    </div>
  );
};

export default Notifications;