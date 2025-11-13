import React, { useState, useEffect, useMemo } from 'react';
import { Vendor, User, InventoryItem } from '../types';
import { CloseIcon } from './Icons';
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
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, type = 'text', name, value, onChange, required=false, placeholder='' }: { label: string, type?: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, required?: boolean, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const Textarea = ({ label, name, value, onChange, placeholder, rows=4 }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, placeholder?: string, rows?: number }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const emptyVendorForm: Omit<Vendor, 'id'> = {
    vendorId: '',
    vendorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    notes: '',
};

interface VendorsProps {
    vendors: Vendor[];
    inventory: InventoryItem[];
    currentUser: User;
    onCreateVendor: (vendor: Omit<Vendor, 'id'>) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (vendorId: string) => void;
    showNotification: (message: string) => void;
    adminKey: string;
}

const Vendors: React.FC<VendorsProps> = ({ vendors, inventory, currentUser, onCreateVendor, onUpdateVendor, onDeleteVendor, showNotification, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState<Omit<Vendor, 'id'>>(emptyVendorForm);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    const itemsPurchasedMap = useMemo(() => {
        const map = new Map<string, number>();
        inventory.forEach(item => {
            map.set(item.vendor, (map.get(item.vendor) || 0) + 1);
        });
        return map;
    }, [inventory]);

    useEffect(() => {
        if (editingVendor) {
            setFormData(editingVendor);
        } else {
            const highestId = vendors.reduce((max, v) => {
                const idNum = parseInt(v.vendorId.replace('V-', ''), 10);
                return idNum > max ? idNum : max;
            }, 1000);
            const newVendorId = `V-${highestId + 1}`;
            setFormData({...emptyVendorForm, vendorId: newVendorId});
        }
    }, [editingVendor, vendors]);
    
    const handleOpenModal = (vendor: Vendor | null) => {
        setEditingVendor(vendor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVendor(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.vendorName || !formData.contactPerson) {
            alert('Vendor Name and Contact Person are required.');
            return;
        }

        if (editingVendor) {
            onUpdateVendor({ ...editingVendor, ...formData });
            showNotification('Vendor updated successfully.');
        } else {
            onCreateVendor(formData);
            showNotification('Vendor created successfully.');
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (vendorId: string) => {
        setVendorToDelete(vendorId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (vendorToDelete) {
            onDeleteVendor(vendorToDelete);
            showNotification('Vendor deleted successfully.');
        }
        setIsConfirmModalOpen(false);
        setVendorToDelete(null);
    };

    return (
        <div className="p-8 text-brand-text">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Vendor Management</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">
                    + Add New Vendor
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
                        <tr>
                            <th className="p-4 font-semibold">Vendor ID</th>
                            <th className="p-4 font-semibold">Vendor Name</th>
                            <th className="p-4 font-semibold">Contact Person</th>
                            <th className="p-4 font-semibold">Phone</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Items Purchased</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map(vendor => (
                            <tr key={vendor.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-4 font-medium">{vendor.vendorId}</td>
                                <td className="p-4 text-gray-600">{vendor.vendorName}</td>
                                <td className="p-4 text-gray-600">{vendor.contactPerson}</td>
                                <td className="p-4 text-gray-600">{vendor.phone}</td>
                                <td className="p-4 text-gray-600">{vendor.email}</td>
                                <td className="p-4 text-gray-600 font-medium text-center">{itemsPurchasedMap.get(vendor.vendorName) || 0}</td>
                                <td className="p-4 text-gray-500">
                                    <div className="flex space-x-4">
                                        <button onClick={() => handleOpenModal(vendor)} className="hover:text-brand-green">Edit</button>
                                        {isAdmin && <button onClick={() => handleDeleteRequest(vendor.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Vendor ID" name="vendorId" value={formData.vendorId} onChange={handleInputChange} required />
                        <Input label="Vendor Name" name="vendorName" value={formData.vendorName} onChange={handleInputChange} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} required />
                        <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                    <Input label="Address" name="address" value={formData.address} onChange={handleInputChange} />
                    <Input label="Website" name="website" value={formData.website || ''} onChange={handleInputChange} />
                    <Textarea label="Notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
                    
                    <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">{editingVendor ? 'Save Changes' : 'Save Vendor'}</button>
                    </div>
                </div>
            </Modal>
            
            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Vendor"
                message="Are you sure you want to permanently delete this vendor?"
                adminKey={adminKey}
                showNotification={showNotification}
            />
        </div>
    );
};

export default Vendors;