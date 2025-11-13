import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon } from './Icons';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-brand-text w-full max-w-lg rounded-xl shadow-2xl border border-gray-200">
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


const UserDetailsModal = ({ user, onClose }: { user: User | null; onClose: () => void; }) => {
    if (!user) return null;
  
    return (
      <Modal isOpen={!!user} onClose={onClose} title="User Details">
        <div className="flex flex-col items-center space-y-6 p-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
          />
          <div className="text-center">
            <h3 className="text-2xl font-bold text-brand-text">{user.name}</h3>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg w-full text-left space-y-3">
             <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</p>
                <p className="text-lg font-semibold text-purple-700">{user.role}</p>
             </div>
             <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User ID</p>
                <p className="text-lg font-medium text-brand-text">{user.id}</p>
             </div>
          </div>
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

interface UsersProps {
    users: User[];
    currentUser: User;
    onCreateUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    showNotification: (message: string) => void;
    adminKey: string;
}

const Users: React.FC<UsersProps> = ({ users, currentUser, onCreateUser, onUpdateUser, onDeleteUser, showNotification, adminKey }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [viewingUser, setViewingUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const isAdmin = currentUser.role === 'Admin';

    useEffect(() => {
        if (editingUser) {
            setFormData({ ...editingUser, password: '' }); // Don't show current password
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'User',
                avatar: 'https://picsum.photos/seed/newuser/80/80'
            });
        }
    }, [editingUser]);
    
    const openModalForCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };
    
    const openModalForEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const openModalForView = (user: User) => {
        setViewingUser(user);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleCloseViewModal = () => {
        setViewingUser(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
    
        if (type === 'file') {
          const fileInput = e.target as HTMLInputElement;
          if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
              setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
          }
        } else {
          setFormData((prev): Partial<User> => ({ ...prev, [name as keyof User]: value }));
        }
      };

    const handleSubmit = () => {
        if (!formData.name || !formData.email || !formData.role || !formData.avatar) {
            alert('Please fill all fields');
            return;
        }
        if (editingUser) {
            onUpdateUser({ ...editingUser, ...formData, password: formData.password || undefined });
            showNotification('User updated successfully.');
        } else {
            if (!formData.password) {
                 alert('Password is required for new users.');
                 return;
            }
            onCreateUser(formData as Omit<User, 'id'>);
            showNotification('User created successfully.');
        }
        handleCloseModal();
    };

    const handleDeleteRequest = (userId: string) => {
      setUserToDelete(userId);
      setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete);
            showNotification('User deleted successfully.');
        }
        setIsConfirmModalOpen(false);
        setUserToDelete(null);
    };
    
  return (
    <div className="p-8 text-brand-text">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        {isAdmin && (
            <button onClick={openModalForCreate} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">
            Create New User
            </button>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-sm">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
               <tr key={user.id} className="border-b border-gray-200">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-medium">{user.name}{user.id === currentUser.id && " (You)"}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-500">{user.email}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 text-sm rounded-full font-semibold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  <div className="flex space-x-4">
                    <button onClick={() => openModalForView(user)} className="hover:text-brand-green">View</button>
                    {isAdmin && (
                        <>
                            <button onClick={() => openModalForEdit(user)} className="hover:text-brand-green">Edit</button>
                            {user.id !== currentUser.id && (
                               <button onClick={() => handleDeleteRequest(user.id)} className="text-red-500 hover:text-red-400">Delete</button>
                            )}
                        </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingUser ? 'Edit User' : 'Create New User'}>
          <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                  <input type="password" name="password" placeholder={editingUser ? "Leave blank to keep current password" : ""} value={formData.password || ''} onChange={handleInputChange} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green" />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Profile Image</label>
                <div className="flex items-center space-x-4 mt-2">
                    <img 
                        src={formData.avatar || 'https://via.placeholder.com/80'} 
                        alt="Avatar Preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" 
                    />
                    <input 
                        type="file" 
                        name="avatar" 
                        accept="image/*" 
                        onChange={handleInputChange} 
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100"
                    />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                  <select name="role" value={formData.role || 'User'} onChange={handleInputChange} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green">
                      <option>Admin</option>
                      <option>User</option>
                  </select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button onClick={handleCloseModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={handleSubmit} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark">{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
          </div>
       </Modal>
       
       <UserDetailsModal user={viewingUser} onClose={handleCloseViewModal} />

       <AdminKeyConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message="Are you sure you want to permanently delete this user?"
        adminKey={adminKey}
        showNotification={showNotification}
      />
    </div>
  );
};

export default Users;