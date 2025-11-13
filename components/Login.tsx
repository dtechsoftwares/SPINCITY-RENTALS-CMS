import React, { useState } from 'react';
import { User } from '../types';
import { CloseIcon } from './Icons';
import * as db from '../utils/storage';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white text-brand-text w-full max-w-md rounded-xl shadow-2xl border border-gray-200">
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

const Input = ({ label, type = 'text', name, value, onChange, required=false, placeholder='' }: { label: string, type?: string, name: string, value: string, onChange: (e: React.ChangeEvent<any>) => void, required?: boolean, placeholder?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}{required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text" />
    </div>
);

const DefaultLogo = ({ className = "w-32 h-32 mx-auto object-contain" }: { className?: string }) => (
    <div className="text-brand-dark">
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m3 1v5.25m-3-5.25v5.25m-3-5.25l3 1m-3-1l-3 1m0 0v5.25m0 0l3 1m-3-1l-3-1" />
        </svg>
    </div>
);

const PasswordToggleIcon = ({ show, onToggle }: { show: boolean, onToggle: () => void }) => (
  <button type="button" onClick={onToggle} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
    {show ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.264 4.309" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7S3.732 16.057 2.458 12z" />
      </svg>
    )}
  </button>
);


interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegisterSuccess: (user: User) => void;
  adminKey: string;
  splashLogo: string | null;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegisterSuccess, adminKey, splashLogo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regError, setRegError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegAdminKey, setShowRegAdminKey] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    await new Promise(res => setTimeout(res, 300));

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && user.password === password) {
        onLogin(user);
    } else {
        setError('Invalid email or password.');
    }
    
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsSubmitting(true);
    
    await new Promise(res => setTimeout(res, 300));

    if (regPassword.length < 4) {
        setRegError("Password should be at least 4 characters.");
        setIsSubmitting(false);
        return;
    }
    
    if (users.some(u => u.email.toLowerCase() === regEmail.toLowerCase())) {
        setRegError("An account with this email already exists.");
        setIsSubmitting(false);
        return;
    }

    const isFirstUser = users.length === 0;
    if (isFirstUser) {
        if (regAdminKey.length < 4) {
            setRegError('Admin Key must be at least 4 characters long.');
            setIsSubmitting(false);
            return;
        }
        db.saveAdminKey(regAdminKey);
    }

    const newUser: Omit<User, 'id'> = {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: isFirstUser ? 'Admin' : 'User',
        avatar: `https://picsum.photos/seed/${regName}/80/80`
    };

    const createdUser = db.createUser(newUser);
    onRegisterSuccess(createdUser);

    setIsSubmitting(false);
    setIsRegisterModalOpen(false);
  };
  
  if (users.length === 0) {
    return (
      <div className="min-h-screen bg-brand-green flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <div className="mb-6 text-center">
             {splashLogo ? <img src={splashLogo} alt="Spin City Rentals Logo" className="w-32 h-32 mx-auto object-contain" /> : <DefaultLogo />}
             <h1 className="text-2xl font-bold text-brand-text mt-4">SpinCity Rentals</h1>
             <p className="text-gray-500">Customer Management Service</p>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Create Admin Account</h2>
          <p className="text-center text-gray-500 mb-6">Welcome! As the first user, you will become the administrator.</p>
          
          {regError && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{regError}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Full Name" name="name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
            <Input label="Email Address" type="email" name="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Password (min. 4 characters)<span className="text-red-500">*</span></label>
                <div className="relative">
                    <input type={showRegPassword ? 'text' : 'password'} name="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text pr-10" />
                    <PasswordToggleIcon show={showRegPassword} onToggle={() => setShowRegPassword(!showRegPassword)} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Set Admin Key<span className="text-red-500">*</span></label>
                <div className="relative">
                    <input type={showRegAdminKey ? 'text' : 'password'} name="adminKey" value={regAdminKey} onChange={(e) => setRegAdminKey(e.target.value)} required placeholder="Create a secret key for admin actions" className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text pr-10" />
                    <PasswordToggleIcon show={showRegAdminKey} onToggle={() => setShowRegAdminKey(!showRegAdminKey)} />
                </div>
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark transition-colors disabled:bg-gray-400 mt-6">
              {isSubmitting ? 'Creating Account...' : 'Create Admin Account'}
            </button>
          </form>
          <p className="text-center mt-8 text-xs text-gray-400">Powered By: Cicadas IT Solutions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-green flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-200">
          <div className="mb-6 text-center">
              {splashLogo ? <img src={splashLogo} alt="Spin City Rentals Logo" className="w-32 h-32 mx-auto object-contain" /> : <DefaultLogo />}
              <h1 className="text-2xl font-bold text-brand-text mt-4">SpinCity Rentals</h1>
              <p className="text-gray-500">Customer Management Service</p>
          </div>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green pr-10"
                  required
                />
                <PasswordToggleIcon show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-green-dark transition-colors disabled:bg-gray-400">
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="text-center mt-6">
            <button onClick={() => setIsRegisterModalOpen(true)} className="text-sm text-brand-green hover:underline disabled:text-gray-400">
              New here? Register now
            </button>
          </div>
          <p className="text-center mt-8 text-xs text-gray-400">Powered By: Cicadas IT Solutions</p>
      </div>
      <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Register New User">
          <p className="text-gray-600 mb-4">Create a new account to access the CMS.</p>
          {regError && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{regError}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
              <Input label="Full Name" name="name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              <Input label="Email Address" type="email" name="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Password (min. 4 characters)<span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input type={showRegPassword ? 'text' : 'password'} name="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text pr-10" />
                      <PasswordToggleIcon show={showRegPassword} onToggle={() => setShowRegPassword(!showRegPassword)} />
                  </div>
              </div>
              <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-brand-green text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-green-dark disabled:bg-gray-400">
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;