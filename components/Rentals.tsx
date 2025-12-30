
import React, { useState, useMemo } from 'react';
import { Rental, Contact, RentalPlan, RentalPlans, MaintenanceOptions, RentalStatuses, MaintenanceOption, RentalStatus, DeliveryPaymentOptions, DeliveryPaymentOption, User, InventoryItem } from '../types';
import { CloseIcon } from './Icons';
import { getTodayDateString } from '../utils/dates';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white text-brand-text w-full max-w-md md:max-w-3xl rounded-xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const RentalDetailsModal = ({ rental, onClose, contact, inventoryItem }: { rental: Rental | null; onClose: () => void; contact: Contact | undefined; inventoryItem: InventoryItem | undefined }) => {
    if (!rental) return null;
  
    const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode; }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <div className="text-lg font-medium text-brand-text">{value || 'N/A'}</div>
        </div>
    );
    
    return (
      <Modal isOpen={!!rental} onClose={onClose} title="Rental Agreement Details">
        <div className="space-y-6 p-4">
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-3xl font-bold text-brand-text">{contact?.fullName || 'Unknown Contact'}</h3>
            <p className="text-gray-500 text-lg">{rental.rentalPropertyAddress}</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-xl font-bold mb-4 text-brand-text">Rental Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <DetailItem label="Status" value={rental.status} />
                <DetailItem label="Assigned Machine" value={inventoryItem ? `${inventoryItem.makeModel} (${inventoryItem.serialNumber})` : <span className="text-red-500 italic">No machine assigned</span>} />
                <DetailItem label="Plan" value={rental.plan} />
                <DetailItem label="Monthly Rate" value={`$${rental.monthlyRate.toFixed(2)}`} />
                <DetailItem label="Start Date" value={rental.startDate} />
                <DetailItem label="Maintenance" value={rental.maintenanceOption} />
            </div>
          </div>
          <button onClick={onClose} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark transition-colors">Close</button>
        </div>
      </Modal>
    );
  };

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border border-gray-200 rounded-lg mb-4">
        <div className="p-4 bg-gray-50 font-bold border-b border-gray-200">{title}</div>
        <div className="p-6 space-y-6">{children}</div>
    </div>
);

const emptyRentalForm: Omit<Rental, 'id'> = {
    contactId: '',
    inventoryItemId: '',
    plan: '12-Month Smart Plan',
    maintenanceOption: 'Maintenance Plan',
    status: 'Pending Signature',
    startDate: getTodayDateString(),
    monthlyRate: RentalPlans['12-Month Smart Plan'],
    rentalPropertyAddress: '',
    emergencyContactFullName: '',
    emergencyContactRelationship: '',
    emergencyContactAddress: '',
    emergencyContactEmail: '',
    emergencyContactPhone: '',
    deliveryPaymentOption: 'Pay the full $55 delivery and installation fee at time of installation',
    ackPaymentTerms: false,
    ackRelocationTerms: false,
    ackAdditionalTerms: false,
    renterPrintedName: '',
    digitalSignature: '',
};

interface RentalsProps {
    rentals: Rental[];
    contacts: Contact[];
    inventory: InventoryItem[];
    currentUser: User;
    onCreateRental: (rental: Omit<Rental, 'id'>) => void;
    onUpdateRental: (rental: Rental) => void;
    onDeleteRental: (rentalId: string) => void;
    addToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
    adminKey: string;
}

const Rentals: React.FC<RentalsProps> = ({ rentals, contacts, inventory, currentUser, onCreateRental, onUpdateRental, onDeleteRental, addToast, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRental, setEditingRental] = useState<Rental | null>(null);
    const [viewingRental, setViewingRental] = useState<Rental | null>(null);
    const [formData, setFormData] = useState<Omit<Rental, 'id'>>(emptyRentalForm);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [rentalToDelete, setRentalToDelete] = useState<string | null>(null);

    const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);
    const inventoryMap = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);
    const availableMachines = useMemo(() => inventory.filter(i => i.status === 'Available' || (editingRental && i.id === editingRental.inventoryItemId)), [inventory, editingRental]);

    const handleOpenModal = (rental: Rental | null) => {
        setEditingRental(rental);
        setFormData(rental || { ...emptyRentalForm, contactId: contacts[0]?.id || '' });
        setIsModalOpen(true);
    };

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = () => {
        if (!formData.contactId || !formData.ackPaymentTerms || !formData.ackRelocationTerms || !formData.ackAdditionalTerms) {
            addToast('Error', 'Please fill all required fields and acknowledge terms.', 'error');
            return;
        }
        if (editingRental) onUpdateRental({ ...editingRental, ...formData });
        else onCreateRental(formData);
        setIsModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Rentals</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark w-full sm:w-auto">Add New Rental</button>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
                {rentals.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {rentals.map(rental => (
                            <li key={rental.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-lg">{contactMap.get(rental.contactId)?.fullName || 'Unknown'}</p>
                                    <p className="text-sm text-gray-500">{inventoryMap.get(rental.inventoryItemId || '')?.makeModel || 'No Machine Assigned'}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 text-xs rounded-full font-bold ${rental.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{rental.status}</span>
                                    <button onClick={() => setViewingRental(rental)} className="text-brand-green hover:underline">View</button>
                                    <button onClick={() => handleOpenModal(rental)} className="text-brand-green hover:underline">Edit</button>
                                    {currentUser.role === 'Admin' && <button onClick={() => { setRentalToDelete(rental.id); setIsConfirmModalOpen(true); }} className="text-red-500 hover:underline">Delete</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-gray-500 py-8">No rentals found.</p>}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRental ? 'Edit Rental' : 'Create Rental'}>
                <div className="space-y-4">
                    <Section title="Asset Assignment">
                        <div>
                            <label className="block text-sm font-medium mb-1">Select Available machine</label>
                            <select name="inventoryItemId" value={formData.inventoryItemId} onChange={handleInputChange} className="w-full bg-gray-100 border p-2 rounded-lg">
                                <option value="">-- No Machine (Pending Assignment) --</option>
                                {availableMachines.map(m => <option key={m.id} value={m.id}>{m.purchaseId} - {m.makeModel} ({m.serialNumber})</option>)}
                            </select>
                        </div>
                    </Section>
                    <Section title="Client & Address">
                        <select name="contactId" value={formData.contactId} onChange={handleInputChange} className="w-full bg-gray-100 border p-2 rounded-lg">
                             <option value="">-- Select Client --</option>
                             {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                        </select>
                        <input name="rentalPropertyAddress" placeholder="Installation Address" value={formData.rentalPropertyAddress} onChange={handleInputChange} className="w-full bg-gray-100 border p-2 rounded-lg mt-2" />
                    </Section>
                    <Section title="Terms Acknowledgment">
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" name="ackPaymentTerms" checked={formData.ackPaymentTerms} onChange={handleInputChange} />
                            <span>Payment Terms Acknowledged</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" name="ackRelocationTerms" checked={formData.ackRelocationTerms} onChange={handleInputChange} />
                            <span>Relocation Terms Acknowledged</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" name="ackAdditionalTerms" checked={formData.ackAdditionalTerms} onChange={handleInputChange} />
                            <span>General Terms Acknowledged</span>
                        </label>
                    </Section>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                        <button onClick={handleSubmit} className="bg-brand-green text-white px-6 py-2 rounded-lg font-bold">Save Agreement</button>
                    </div>
                </div>
            </Modal>
            
            <RentalDetailsModal rental={viewingRental} onClose={() => setViewingRental(null)} contact={viewingRental ? contactMap.get(viewingRental.contactId) : undefined} inventoryItem={viewingRental ? inventoryMap.get(viewingRental.inventoryItemId || '') : undefined} />

            <AdminKeyConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={() => { if(rentalToDelete) onDeleteRental(rentalToDelete); setIsConfirmModalOpen(false); }} title="Delete Rental" message="Are you sure you want to delete this rental? Linked machines will be set back to Available." adminKey={adminKey} addToast={addToast} />
        </div>
    );
};

export default Rentals;
