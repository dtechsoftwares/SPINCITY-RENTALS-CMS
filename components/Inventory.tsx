import React, { useState, useEffect } from 'react';
import { InventoryItem, User, Vendor, InventoryItemTypes, InventoryConditions, InventoryStatuses, InventoryStatus } from '../types';
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
          <button onClick={onClose} className="text-gray-400 hover:text-brand-text">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, type = 'text', name, value, onChange, required=false, placeholder='' }: { label: string, type?: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<any>) => void, required?: boolean, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const Select = ({ label, name, value, onChange, children, required=false }: { label: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<any>) => void, children?: React.ReactNode, required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}{required && <span className="text-red-500">*</span>}</label>
      <select name={name} value={value} onChange={onChange} required={required} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green appearance-none text-brand-text" style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
        {children}
      </select>
    </div>
);

const Textarea = ({ label, name, value, onChange, placeholder, rows=4 }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, placeholder?: string, rows?: number }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const emptyItemForm: Omit<InventoryItem, 'id'> = {
    purchaseId: '',
    purchaseDate: getTodayDateString(),
    vendor: '',
    itemType: 'Washer',
    makeModel: '',
    serialNumber: '',
    condition: 'Refurbished',
    purchaseCost: 0,
    status: 'Available',
    notes: '',
};

interface InventoryProps {
    inventory: InventoryItem[];
    vendors: Vendor[];
    currentUser: User;
    onCreateItem: (item: Omit<InventoryItem, 'id'>) => void;
    onUpdateItem: (item: InventoryItem) => void;
    onDeleteItem: (itemId: string) => void;
    showNotification: (message: string) => void;
    adminKey: string;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, vendors, currentUser, onCreateItem, onUpdateItem, onDeleteItem, showNotification, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>(emptyItemForm);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    useEffect(() => {
        if (editingItem) {
            setFormData(editingItem);
        } else {
             setFormData({
                ...emptyItemForm,
                vendor: vendors[0]?.vendorName || ''
            });
        }
    }, [editingItem, vendors]);
    
    const handleOpenModal = (item: InventoryItem | null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = () => {
        if (!formData.makeModel || !formData.serialNumber) {
            alert('Make/Model and Serial Number are required.');
            return;
        }

        if (editingItem) {
            onUpdateItem({ ...editingItem, ...formData });
            showNotification('Inventory item updated successfully.');
        } else {
            onCreateItem(formData);
            showNotification('Inventory item created successfully.');
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (itemId: string) => {
        setItemToDelete(itemId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (itemToDelete) {
            onDeleteItem(itemToDelete);
            showNotification('Inventory item deleted successfully.');
        }
        setIsConfirmModalOpen(false);
        setItemToDelete(null);
    };
    
    const getStatusColor = (status: InventoryStatus) => ({
        'Available': 'bg-green-100 text-green-700',
        'Rented': 'bg-blue-100 text-blue-700',
        'In Repair': 'bg-yellow-100 text-yellow-700',
        'Sold': 'bg-red-100 text-red-700',
        'Decommissioned': 'bg-gray-100 text-gray-700',
    }[status] || 'bg-gray-100 text-gray-700');

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Inventory</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors w-full sm:w-auto">
                    Add New Item
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                {/* Table for medium and up screens */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-left min-w-[720px]">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
                            <tr>
                                <th className="p-4 font-semibold">Item Type</th>
                                <th className="p-4 font-semibold">Make/Model</th>
                                <th className="p-4 font-semibold">Serial #</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Condition</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map(item => (
                                <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="p-4 font-medium">{item.itemType}</td>
                                    <td className="p-4 text-gray-500">{item.makeModel}</td>
                                    <td className="p-4 text-gray-500">{item.serialNumber}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{item.condition}</td>
                                    <td className="p-4 text-gray-500">
                                        <div className="flex space-x-4">
                                            <button onClick={() => handleOpenModal(item)} className="hover:text-brand-green">Edit</button>
                                            {isAdmin && <button onClick={() => handleDeleteRequest(item.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Cards for small screens */}
                <div className="md:hidden">
                    <ul className="divide-y divide-gray-200">
                        {inventory.map(item => (
                            <li key={item.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg">{item.itemType} - {item.makeModel}</p>
                                        <p className="text-sm text-gray-500">SN: {item.serialNumber}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${getStatusColor(item.status)}`}>{item.status}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-sm text-gray-500">{item.condition}</p>
                                    <div className="flex space-x-4 text-sm">
                                        <button onClick={() => handleOpenModal(item)} className="font-semibold text-blue-600 hover:text-blue-500">Edit</button>
                                        {isAdmin && <button onClick={() => handleDeleteRequest(item.id)} className="font-semibold text-red-500 hover:text-red-400">Delete</button>}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Purchase ID" name="purchaseId" value={formData.purchaseId} onChange={handleInputChange} />
                        <Input label="Purchase Date" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label="Vendor" name="vendor" value={formData.vendor} onChange={handleInputChange}>
                            <option value="">-- Select Vendor --</option>
                            {vendors.map(v => <option key={v.id} value={v.vendorName}>{v.vendorName}</option>)}
                        </Select>
                        <Select label="Item Type" name="itemType" value={formData.itemType} onChange={handleInputChange}>
                            {InventoryItemTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Make/Model" name="makeModel" value={formData.makeModel} onChange={handleInputChange} required />
                        <Input label="Serial Number" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label="Condition" name="condition" value={formData.condition} onChange={handleInputChange}>
                            {InventoryConditions.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Input label="Purchase Cost" type="number" name="purchaseCost" value={formData.purchaseCost} onChange={handleInputChange} />
                    </div>
                    <Select label="Status" name="status" value={formData.status} onChange={handleInputChange}>
                        {InventoryStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Textarea label="Notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
                    
                    <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">{editingItem ? 'Save Changes' : 'Save Item'}</button>
                    </div>
                </div>
            </Modal>

            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Inventory Item"
                message="Are you sure you want to permanently delete this inventory item?"
                adminKey={adminKey}
                showNotification={showNotification}
            />
        </div>
    );
};

export default Inventory;