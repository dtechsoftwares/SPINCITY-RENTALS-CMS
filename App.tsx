
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, User, Contact, Rental, Repair, SmsSettings, InventoryItem, Sale, Vendor, SiteContact, SiteRental, SiteRepair, NotificationSettings, LogEntry } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Contacts from './components/Contacts';
import Settings from './components/Settings';
import Rentals from './components/Rentals';
import Repairs from './components/Repairs';
import Inventory from './components/Inventory';
import SalesLog from './components/SalesLog';
import Vendors from './components/Vendors';
import Preloader from './components/Preloader';
import Login from './components/Login';
import Notifications from './components/Notifications';
import Reports from './components/Reports';
import MonitorSite from './components/MonitorSite';
import HtmlViewer from './components/HtmlViewer';
import ActivityLogs from './components/ActivityLogs';
import AiAssistant from './components/AiAssistant';
import * as db from './utils/storage';
import { auth, db as firestore } from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, collection, query, orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Spinner from './components/Spinner';
import ToastContainer, { ToastMessage } from './components/Toasts';

const EMAILJS_CONFIG = {
    PUBLIC_KEY: "Jil8e_qWbBah38tVF",
    SERVICE_ID: "service_1eklhb5",
    LOG_TEMPLATE_ID: "template_71508un"
};

interface HeaderProps {
    viewName: string;
    user: User;
    onMenuClick: () => void;
    onSearch: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ viewName, user, onMenuClick, onSearch }) => {
    return (
        <header className="bg-brand-light p-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 flex-shrink-0 print:hidden gap-4">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
                <button onClick={onMenuClick} className="md:hidden text-brand-text p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <h1 className="text-xl font-bold text-brand-text whitespace-nowrap uppercase tracking-tight">{viewName}</h1>
            </div>
            
            <div className="flex-1 max-w-md w-full relative">
                <input 
                    type="text" 
                    placeholder="Search clients or equipment..." 
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <div className="hidden lg:block text-right">
                    <p className="font-semibold text-brand-text text-sm leading-tight">{user.name}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">{user.role}</p>
                </div>
                <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-green ring-offset-2" />
            </div>
        </header>
    );
};

const App: React.FC = () => {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSettingsInitialised, setIsSettingsInitialised] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.Dashboard);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [splashLogo, setSplashLogo] = useState<string | null>(null);
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({ smsEnabled: true, emailEnabled: true });
  const [adminKey, setAdminKey] = useState<string>('');
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastId = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [siteContacts, setSiteContacts] = useState<SiteContact[]>([]);
  const [siteRentals, setSiteRentals] = useState<SiteRental[]>([]);
  const [siteRepairs, setSiteRepairs] = useState<SiteRepair[]>([]);
  
  useEffect(() => {
    const win = window as any;
    if (win.emailjs) {
        win.emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
    }
  }, []);

  const addToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAction = useCallback(async <T,>(action: () => Promise<T> | T): Promise<T | void> => {
    setIsActionLoading(true);
    try {
      return await action();
    } catch (error) {
      console.error("Action error:", error);
      addToast('Error', 'Action failed. Check Supabase connection.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  }, [addToast]);

  const handleLogAction = useCallback(async (actionType: 'CREATE' | 'UPDATE' | 'DELETE', entity: string, details: string, actionPromise: Promise<void>) => {
      try {
          await actionPromise;
          if (!currentUser) return;
          const logData = { timestamp: new Date().toISOString(), adminName: currentUser.name, adminEmail: currentUser.email, actionType, entity, details };
          await db.createLogEntry(logData);
      } catch (error) { console.error("Logging error:", error); }
  }, [currentUser]);

  const handleLogout = useCallback(() => handleAction(async () => { await signOut(auth); }), [handleAction]);

  const fetchPublicSettings = async () => {
    try {
        const docRef = doc(firestore, 'settings', 'public');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setAppLogo(data.app_logo || null);
            setSplashLogo(data.splash_logo || null);
            setIsInitialized(data.is_initialized === true);
        } else {
            setIsInitialized(false);
        }
    } catch (e) {
        console.error("Error fetching public settings:", e);
        setIsInitialized(false);
    } finally {
        setIsSettingsInitialised(true);
    }
  };

  const fetchPrivateSettings = async () => {
    if (!currentUser) return;
    try {
        const docRef = doc(firestore, 'settings', 'private');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setAdminKey(data.admin_key || 'admin');
            setSmsSettings(data.sms_settings || { accountSid: '', authToken: '', twilioPhoneNumber: '' });
            setNotificationSettings(data.notification_settings || { smsEnabled: true, emailEnabled: true });
        }
        setSettingsLoaded(true);
    } catch (e) {
        console.error("Error fetching private settings:", e);
    }
  };

  useEffect(() => {
    fetchPublicSettings();
  }, []);

  useEffect(() => {
    if (currentUser) {
        fetchPrivateSettings();
        const unsub = onSnapshot(doc(firestore, 'settings', 'private'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAdminKey(data.admin_key || 'admin');
                setSmsSettings(data.sms_settings || { accountSid: '', authToken: '', twilioPhoneNumber: '' });
                setNotificationSettings(data.notification_settings || { smsEnabled: true, emailEnabled: true });
            }
        });
        return () => unsub();
    } else {
        setSettingsLoaded(false);
    }
  }, [currentUser]);

  const fetchAllData = (isAdmin: boolean) => {
    const unsubscribes: (() => void)[] = [];

    const setupListener = (colName: string, setter: (data: any[]) => void, orderField: string, ascending: boolean = false) => {
        const q = query(collection(firestore, colName), orderBy(orderField, ascending ? 'asc' : 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        unsubscribes.push(unsub);
    };

    setupListener('contacts', setContacts, 'created_at');
    setupListener('rentals', setRentals, 'start_date');
    setupListener('repairs', setRepairs, 'reported_date');
    setupListener('inventory', setInventory, 'purchase_date');
    setupListener('sales', setSales, 'sale_date');
    setupListener('vendors', setVendors, 'vendor_name', true);

    if (isAdmin) {
        setupListener('users', setUsers, 'name', true);
        setupListener('activity_logs', setLogs, 'timestamp');
        setupListener('contact_submissions', setSiteContacts, 'timestamp');
        setupListener('rental_agreements', setSiteRentals, 'timestamp');
        setupListener('repair_requests', setSiteRepairs, 'submission_date');
    }

    return () => unsubscribes.forEach(unsub => unsub());
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docRef = doc(firestore, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const profile = { id: docSnap.id, ...docSnap.data() } as User;
                    setCurrentUser(profile);
                    const unsubData = fetchAllData(profile.role === 'Admin');
                    return () => {
                        unsubData();
                    };
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
            }
        } else {
            setCurrentUser(null);
        }
        setAuthChecked(true);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => { if (isSettingsInitialised) setSettingsLoaded(true); }, [isSettingsInitialised]);

  const handleUpdateFirebaseStatus = (id: string, type: string, newStatus: string) => {
    let table = type === 'contact' ? 'contact_submissions' : type === 'rental' ? 'rental_agreements' : 'repair_requests';
    const action = handleAction(() => updateDoc(doc(firestore, table, id), { status: newStatus }));
    handleLogAction('UPDATE', 'Site Submission', `Updated status of ${type} to ${newStatus}`, action as Promise<void>);
    action.then(() => addToast('Success', `Status updated.`, 'success'));
  };

  const handleDeleteFirebaseSubmission = (id: string, type: string) => {
    let table = type === 'contact' ? 'contact_submissions' : type === 'rental' ? 'rental_agreements' : 'repair_requests';
    const action = handleAction(() => deleteDoc(doc(firestore, table, id)));
    handleLogAction('DELETE', 'Site Submission', `Deleted ${type} submission`, action as Promise<void>);
    action.then(() => addToast('Success', `Submission deleted.`, 'success'));
  };

  const handleUpdateUser = (updatedUser: User) => handleAction(() => db.updateUser(updatedUser));
  const handleDeleteUser = (userId: string) => handleAction(() => db.deleteUser(userId));
  const handleUpdateLogo = (logo: string | null) => handleAction(() => db.saveAppLogo(logo));
  const handleUpdateSplashLogo = (logo: string | null) => handleAction(() => db.saveSplashLogo(logo));
  const handleCreateContact = (newContact: Omit<Contact, 'id'>) => handleAction(() => db.createContact(newContact));
  const handleUpdateContact = (updatedContact: Contact) => handleAction(() => db.updateContact(updatedContact));
  const handleDeleteContact = (contactId: string) => handleAction(() => db.deleteContact(contactId));
  const handleCreateRental = (newRental: Omit<Rental, 'id'>) => handleAction(() => db.createRental(newRental));
  const handleUpdateRental = (updatedRental: Rental) => handleAction(() => db.updateRental(updatedRental));
  const handleDeleteRental = (rentalId: string) => handleAction(() => db.deleteRental(rentalId));
  const handleCreateRepair = (newRepair: Omit<Repair, 'id'>) => handleAction(() => db.createRepair(newRepair));
  const handleUpdateRepair = (updatedRepair: Repair) => handleAction(() => db.updateRepair(updatedRepair));
  const handleDeleteRepair = (repairId: string) => handleAction(() => db.deleteRepair(repairId));
  const handleCreateInventory = (newItem: Omit<InventoryItem, 'id'>) => handleAction(() => db.createInventory(newItem));
  const handleUpdateInventory = (updatedItem: InventoryItem) => handleAction(() => db.updateInventory(updatedItem));
  const handleDeleteInventory = (itemId: string) => handleAction(() => db.deleteInventory(itemId));
  const handleCreateSale = (newSale: Omit<Sale, 'id'>) => handleAction(() => db.createSale(newSale));
  const handleUpdateSale = (updatedSale: Sale) => handleAction(() => db.updateSale(updatedSale));
  const handleDeleteSale = (saleId: string) => handleAction(() => db.deleteSale(saleId));
  const handleCreateVendor = (newVendor: Omit<Vendor, 'id'>) => handleAction(() => db.createVendor(newVendor));
  const handleUpdateVendor = (updatedVendor: Vendor) => handleAction(() => db.updateVendor(updatedVendor));
  const handleDeleteVendor = (vendorId: string) => handleAction(() => db.deleteVendor(vendorId));
  const handleUpdateSmsSettings = (settings: SmsSettings) => handleAction(() => db.saveSmsSettings(settings));
  const handleUpdateAdminKey = (key: string) => handleAction(() => db.saveAdminKey(key));
  const handleUpdateNotificationSettings = (settings: NotificationSettings) => handleAction(() => db.saveNotificationSettings(settings));
  const handleDeleteLog = (logId: string) => handleAction(() => db.deleteLogEntry(logId));

  const handleViewChange = (view: AppView) => {
    if (view === currentView) { if (window.innerWidth < 768) setIsSidebarOpen(false); return; };
    setCurrentView(view);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  if (!authChecked || !isSettingsInitialised || !settingsLoaded) {
    return (<> <Preloader splashLogo={splashLogo} /> <div className="fixed bottom-4 right-4 text-xs text-white z-[10000]">v3.1-Stable</div> </>);
  }

  if (!currentUser) {
    return (<> <Login adminKey={adminKey} splashLogo={splashLogo} addToast={addToast} initialError={loginError} isSystemInitialized={isInitialized} /> <ToastContainer toasts={toasts} removeToast={removeToast} /> </>);
  }

  const filteredContacts = contacts.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredInventory = inventory.filter(i => i.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) || i.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-gray-100 font-sans print:h-auto print:block">
      {isSidebarOpen && ( <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden print:hidden" onClick={() => setIsSidebarOpen(false)}></div> )}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:z-0 flex flex-col h-full print:hidden`}>
        <Sidebar currentView={currentView} setCurrentView={handleViewChange} onLogout={handleLogout} appLogo={appLogo} currentUser={currentUser} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden relative print:block print:h-auto print:overflow-visible">
        <Header viewName={AppView[currentView]} user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} onSearch={setSearchTerm} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 relative print:h-auto print:overflow-visible">
          {currentView === AppView.Dashboard && <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} inventory={inventory} users={users} currentUser={currentUser} siteContacts={siteContacts} siteRentals={siteRentals} siteRepairs={siteRepairs} />}
          {currentView === AppView.Users && <Users users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Contacts && <Contacts contacts={searchTerm ? filteredContacts : contacts} currentUser={currentUser} onCreateContact={handleCreateContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Rentals && <Rentals rentals={rentals} contacts={contacts} inventory={inventory} currentUser={currentUser} onCreateRental={handleCreateRental} onUpdateRental={handleUpdateRental} onDeleteRental={handleDeleteRental} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Repairs && <Repairs repairs={repairs} contacts={contacts} currentUser={currentUser} onCreateRepair={handleCreateRepair} onUpdateRepair={handleUpdateRepair} onDeleteRepair={handleDeleteRepair} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Inventory && <Inventory inventory={searchTerm ? filteredInventory : inventory} vendors={vendors} currentUser={currentUser} onCreateItem={handleCreateInventory} onUpdateItem={handleUpdateInventory} onDeleteItem={handleDeleteInventory} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.SalesLog && <SalesLog sales={sales} inventory={inventory} currentUser={currentUser} onCreateSale={handleCreateSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Vendors && <Vendors vendors={vendors} inventory={inventory} currentUser={currentUser} onCreateVendor={handleCreateVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Notifications && <Notifications contacts={contacts} smsSettings={smsSettings} notificationSettings={notificationSettings} handleAction={handleAction} addToast={addToast} />}
          {currentView === AppView.Reports && <Reports contacts={contacts} rentals={rentals} repairs={repairs} siteContacts={siteContacts} siteRentals={siteRentals} siteRepairs={siteRepairs} handleAction={handleAction} />}
          {currentView === AppView.MonitorSite && <MonitorSite siteContacts={siteContacts} siteRentals={siteRentals} siteRepairs={siteRepairs} onUpdateStatus={handleUpdateFirebaseStatus} onDeleteSubmission={handleDeleteFirebaseSubmission} adminKey={adminKey} addToast={addToast} />}
          {currentView === AppView.HtmlViewer && <HtmlViewer />}
          {currentView === AppView.ActivityLogs && <ActivityLogs logs={logs} onDeleteLog={handleDeleteLog} adminKey={adminKey} addToast={addToast} />}
          {currentView === AppView.AiAssistant && <AiAssistant contacts={contacts} rentals={rentals} inventory={inventory} repairs={repairs} currentUser={currentUser} />}
          {currentView === AppView.Settings && (
              <Settings onUpdateLogo={handleUpdateLogo} currentLogo={appLogo} smsSettings={smsSettings} onUpdateSmsSettings={handleUpdateSmsSettings} adminKey={adminKey} onUpdateAdminKey={handleUpdateAdminKey} currentSplashLogo={splashLogo} onUpdateSplashLogo={handleUpdateSplashLogo} addToast={addToast} notificationSettings={notificationSettings} onUpdateNotificationSettings={handleUpdateNotificationSettings} />
          )}
        </main>
        {isActionLoading && <Spinner />}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
