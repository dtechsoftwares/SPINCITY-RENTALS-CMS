import React, { useState, useEffect } from 'react';
import { Contact, ContactPlans, HookupTypes, User } from '../types';
import { CloseIcon } from './Icons';
import { getTodayDateString } from '../utils/dates';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-brand-text w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ContactDetailsModal = ({ contact, onClose }: { contact: Contact | null; onClose: () => void; }) => {
    if (!contact) return null;
  
    const DetailItem = ({ label, value }: { label: string; value?: string; }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-medium text-brand-text">{value || 'N/A'}</p>
        </div>
    );

    return (
      <Modal isOpen={!!contact} onClose={onClose} title="Client Details">
        <div className="space-y-6 p-4">
          <div className="text-center pb-4 border-b border-gray-200">
            <h3 className="text-3xl font-bold text-brand-text">{contact.fullName}</h3>
            <p className="text-gray-500 text-lg">{contact.email}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
            <DetailItem label="Phone Number" value={contact.phone} />
            <DetailItem label="Installation Address" value={contact.address} />
            <DetailItem label="Interested Plan" value={contact.plan} />
            <DetailItem label="Hook-up Type" value={contact.hookupType} />
          </div>
           {contact.notes && (
               <div className="space-y-2">
                   <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                   <p className="text-brand-text bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">{contact.notes}</p>
               </div>
           )}
          <button
            onClick={onClose}
            className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark transition-colors mt-4"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  };

const Input = ({ label, type = 'text', placeholder, name, value, onChange }: { label: string, type?: string, placeholder?: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
    <input 
      type={type} 
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text"
    />
  </div>
);

const Select = ({ label, name, value, onChange, children }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, children?: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <select 
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green appearance-none text-brand-text"
        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
        {children}
      </select>
    </div>
);


const Textarea = ({ label, name, value, onChange, placeholder }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <textarea 
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text"
        />
    </div>
);

const emptyContactForm: Omit<Contact, 'id'> = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    plan: 'Not sure, need advice',
    hookupType: 'Not sure',
    notes: '',
    createdAt: getTodayDateString(),
};

interface ContactsProps {
    contacts: Contact[];
    currentUser: User;
    onCreateContact: (contact: Omit<Contact, 'id'>) => void;
    onUpdateContact: (contact: Contact) => void;
    onDeleteContact: (contactId: string) => void;
    showNotification: (message: string) => void;
    adminKey: string;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, currentUser, onCreateContact, onUpdateContact, onDeleteContact, showNotification, adminKey }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Omit<Contact, 'id'>>(emptyContactForm);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const isAdmin = currentUser.role === 'Admin';

  useEffect(() => {
    if (editingContact) {
        setFormData(editingContact);
    } else {
        setFormData(emptyContactForm);
    }
  }, [editingContact]);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData(emptyContactForm);
    setIsFormModalOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingContact(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email) {
        alert('Full Name and Email are required.');
        return;
    }

    if (editingContact) {
        onUpdateContact({ ...editingContact, ...formData });
        showNotification('Client updated successfully.');
    } else {
        onCreateContact(formData);
        showNotification('Client created successfully.');
    }
    closeFormModal();
  };

  const handleDeleteRequest = (contactId: string) => {
    setContactToDelete(contactId);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (contactToDelete) {
        onDeleteContact(contactToDelete);
        showNotification('Client deleted successfully.');
    }
    setIsConfirmModalOpen(false);
    setContactToDelete(null);
  };

  return (
    <div className="p-8 text-brand-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <button onClick={openAddModal} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">
          Add New Client
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        {contacts.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {contacts.map(contact => (
              <li key={contact.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{contact.fullName}</p>
                  <p className="text-sm text-gray-500">{contact.email}</p>
                </div>
                 <div className="flex space-x-4 text-gray-500">
                    <button onClick={() => setViewingContact(contact)} className="hover:text-brand-green">View</button>
                    <button onClick={() => openEditModal(contact)} className="hover:text-brand-green">Edit</button>
                    {isAdmin && <button onClick={() => handleDeleteRequest(contact.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">No clients yet. Add one to get started!</p>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editingContact ? 'Edit Client' : 'Add New Client'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name *" name="fullName" value={formData.fullName} onChange={handleInputChange} />
            <Input label="Email Address *" type="email" name="email" value={formData.email} onChange={handleInputChange} />
            <Input label="Phone Number *" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
            <Input label="Installation Address *" name="address" value={formData.address} onChange={handleInputChange} />
            <Select label="Interested Plan *" name="plan" value={formData.plan} onChange={handleInputChange}>
                {ContactPlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
            </Select>
            <Select label="Hook-up Type *" name="hookupType" value={formData.hookupType} onChange={handleInputChange}>
                {HookupTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
          </div>
          <div className="mt-6">
              <Textarea label="Additional Notes or Questions" name="notes" value={formData.notes ?? ''} onChange={handleInputChange} />
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button onClick={closeFormModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                Cancel
            </button>
            <button onClick={handleSubmit} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark transition-colors">
                {editingContact ? 'Update Client' : 'Save Client'}
            </button>
          </div>
      </Modal>

      <ContactDetailsModal contact={viewingContact} onClose={() => setViewingContact(null)} />
      
      <AdminKeyConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to permanently delete this client? All associated data will be removed.`}
        adminKey={adminKey}
        showNotification={showNotification}
      />
    </div>
  );
};

export default Contacts;
