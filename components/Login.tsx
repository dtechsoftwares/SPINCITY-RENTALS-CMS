import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon } from './Icons';
import * as db from '../utils/storage';
import { auth, db as firestoreDb } from '../utils/firebase';
// Fix: Use named imports for firebase/auth functions.
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { defaultLogoBase64 } from '../assets/default-logo';

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
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
  adminKey: string;
  splashLogo: string | null;
  showNotification: (message: string) => void;
}

const Login: React.FC<LoginProps> = ({ adminKey, splashLogo, showNotification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regError, setRegError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegAdminKey, setShowRegAdminKey] = useState(false);
  
  useEffect(() => {
    const checkFirstUser = async () => {
        const usersCollectionRef = collection(firestoreDb, 'users');
        const q = query(usersCollectionRef, limit(1));
        const usersSnapshot = await getDocs(q);
        setIsFirstUser(usersSnapshot.empty);
    };
    checkFirstUser();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
        // Fix: Correctly call signInWithEmailAndPassword from the named import.
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged in App.tsx will handle the rest
    } catch (err: any) {
        setError(err.message || 'Invalid email or password.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setIsSubmitting(true);
    
    try {
        if (regPassword.length < 6) {
            throw new Error("Password should be at least 6 characters.");
        }
        
        if (isFirstUser) {
            if (regAdminKey.length < 4) {
                throw new Error('Admin Key must be at least 4 characters long.');
            }
            await db.saveAdminKey(regAdminKey);
        }
        
        // Fix: Correctly call createUserWithEmailAndPassword from the named import.
        const { user: authUser } = await createUserWithEmailAndPassword(auth, regEmail, regPassword);

        if (authUser) {
            const newUserForFirestore: Omit<User, 'id' | 'password'> = {
                name: regName,
                email: regEmail,
                role: isFirstUser ? 'Admin' : 'User',
                avatar: `https://i.pravatar.cc/80?u=${authUser.uid}`
            };
            await db.createUserProfile(authUser.uid, newUserForFirestore);
            showNotification('Registration successful! Welcome.');
            setIsRegisterModalOpen(false);
            // onAuthStateChanged will handle login
        } else {
            throw new Error("Could not create user account.");
        }

    } catch (err: any) {
        setRegError(err.message || "An error occurred during registration.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isFirstUser === null) {
      return <div className="min-h-screen bg-brand-green flex justify-center items-center"><div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-white rounded-full animate-spin"></div></div>;
  }
  
  if (isFirstUser) {
    return (
      <div className="min-h-screen bg-brand-green flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 animate-fade-in-down">
          <div className="mb-6 text-center">
             <img src={splashLogo || defaultLogoBase64} alt="Spin City Rentals Logo" className="w-32 h-32 mx-auto object-contain" />
             <p className="text-gray-500 text-lg mt-4">Customer Management Service</p>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Create Admin Account</h2>
          <p className="text-center text-gray-500 mb-6">Welcome! As the first user, you will become the administrator.</p>
          
          {regError && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{regError}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Full Name" name="name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
            <Input label="Email Address" type="email" name="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Password (min. 6 characters)<span className="text-red-500">*</span></label>
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
      <div className="max-w-md w-full mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-md border border-gray-200 animate-fade-in-down">
          <div className="mb-6 text-center">
              <img src={splashLogo || defaultLogoBase64} alt="Spin City Rentals Logo" className="w-32 h-32 mx-auto object-contain" />
              <p className="text-gray-500 text-lg mt-4">Customer Management Service</p>
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">Password (min. 6 characters)<span className="text-red-500">*</span></label>
                  <div className="relative">
                      <input type={showRegPassword ? 'text' : 'password'} name="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text pr-10" />
                      <PasswordToggleIcon show={showRegPassword} onToggle={() => setShowRegPassword(!showRegPassword)} />
                  </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 pt-2 gap-2">
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark disabled:bg-gray-400">
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Login;