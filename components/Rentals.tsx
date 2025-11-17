import React, { useState, useMemo } from 'react';
import { Rental, Contact, RentalPlan, RentalPlans, MaintenanceOptions, RentalStatuses, MaintenanceOption, RentalStatus, DeliveryPaymentOptions, DeliveryPaymentOption, User } from '../types';
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

const RentalDetailsModal = ({ rental, onClose, contact }: { rental: Rental | null; onClose: () => void; contact: Contact | undefined; }) => {
    if (!rental) return null;
  
    const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode; }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <div className="text-lg font-medium text-brand-text">{value || 'N/A'}</div>
        </div>
    );
    
    const Checkmark = ({ checked }: { checked: boolean }) => (
        <span className={checked ? 'text-green-600' : 'text-red-500'}>
            {checked ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )}
            {checked ? 'Acknowledged' : 'Not Acknowledged'}
        </span>
    );

    const getStatusColor = (status: RentalStatus) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Pending Signature': return 'bg-yellow-100 text-yellow-700';
            case 'Terminated': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
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
                <DetailItem label="Status" value={<span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(rental.status)}`}>{rental.status}</span>} />
                <DetailItem label="Plan" value={rental.plan} />
                <DetailItem label="Monthly Rate" value={`$${rental.monthlyRate.toFixed(2)}`} />
                <DetailItem label="Start Date" value={rental.startDate} />
                <DetailItem label="Maintenance" value={rental.maintenanceOption} />
                <DetailItem label="Delivery Fee" value={rental.deliveryPaymentOption} />
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
             <h4 className="text-xl font-bold mb-4 text-brand-text">Emergency Contact</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Full Name" value={rental.emergencyContactFullName} />
                <DetailItem label="Relationship" value={rental.emergencyContactRelationship} />
                <DetailItem label="Phone" value={rental.emergencyContactPhone} />
                <DetailItem label="Email" value={rental.emergencyContactEmail} />
                <DetailItem label="Address" value={rental.emergencyContactAddress} />
             </div>
          </div>
          
           <div className="bg-gray-50 p-6 rounded-lg">
             <h4 className="text-xl font-bold mb-4 text-brand-text">Terms Acknowledged</h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailItem label="Payment Terms" value={<Checkmark checked={rental.ackPaymentTerms} />} />
                <DetailItem label="Relocation Terms" value={<Checkmark checked={rental.ackRelocationTerms} />} />
                <DetailItem label="Additional Terms" value={<Checkmark checked={rental.ackAdditionalTerms} />} />
             </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-xl font-bold mb-4 text-brand-text">Signature</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <DetailItem label="Renter Printed Name" value={rental.renterPrintedName} />
                 <DetailItem label="Digital Signature" value={<span className="font-mono text-blue-700">{rental.digitalSignature}</span>} />
             </div>
          </div>

          <button onClick={onClose} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark transition-colors mt-4">
            Close
          </button>
        </div>
      </Modal>
    );
  };

const Select = ({ label, name, value, onChange, children, required=false }: { label: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<any>) => void, children?: React.ReactNode, required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
      <select name={name} value={value} onChange={onChange} required={required} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green appearance-none text-brand-text" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
        {children}
      </select>
    </div>
);

const Input = ({ label, type = 'text', name, value, onChange, required=false, placeholder='' }: { label: string, type?: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, required?: boolean, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const Checkbox = ({ label, name, checked, onChange }: { label: React.ReactNode, name: string, checked: boolean, onChange: (e: React.ChangeEvent<any>) => void }) => (
    <div className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center h-5">
            <input 
                id={name}
                name={name}
                type="checkbox" 
                checked={checked}
                onChange={onChange}
                className="focus:ring-brand-green h-4 w-4 text-lime-600 border-gray-300 rounded"
            />
        </div>
        <div className="ml-3 text-sm">
            <label htmlFor={name} className="text-gray-700">{label}</label>
        </div>
    </div>
);

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="border border-gray-200 rounded-lg">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100">
                <h3 className="text-xl font-bold">{title}</h3>
                <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && <div className="p-6 space-y-6">{children}</div>}
        </div>
    );
};

const emptyRentalForm: Omit<Rental, 'id'> = {
    contactId: '',
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
    currentUser: User;
    onCreateRental: (rental: Omit<Rental, 'id'>) => void;
    onUpdateRental: (rental: Rental) => void;
    onDeleteRental: (rentalId: string) => void;
    addToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
    adminKey: string;
}

const Rentals: React.FC<RentalsProps> = ({ rentals, contacts, currentUser, onCreateRental, onUpdateRental, onDeleteRental, addToast, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRental, setEditingRental] = useState<Rental | null>(null);
    const [viewingRental, setViewingRental] = useState<Rental | null>(null);
    const [formData, setFormData] = useState<Omit<Rental, 'id'>>(emptyRentalForm);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [rentalToDelete, setRentalToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);

    const handleOpenModal = (rental: Rental | null) => {
        setEditingRental(rental);
        setFormData(rental || { ...emptyRentalForm, contactId: contacts[0]?.id || '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRental(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const inputValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

        let newFormData: any = { ...formData, [name]: inputValue };

        if (name === 'plan') {
            newFormData.monthlyRate = RentalPlans[value as RentalPlan];
        }
        
        if (name === 'contactId') {
            const selectedContactId = value;
            const selectedContact = contactMap.get(selectedContactId);
            newFormData.contactId = selectedContactId;
            
            if(selectedContact){
                newFormData.rentalPropertyAddress = selectedContact.address;
                newFormData.renterPrintedName = selectedContact.fullName;
                newFormData.digitalSignature = selectedContact.fullName; // Pre-fill signature
            } else {
                newFormData.rentalPropertyAddress = '';
                newFormData.renterPrintedName = '';
                newFormData.digitalSignature = '';
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = () => {
        if (!formData.contactId || !formData.emergencyContactFullName || !formData.renterPrintedName || !formData.digitalSignature) {
            addToast('Error', 'Please fill all required fields in each section.', 'error');
            return;
        }

        if (!formData.ackPaymentTerms || !formData.ackRelocationTerms || !formData.ackAdditionalTerms) {
            addToast('Error', 'Please acknowledge all agreement terms before saving.', 'error');
            return;
        }

        const submissionData = {
            ...formData,
            monthlyRate: RentalPlans[formData.plan as RentalPlan]
        };

        if (editingRental) {
            onUpdateRental({ ...editingRental, ...submissionData });
            addToast('Success', 'Rental agreement updated successfully.', 'success');
        } else {
            onCreateRental(submissionData);
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (rentalId: string) => {
        setRentalToDelete(rentalId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (rentalToDelete) {
            onDeleteRental(rentalToDelete);
            addToast('Success', 'Rental agreement deleted successfully.', 'success');
        }
        setIsConfirmModalOpen(false);
        setRentalToDelete(null);
    };

    const getStatusColor = (status: RentalStatus) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-700';
            case 'Pending Signature': return 'bg-yellow-100 text-yellow-700';
            case 'Terminated': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

  return (
    <div className="p-4 sm:p-8 text-brand-text">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Rentals</h1>
            <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors w-full sm:w-auto">
                Add New Rental
            </button>
        </div>

        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
            {rentals.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {rentals.map(rental => {
                        const contact = contactMap.get(rental.contactId);
                        return (
                            <li key={rental.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-lg">{contact ? contact.fullName : `Contact ID: ${rental.contactId}`}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                        <span>Plan: {rental.plan}</span>
                                        <span>Start: {rental.startDate}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-center">
                                     <p className="font-semibold text-brand-text text-lg">${rental.monthlyRate.toFixed(2)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(rental.status)}`}>{rental.status}</span>
                                    <div className="flex space-x-4 text-gray-500">
                                        <button onClick={() => setViewingRental(rental)} className="hover:text-brand-green">View</button>
                                        <button onClick={() => handleOpenModal(rental)} className="hover:text-brand-green">Edit</button>
                                        {isAdmin && <button onClick={() => handleDeleteRequest(rental.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                 <p className="text-center text-gray-500 py-8">No rentals yet. Add one to get started!</p>
            )}
        </div>

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRental ? 'Edit Rental Agreement' : 'Create Rental Agreement'}>
            <div className="space-y-6">
                <Section title="Parties to Agreement">
                    <Select label="Renter / Contact" name="contactId" value={formData.contactId} onChange={handleInputChange} required>
                        <option value="">-- Select a Contact --</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.address}</option>)}
                    </Select>
                    <Input label="Rental Property Address" name="rentalPropertyAddress" value={formData.rentalPropertyAddress} onChange={handleInputChange} required />
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold">Lessor (Owner):</p>
                        <p className="text-gray-600">Spin City Rentals LLC, an Ohio LLC</p>
                    </div>
                </Section>
                
                <Section title="Rental & Maintenance Plan">
                    <Select label="Rental Plan" name="plan" value={formData.plan} onChange={handleInputChange} required>
                        {Object.keys(RentalPlans).map(plan => <option key={plan} value={plan}>{plan}</option>)}
                    </Select>
                    <Select label="Maintenance Option" name="maintenanceOption" value={formData.maintenanceOption} onChange={handleInputChange} required>
                        {MaintenanceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                     <div className="bg-lime-50 p-4 rounded-lg text-center border border-lime-200">
                        <p className="text-lime-600">Monthly Rate</p>
                        <p className="text-3xl font-bold text-brand-text">${(RentalPlans[formData.plan as RentalPlan] || 0).toFixed(2)}</p>
                    </div>
                </Section>

                <Section title="Emergency Contact Information">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Full Name" name="emergencyContactFullName" value={formData.emergencyContactFullName} onChange={handleInputChange} required />
                        <Input label="Relationship to Renter" name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleInputChange} required />
                        <Input label="Address" name="emergencyContactAddress" value={formData.emergencyContactAddress} onChange={handleInputChange} required />
                        <Input label="Email" type="email" name="emergencyContactEmail" value={formData.emergencyContactEmail} onChange={handleInputChange} required />
                        <Input label="Phone Number" type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} required />
                    </div>
                </Section>

                <Section title="Delivery & Installation">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <p className="font-bold">Delivery & Installation Fee: $55.00</p>
                        <p className="text-sm text-gray-600">This fee covers professional delivery and installation of your washer and dryer set.</p>
                    </div>
                    <Select label="Payment Options" name="deliveryPaymentOption" value={formData.deliveryPaymentOption} onChange={handleInputChange} required>
                        {DeliveryPaymentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </Select>
                </Section>
                
                <Section title="Agreement Terms Acknowledgment">
                    <p className="text-sm text-gray-600">Please read and acknowledge the following terms:</p>
                    <div className="space-y-4">
                        <Checkbox 
                            name="ackPaymentTerms"
                            checked={formData.ackPaymentTerms}
                            onChange={handleInputChange}
                            label={<>I understand and agree to the <strong>payment terms</strong>: Monthly rental payment is due on the 1st of each month with a 5-day grace period. A $25 late fee will be applied if payment is not received by the 6th day of the month. If I miss 2 consecutive payments, Spin City Rentals will remove the appliances at my expense.</>}
                        />
                        <Checkbox 
                            name="ackRelocationTerms"
                            checked={formData.ackRelocationTerms}
                            onChange={handleInputChange}
                            label={<>I understand and agree to the <strong>relocation terms</strong>: If I need to relocate the appliances to a new address during my lease period, I am responsible for all relocation, delivery, and installation fees. I must provide at least 7 days notice for any relocation requests and all relocations must be performed by Spin City Rentals technicians.</>}
                        />
                        <Checkbox 
                            name="ackAdditionalTerms"
                            checked={formData.ackAdditionalTerms}
                            onChange={handleInputChange}
                            label={<>I understand and agree to the <strong>additional terms</strong>: This is a month-to-month rental agreement. Either party may terminate this agreement with 30 days written notice. I am responsible for proper use and care of the appliances and must provide access for maintenance and repairs with 24 hours notice. Ohio sales tax (7.5%) is included in all quoted prices.</>}
                        />
                    </div>
                </Section>

                <Section title="Agreement & Signatures">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Start Date" name="startDate" type="date" value={formData.startDate} onChange={handleInputChange} required/>
                        <Select label="Status" name="status" value={formData.status} onChange={handleInputChange} required>
                            {RentalStatuses.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Input label="Renter Printed Name" name="renterPrintedName" value={formData.renterPrintedName} onChange={handleInputChange} required />
                        <Input label="Digital Signature" name="digitalSignature" value={formData.digitalSignature} onChange={handleInputChange} placeholder="Type your full name" required />
                    </div>
                </Section>
                
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 pt-4 border-t mt-6 gap-2">
                    <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleSubmit} className="w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark">{editingRental ? 'Update Rental' : 'Save Rental'}</button>
                </div>
            </div>
        </Modal>

        <RentalDetailsModal 
            rental={viewingRental} 
            onClose={() => setViewingRental(null)} 
            contact={viewingRental ? contactMap.get(viewingRental.contactId) : undefined} 
        />

        <AdminKeyConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Rental Agreement"
            message="Are you sure you want to permanently delete this rental agreement?"
            adminKey={adminKey}
            addToast={addToast}
        />
    </div>
  );
};

export default Rentals;