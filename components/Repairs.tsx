import React, { useState, useMemo } from 'react';
import { Repair, Contact, Appliances, UrgencyLevels, RepairStatuses, UrgencyLevel, RepairStatus, IssueTypes, PreferredTimesOfDay, User } from '../types';
import { CloseIcon, PaperclipIcon } from './Icons';
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

const Section: React.FC<{ title: string, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
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


const getStatusColor = (status: RepairStatus) => ({
    'Open': 'bg-red-100 text-red-700',
    'In Progress': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700',
    'Cancelled': 'bg-gray-100 text-gray-700',
}[status]);

const RepairDetailsModal = ({ repair, onClose, contact }: { repair: Repair | null; onClose: () => void; contact: Contact | undefined; }) => {
    if (!repair) return null;
  
    const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode; }) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <div className="text-lg font-medium text-brand-text">{value || 'N/A'}</div>
        </div>
    );
    
    const TextBlock = ({label, value}: {label:string, value?: string}) => (
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-brand-text bg-gray-100 p-4 mt-1 rounded-lg whitespace-pre-wrap">{value || 'N/A'}</p>
        </div>
    );

    return (
      <Modal isOpen={!!repair} onClose={onClose} title="Repair Request Details">
        <div className="space-y-6 p-4">
          <div className="pb-4 border-b border-gray-200">
            <h3 className="text-3xl font-bold text-brand-text">{contact?.fullName}</h3>
            <p className="text-gray-500 text-lg">{repair.serviceAddress}, {repair.city}, {repair.zipCode}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-lg">
            <DetailItem label="Status" value={<span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(repair.status)}`}>{repair.status}</span>} />
            <DetailItem label="Urgency" value={repair.urgency} />
            <DetailItem label="Reported Date" value={repair.reportedDate} />
            <DetailItem label="Preferred Date" value={repair.preferredServiceDate} />
            <DetailItem label="Preferred Time" value={repair.preferredTimeOfDay} />
            <DetailItem label="Account #" value={repair.accountNumber} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem label="Appliance" value={repair.appliance} />
            <DetailItem label="Issue Type" value={repair.issueType} />
          </div>

           <TextBlock label="Issue Description" value={repair.issueDescription} />
           <TextBlock label="Error Codes" value={repair.errorCodes} />
           <TextBlock label="Additional Info" value={repair.additionalInfo} />
           <TextBlock label="Special Access Instructions" value={repair.accessInstructions} />

           {repair.imageUrls && repair.imageUrls.length > 0 && (
               <div className="space-y-2">
                   <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Attached Images</p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                       {repair.imageUrls.map((url, index) => (
                           <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                             <img src={url} alt={`Repair attachment ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                           </a>
                       ))}
                   </div>
               </div>
           )}
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

const Textarea = ({ label, name, value, onChange, placeholder, required=false }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, placeholder?: string, required?: boolean }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={4} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const emptyRepairForm: Omit<Repair, 'id'> = {
    contactId: '',
    appliance: 'Washing Machine',
    issueDescription: '',
    status: 'Open',
    reportedDate: getTodayDateString(),
    accountNumber: '',
    serviceAddress: '',
    city: '',
    zipCode: '',
    issueType: 'Not starting',
    errorCodes: '',
    urgency: 'Low',
    preferredServiceDate: '',
    preferredTimeOfDay: 'Any time',
    imageUrls: [],
    additionalInfo: '',
    accessInstructions: '',
};

interface RepairsProps {
    repairs: Repair[];
    contacts: Contact[];
    currentUser: User;
    onCreateRepair: (repair: Omit<Repair, 'id'>) => void;
    onUpdateRepair: (repair: Repair) => void;
    onDeleteRepair: (repairId: string) => void;
    addToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
    adminKey: string;
}

const Repairs: React.FC<RepairsProps> = ({ repairs, contacts, currentUser, onCreateRepair, onUpdateRepair, onDeleteRepair, addToast, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
    const [viewingRepair, setViewingRepair] = useState<Repair | null>(null);
    const [formData, setFormData] = useState<Omit<Repair, 'id'>>(emptyRepairForm);
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [repairToDelete, setRepairToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    const contactMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);

    const handleOpenModal = (repair: Repair | null) => {
        setEditingRepair(repair);
        const initialContactId = repair?.contactId || contacts[0]?.id || '';
        let initialFormData = repair ? { ...repair, imageUrls: repair.imageUrls || [] } : { ...emptyRepairForm, contactId: initialContactId };

        if (!repair && initialContactId) {
            const contact = contactMap.get(initialContactId);
            if (contact) {
                const addressParts = contact.address.split(',').map(s => s.trim());
                initialFormData.serviceAddress = addressParts[0] || contact.address;
                initialFormData.city = addressParts[1] || '';
                initialFormData.zipCode = addressParts[2] || '';
            }
        }
        
        setFormData(initialFormData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let newFormData:any = { ...formData, [name]: value };

        if (name === 'contactId') {
            const selectedContact = contactMap.get(value);
            if (selectedContact) {
                const addressParts = selectedContact.address.split(',').map(s => s.trim());
                newFormData.serviceAddress = addressParts[0] || selectedContact.address;
                newFormData.city = addressParts[1] || '';
                newFormData.zipCode = addressParts[2] || '';
            } else {
                newFormData.serviceAddress = '';
                newFormData.city = '';
                newFormData.zipCode = '';
            }
        }

        setFormData(newFormData);
    };
    
    const processFiles = (files: FileList) => {
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({
                        ...prev,
                        imageUrls: [...(prev.imageUrls || []), reader.result as string]
                    }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(e.target.files);
        }
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            imageUrls: (prev.imageUrls || []).filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = () => {
        if (!formData.contactId || !formData.issueDescription || !formData.serviceAddress) {
            addToast('Error', 'Please select a contact, provide a service address, and describe the issue.', 'error');
            return;
        }

        const submissionData = {
            ...formData,
        };

        if (editingRepair) {
            onUpdateRepair({ ...editingRepair, ...submissionData });
            addToast('Success', 'Repair request updated successfully.', 'success');
        } else {
            onCreateRepair(submissionData);
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (repairId: string) => {
        setRepairToDelete(repairId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (repairToDelete) {
            onDeleteRepair(repairToDelete);
            addToast('Success', 'Repair request deleted successfully.', 'success');
        }
        setIsConfirmModalOpen(false);
        setRepairToDelete(null);
    };

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Repairs</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors w-full sm:w-auto">
                    Add Repair Request
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
                {repairs.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {repairs.map(repair => (
                             <li key={repair.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-lg">{contactMap.get(repair.contactId)?.fullName || `Contact ID: ${repair.contactId}`}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                        <span>{repair.appliance}</span>
                                        <span>Reported: {repair.reportedDate}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-center">
                                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(repair.status)}`}>{repair.status}</span>
                                     <div className="flex space-x-4 text-gray-500">
                                        <button onClick={() => setViewingRepair(repair)} className="hover:text-brand-green">View</button>
                                        <button onClick={() => handleOpenModal(repair)} className="hover:text-brand-green">Edit</button>
                                        {isAdmin && <button onClick={() => handleDeleteRequest(repair.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">No repair requests yet. Add one to get started!</p>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingRepair ? 'Edit Repair Request' : 'Create Repair Request'}>
                <div className="space-y-6">
                    <Section title="Your Information">
                        <Select label="Customer / Contact" name="contactId" value={formData.contactId} onChange={handleInputChange} required>
                            <option value="">-- Select a Contact --</option>
                            {contacts.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.address}</option>)}
                        </Select>
                        <Input label="Account Number (if known)" name="accountNumber" value={formData.accountNumber || ''} onChange={handleInputChange} />
                    </Section>

                    <Section title="Service Location">
                        <Input label="Service Address" name="serviceAddress" value={formData.serviceAddress} onChange={handleInputChange} required />
                        <div className="grid grid-cols-2 gap-6">
                            <Input label="City" name="city" value={formData.city} onChange={handleInputChange} required />
                            <Input label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                        </div>
                    </Section>

                    <Section title="Issue Description">
                        <Select label="Which appliance needs service?" name="appliance" value={formData.appliance} onChange={handleInputChange}>
                            {Appliances.map(a => <option key={a} value={a}>{a}</option>)}
                        </Select>
                        <Select label="What type of issue are you experiencing?" name="issueType" value={formData.issueType} onChange={handleInputChange}>
                            {IssueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                        <Textarea label="Please describe the issue in detail" name="issueDescription" value={formData.issueDescription} onChange={handleInputChange} required placeholder="Please provide as much detail as possible about what's happening, when it started, and any error messages you see..." />
                        <Input label="Error Codes (if any)" name="errorCodes" value={formData.errorCodes || ''} onChange={handleInputChange} placeholder="e.g., E2, F5, LF, etc." />
                    </Section>

                    <Section title="Photos (Optional but Helpful)">
                        <label 
                            htmlFor="photo-upload" 
                            onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isDragging ? 'border-brand-green' : 'border-gray-300'}`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">Upload photos of the issue, error codes, or any damage</p>
                            </div>
                            <input id="photo-upload" type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                        {formData.imageUrls && formData.imageUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                {formData.imageUrls.map((url, index) => (
                                    <div key={index} className="relative">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg border" />
                                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section title="Service Preferences">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">How urgent is this repair? *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(UrgencyLevels as readonly UrgencyLevel[]).map(level => (
                                    <label key={level} className={`block p-4 border rounded-lg cursor-pointer ${formData.urgency === level ? 'bg-lime-100 border-brand-green' : 'bg-white border-gray-300'}`}>
                                        <input type="radio" name="urgency" value={level} checked={formData.urgency === level} onChange={handleInputChange} className="hidden" />
                                        <p className="font-semibold">{level}</p>
                                        <p className="text-sm text-gray-500">{level === 'High' ? 'Appliance completely unusable' : 'Minor issue, still functional'}</p>
                                    </label>
                                ))}
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Preferred Service Date" name="preferredServiceDate" type="date" value={formData.preferredServiceDate || ''} onChange={handleInputChange} />
                            <Select label="Preferred Time of Day" name="preferredTimeOfDay" value={formData.preferredTimeOfDay} onChange={handleInputChange}>
                                {PreferredTimesOfDay.map(t => <option key={t} value={t}>{t}</option>)}
                            </Select>
                        </div>
                    </Section>

                     <Section title="Additional Information">
                        <Textarea label="Anything else we should know?" name="additionalInfo" value={formData.additionalInfo || ''} onChange={handleInputChange} placeholder="Any other details about the issue, recent changes, or special access instructions..." />
                        <Textarea label="Special Access Instructions" name="accessInstructions" value={formData.accessInstructions || ''} onChange={handleInputChange} placeholder="Gate codes, door codes, pet information, or any other access details..." />
                     </Section>

                     <Section title="Admin Settings" defaultOpen={false}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="Reported Date" name="reportedDate" type="date" value={formData.reportedDate} onChange={handleInputChange} required />
                            <Select label="Status" name="status" value={formData.status} onChange={handleInputChange}>
                                {RepairStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                     </Section>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 pt-4 border-t mt-4 gap-2">
                        <button type="button" onClick={handleCloseModal} className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark">{editingRepair ? 'Update Request' : 'Save Request'}</button>
                    </div>
                </div>
            </Modal>

            <RepairDetailsModal repair={viewingRepair} onClose={() => setViewingRepair(null)} contact={viewingRepair ? contactMap.get(viewingRepair.contactId) : undefined} />

            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Repair Request"
                message="Are you sure you want to permanently delete this repair request?"
                adminKey={adminKey}
                addToast={addToast}
            />
        </div>
    );
};

export default Repairs;