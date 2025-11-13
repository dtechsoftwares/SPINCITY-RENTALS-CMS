import React from 'react';
import { Contact, SmsSettings } from '../types';

interface NotificationsProps {
    contacts: Contact[];
    smsSettings: SmsSettings;
    handleAction: (action: () => void) => void;
    showNotification: (message: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ contacts, smsSettings, handleAction, showNotification }) => {
  const isConfigured = smsSettings.accountSid && smsSettings.authToken && smsSettings.twilioPhoneNumber;
  return (
    <div className="p-8 text-brand-text">
      <h1 className="text-3xl font-bold mb-8">Notifications</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="text-center">
              <p className="text-gray-500">Bulk SMS notification feature is coming soon.</p>
              <p className="text-gray-400 text-sm mt-2">This section will allow admins to send bulk SMS messages to all clients using your configured Twilio account.</p>
          </div>
          
          <div className={`p-4 rounded-lg border ${isConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className="font-bold text-lg">{isConfigured ? 'Twilio is Configured' : 'Twilio is Not Configured'}</h3>
              <p className="text-sm text-gray-600">
                  {isConfigured 
                      ? `Messages will be sent from ${smsSettings.twilioPhoneNumber}.`
                      : 'Please configure your Twilio Account SID, Auth Token, and Phone Number in the Settings page to enable this feature.'}
              </p>
          </div>
      </div>
    </div>
  );
};

export default Notifications;