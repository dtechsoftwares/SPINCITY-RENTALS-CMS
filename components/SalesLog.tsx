import React, { useState, useEffect, useMemo } from 'react';
import { Sale, User, InventoryItem } from '../types';
import { CloseIcon } from './Icons';
import { getTodayDateString } from '../utils/dates';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-brand-text w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200">
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


const emptySaleForm: Omit<Sale, 'id'> = {
    saleId: '',
    saleDate: getTodayDateString(),
    itemId: '',
    salePrice: 0,
    buyerName: '',
    buyerContact: '',
    buyerEmail: '',
    buyerAddress: '',
    billOfSaleLink: 'https://',
    notes: '',
};

interface SalesLogProps {
    sales: Sale[];
    inventory: InventoryItem[];
    currentUser: User;
    onCreateSale: (sale: Omit<Sale, 'id'>) => void;
    onUpdateSale: (sale: Sale) => void;
    onDeleteSale: (saleId: string) => void;
    showNotification: (message: string) => void;
    adminKey: string;
}

const SalesLog: React.FC<SalesLogProps> = ({ sales, inventory, currentUser, onCreateSale, onUpdateSale, onDeleteSale, showNotification, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [formData, setFormData] = useState<Omit<Sale, 'id'>>(emptySaleForm);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    const inventoryMap = useMemo(() => new Map(inventory.map(i => [i.id, i])), [inventory]);
    
    const availableInventory = useMemo(() => {
        return inventory.filter(item => 
            item.status === 'Available' || 
            item.status === 'In Repair' || 
            (editingSale && item.id === editingSale.itemId)
        );
    }, [inventory, editingSale]);

    useEffect(() => {
        if (editingSale) {
            setFormData(editingSale);
        } else {
            const defaultItem = availableInventory.length > 0 ? availableInventory[0].id : '';
            setFormData({...emptySaleForm, itemId: defaultItem });
        }
    }, [editingSale, availableInventory]);
    
    const handleOpenModal = (sale: Sale | null) => {
        setEditingSale(sale);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSale(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = () => {
        if (!formData.saleId || !formData.itemId || !formData.buyerName) {
            alert('Sale ID, Item, and Buyer Name are required.');
            return;
        }

        if (editingSale) {
            onUpdateSale({ ...editingSale, ...formData });
            showNotification('Sale record updated successfully.');
        } else {
            onCreateSale(formData);
            showNotification('Sale recorded successfully.');
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (saleId: string) => {
        setSaleToDelete(saleId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (saleToDelete) {
            onDeleteSale(saleToDelete);
            showNotification('Sale record deleted successfully.');
        }
        setIsConfirmModalOpen(false);
        setSaleToDelete(null);
    };

    return (
        <div className="p-8 text-brand-text">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Sales Log</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">
                    Record New Sale
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
                        <tr>
                            <th className="p-4 font-semibold">Sale ID</th>
                            <th className="p-4 font-semibold">Sale Date</th>
                            <th className="p-4 font-semibold">Item Sold</th>
                            <th className="p-4 font-semibold">Buyer Name</th>
                            <th className="p-4 font-semibold">Bill of Sale</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => {
                            const item = inventoryMap.get(sale.itemId);
                            return (
                                <tr key={sale.id} className="border-b border-gray-200">
                                    <td className="p-4 font-medium">{sale.saleId}</td>
                                    <td className="p-4 text-gray-500">{sale.saleDate}</td>
                                    <td className="p-4 text-gray-500">{item ? `${item.itemType} - ${item.makeModel}` : 'Unknown Item'}</td>
                                    <td className="p-4 text-gray-500">{sale.buyerName}</td>
                                    <td className="p-4">
                                        <a href={sale.billOfSaleLink} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
                                            View
                                        </a>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        <div className="flex space-x-4">
                                            <button onClick={() => handleOpenModal(sale)} className="hover:text-brand-green">Edit</button>
                                            {isAdmin && <button onClick={() => handleDeleteRequest(sale.id)} className="text-red-500 hover:text-red-400">Delete</button>}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSale ? 'Edit Sale Record' : 'Record New Sale'}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Sale ID" name="saleId" value={formData.saleId} onChange={handleInputChange} required />
                        <Input label="Sale Date" type="date" name="saleDate" value={formData.saleDate} onChange={handleInputChange} required />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select label="Item" name="itemId" value={formData.itemId} onChange={handleInputChange} required>
                            <option value="">-- Select Item --</option>
                            {availableInventory.map(item => (
                                <option key={item.id} value={item.id}>
                                    {`${item.purchaseId} - ${item.itemType} - ${item.makeModel} (${item.serialNumber})`}
                                </option>
                            ))}
                        </Select>
                        <Input label="Sale Price" type="number" name="salePrice" value={formData.salePrice} onChange={handleInputChange} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Buyer Name" name="buyerName" value={formData.buyerName} onChange={handleInputChange} required />
                        <Input label="Buyer Contact" name="buyerContact" value={formData.buyerContact} onChange={handleInputChange} />
                    </div>
                    <Input label="Buyer Email" name="buyerEmail" value={formData.buyerEmail} onChange={handleInputChange} />
                    <Input label="Buyer Address" name="buyerAddress" value={formData.buyerAddress} onChange={handleInputChange} />
                    <Input label="Bill of Sale Link" name="billOfSaleLink" value={formData.billOfSaleLink} onChange={handleInputChange} placeholder="https://..." />
                    <Textarea label="Notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
                    
                    <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
                        <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">{editingSale ? 'Update Record' : 'Record Sale'}</button>
                    </div>
                </div>
            </Modal>
            
            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Sale Record"
                message="Are you sure you want to permanently delete this sale record? This action will also update the inventory item's status back to 'Available'."
                adminKey={adminKey}
                showNotification={showNotification}
            />
        </div>
    );
};

export default SalesLog;