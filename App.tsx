
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
import { auth, db as firestoreDb } from './utils/firebase';
import { collection, doc, onSnapshot, query, orderBy, getDoc, updateDoc, deleteDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const [loginError, setLoginError] = useState('');

  const [siteContacts, setSiteContacts] = useState<SiteContact[]>([]);
  const [siteRentals, setSiteRentals] = useState<SiteRental[]>([]);
  const [siteRepairs, setSiteRepairs] = useState<SiteRepair[]>([]);
  
  const initialLoad = useRef({ contacts: true, rentals: true, repairs: true });
  const processedDocIds = useRef(new Set<string>());

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
      addToast('Error', 'Action failed. Check network or permissions.', 'error');
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
          const emailJS = (window as any).emailjs;
          if (emailJS) {
              const params = { to_email: 'developer@dtechsoftwares.com', from_name: currentUser.name, from_email: currentUser.email, subject: `[CMS Log] ${actionType} ${entity}`, action_type: actionType, entity, admin_name: currentUser.name, admin_email: currentUser.email, timestamp: new Date().toLocaleString(), details, message: details };
              emailJS.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.LOG_TEMPLATE_ID, params, EMAILJS_CONFIG.PUBLIC_KEY).catch((e: any) => console.error("EmailJS Error:", e));
          }
      } catch (error) { console.error("Logging error:", error); }
  }, [currentUser]);

  const handleLogout = useCallback(() => handleAction(async () => { await signOut(auth); }), [handleAction]);

  useEffect(() => {
      const settingsRef = doc(firestoreDb, 'settings', 'main');
      const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              setAppLogo(data.appLogo || null); 
              setSplashLogo(data.splashLogo || null); 
              setAdminKey(data.adminKey || 'admin'); 
              setSmsSettings(data.smsSettings || { accountSid: '', authToken: '', twilioPhoneNumber: '' }); 
              setNotificationSettings(data.notificationSettings || { smsEnabled: true, emailEnabled: true });
          } else {
              setAdminKey('admin');
          }
          setIsSettingsInitialised(true);
      }, (e) => { 
          if (e.code !== 'permission-denied') console.warn("Settings error:", e.code); 
          setIsSettingsInitialised(true); 
      });
      return () => unsubscribe();
  }, []);

  const fetchUserProfileWithRetry = async (uid: string, retries = 10, delay = 800): Promise<DocumentSnapshot | null> => {
      const userDocRef = doc(firestoreDb, 'users', uid);
      try {
          const snapshot = await getDoc(userDocRef);
          if (snapshot.exists()) return snapshot;
          throw new Error("NOT_FOUND");
      } catch (err: any) {
          if (retries <= 0) throw err;
          // Retry on permission-denied as it often indicates a race condition during sign-up
          if (err.code === 'permission-denied' || err.message === "NOT_FOUND") {
            await new Promise(r => setTimeout(r, delay));
            return fetchUserProfileWithRetry(uid, retries - 1, delay);
          }
          throw err;
      }
  };

  useEffect(() => {
    const authUnsubscriber = onAuthStateChanged(auth, async (authUser: any) => {
        unsubscribersRef.current.forEach(unsub => unsub());
        unsubscribersRef.current = [];

        if (authUser) {
            try {
                const userDocSnap = await fetchUserProfileWithRetry(authUser.uid);
                if (userDocSnap && userDocSnap.exists()) {
                    setLoginError('');
                    const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
                    setCurrentUser(userData);
                    
                    const isAdmin = userData.role === 'Admin';
                    const configMap: Record<string, any> = {
                        contacts: { setter: setContacts, orderByField: 'createdAt', orderDirection: 'desc' },
                        rentals: { setter: setRentals, orderByField: 'startDate', orderDirection: 'desc' },
                        repairs: { setter: setRepairs, orderByField: 'reportedDate', orderDirection: 'desc' },
                        inventory: { setter: setInventory, orderByField: 'purchaseDate', orderDirection: 'desc' },
                        sales: { setter: setSales, orderByField: 'saleDate', orderDirection: 'desc' },
                        vendors: { setter: setVendors, orderByField: 'vendorName' }
                    };
                    
                    if (isAdmin) {
                        configMap.users = { setter: setUsers, orderByField: 'name' };
                        configMap.activity_logs = { setter: setLogs, orderByField: 'timestamp', orderDirection: 'desc' };
                    }

                    Object.entries(configMap).forEach(([collectionName, config]: [string, any]) => {
                        const q = query(collection(firestoreDb, collectionName), orderBy(config.orderByField, config.orderDirection || 'asc'));
                        const unsub = onSnapshot(q, (snapshot) => {
                            const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                            config.setter(data as any);
                        }, (e) => console.warn(`Error in ${collectionName}:`, e.message));
                        unsubscribersRef.current.push(unsub);
                    });
                    
                    if (isAdmin) initializeSiteMonitoringListeners();
                } else {
                    await signOut(auth); 
                    setLoginError('Your profile was not found. Contact administrator.');
                }
            } catch (error: any) {
                console.error("Auth error:", error);
                await signOut(auth);
                setLoginError('Access denied or timeout. Please try again.');
            } finally { setAuthChecked(true); }
        } else {
            setCurrentUser(null); 
            setAuthChecked(true);
            [setUsers, setContacts, setRentals, setRepairs, setInventory, setSales, setVendors, setSiteContacts, setSiteRentals, setSiteRepairs, setLogs].forEach(s => s([]));
        }
    });
    return () => { 
        authUnsubscriber(); 
        unsubscribersRef.current.forEach(u => u()); 
    };
  }, []); 

  useEffect(() => { if (isSettingsInitialised) setSettingsLoaded(true); }, [isSettingsInitialised]);

  const initializeSiteMonitoringListeners = () => {
      const q1 = query(collection(firestoreDb, 'contactSubmissions'), orderBy('timestamp', 'desc'));
      unsubscribersRef.current.push(onSnapshot(q1, (snap) => {
          snap.docChanges().forEach((c) => {
              if (c.type === 'added' && !initialLoad.current.contacts && !processedDocIds.current.has(c.doc.id)) {
                  processedDocIds.current.add(c.doc.id); 
                  addToast('New Site Submission', `Contact from ${c.doc.data().name}`, 'success');
              }
          });
          initialLoad.current.contacts = false; 
          setSiteContacts(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'contact' })) as any);
      }));

      const q2 = query(collection(firestoreDb, 'rentalAgreements'), orderBy('timestamp', 'desc'));
      unsubscribersRef.current.push(onSnapshot(q2, (snap) => {
          snap.docChanges().forEach((c) => {
              if (c.type === 'added' && !initialLoad.current.rentals && !processedDocIds.current.has(c.doc.id)) {
                  processedDocIds.current.add(c.doc.id); 
                  addToast('New Site Submission', `Rental from ${c.doc.data().renter_name}`, 'success');
              }
          });
          initialLoad.current.rentals = false; 
          setSiteRentals(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'rental' })) as any);
      }));

      const q3 = query(collection(firestoreDb, 'repairRequests'), orderBy('submissionDate', 'desc'));
      unsubscribersRef.current.push(onSnapshot(q3, (snap) => {
          snap.docChanges().forEach((c) => {
              if (c.type === 'added' && !initialLoad.current.repairs && !processedDocIds.current.has(c.doc.id)) {
                  processedDocIds.current.add(c.doc.id); 
                  addToast('New Site Submission', `Repair from ${c.doc.data().customerName}`, 'success');
              }
          });
          initialLoad.current.repairs = false; 
          setSiteRepairs(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'repair' })) as any);
      }));
  };

  const handleUpdateFirebaseStatus = (id: string, type: string, newStatus: string) => {
    let col = type === 'contact' ? 'contactSubmissions' : type === 'rental' ? 'rentalAgreements' : 'repairRequests';
    const action = handleAction(() => updateDoc(doc(firestoreDb, col, id), { status: newStatus }));
    handleLogAction('UPDATE', 'Site Submission', `Updated status of ${type} to ${newStatus}`, action as Promise<void>);
    action.then(() => addToast('Success', `Status updated.`, 'success'));
  };

  const handleDeleteFirebaseSubmission = (id: string, type: string) => {
    let col = type === 'contact' ? 'contactSubmissions' : type === 'rental' ? 'rentalAgreements' : 'repairRequests';
    const action = handleAction(() => deleteDoc(doc(firestoreDb, col, id)));
    handleLogAction('DELETE', 'Site Submission', `Deleted ${type} submission`, action as Promise<void>);
    action.then(() => addToast('Success', `Submission deleted.`, 'success'));
  };
  
  const handleViewChange = (view: AppView) => {
    if (view === currentView) { if (window.innerWidth < 768) setIsSidebarOpen(false); return; };
    setCurrentView(view);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      const action = handleAction(() => db.updateUser(updatedUser));
      handleLogAction('UPDATE', 'User', `Updated user ${updatedUser.name}`, action as Promise<void>);
  };
  const handleDeleteUser = (userId: string) => {
      const action = handleAction(() => db.deleteUser(userId));
      handleLogAction('DELETE', 'User', `Deleted user ID: ${userId}`, action as Promise<void>);
  };
  const handleUpdateLogo = (logo: string | null) => {
      const action = handleAction(async () => { await db.saveAppLogo(logo); setAppLogo(logo); });
      handleLogAction('UPDATE', 'Settings', 'Updated Application Logo', action as Promise<void>);
  };
  const handleUpdateSplashLogo = (logo: string | null) => {
      const action = handleAction(async () => { await db.saveSplashLogo(logo); setSplashLogo(logo); });
      handleLogAction('UPDATE', 'Settings', 'Updated Splash Logo', action as Promise<void>);
  };
  const handleCreateContact = (newContact: Omit<Contact, 'id'>) => {
      const action = handleAction(async () => { await db.createContact(newContact); addToast('Success', `Client "${newContact.fullName}" created.`, 'success'); });
      handleLogAction('CREATE', 'Client', `Created client ${newContact.fullName}`, action as Promise<void>);
  };
  const handleUpdateContact = (updatedContact: Contact) => {
      const action = handleAction(() => db.updateContact(updatedContact));
      handleLogAction('UPDATE', 'Client', `Updated client ${updatedContact.fullName}`, action as Promise<void>);
  };
  const handleDeleteContact = (contactId: string) => {
      const action = handleAction(() => db.deleteContact(contactId));
      handleLogAction('DELETE', 'Client', `Deleted client ID: ${contactId}`, action as Promise<void>);
  };

  const handleCreateRental = (newRental: Omit<Rental, 'id'>) => {
      const action = handleAction(async () => { 
          await db.createRental(newRental); 
          if(newRental.inventoryItemId) {
              const item = inventory.find(i => i.id === newRental.inventoryItemId);
              if(item) await db.updateInventory({ ...item, status: 'Rented' });
          }
          addToast('Success', 'New rental agreement created.', 'success'); 
      });
      handleLogAction('CREATE', 'Rental', `Created rental`, action as Promise<void>);
  };
  const handleUpdateRental = (updatedRental: Rental) => {
      const action = handleAction(async () => {
          const oldRental = rentals.find(r => r.id === updatedRental.id);
          if (oldRental?.inventoryItemId !== updatedRental.inventoryItemId) {
              if (oldRental?.inventoryItemId) {
                  const item = inventory.find(i => i.id === oldRental.inventoryItemId);
                  if (item) await db.updateInventory({ ...item, status: 'Available' });
              }
              if (updatedRental.inventoryItemId) {
                  const item = inventory.find(i => i.id === updatedRental.inventoryItemId);
                  if (item) await db.updateInventory({ ...item, status: 'Rented' });
              }
          }
          await db.updateRental(updatedRental);
      });
      handleLogAction('UPDATE', 'Rental', `Updated rental ${updatedRental.id}`, action as Promise<void>);
  };
  const handleDeleteRental = (rentalId: string) => {
      const action = handleAction(async () => {
          const r = rentals.find(rent => rent.id === rentalId);
          if (r?.inventoryItemId) {
              const item = inventory.find(i => i.id === r.inventoryItemId);
              if (item) await db.updateInventory({ ...item, status: 'Available' });
          }
          await db.deleteRental(rentalId);
      });
      handleLogAction('DELETE', 'Rental', `Deleted rental ${rentalId}`, action as Promise<void>);
  };

  const handleCreateRepair = (newRepair: Omit<Repair, 'id'>) => {
      const action = handleAction(async () => { await db.createRepair(newRepair); addToast('Success', 'New repair request created.', 'success'); });
      handleLogAction('CREATE', 'Repair', `Created repair request`, action as Promise<void>);
  };
  const handleUpdateRepair = (updatedRepair: Repair) => {
      const action = handleAction(() => db.updateRepair(updatedRepair));
      handleLogAction('UPDATE', 'Repair', `Updated repair ${updatedRepair.id}`, action as Promise<void>);
  };
  const handleDeleteRepair = (repairId: string) => {
      const action = handleAction(() => db.deleteRepair(repairId));
      handleLogAction('DELETE', 'Repair', `Deleted repair ${repairId}`, action as Promise<void>);
  };
  const handleCreateInventory = (newItem: Omit<InventoryItem, 'id'>) => {
      const action = handleAction(async () => { await db.createInventory(newItem); addToast('Success', `Inventory item "${newItem.makeModel}" added.`, 'success'); });
      handleLogAction('CREATE', 'Inventory', `Added ${newItem.itemType}: ${newItem.makeModel}`, action as Promise<void>);
  };
  const handleUpdateInventory = (updatedItem: InventoryItem) => {
      const action = handleAction(() => db.updateInventory(updatedItem));
      handleLogAction('UPDATE', 'Inventory', `Updated item ${updatedItem.makeModel}`, action as Promise<void>);
  };
  const handleDeleteInventory = (itemId: string) => {
      const action = handleAction(() => db.deleteInventory(itemId));
      handleLogAction('DELETE', 'Inventory', `Deleted item ${itemId}`, action as Promise<void>);
  };
  const handleCreateSale = (newSale: Omit<Sale, 'id'>) => {
      const action = handleAction(async () => {
        await db.createSale(newSale); addToast('Success', `Sale recorded.`, 'success');
        const soldItem = inventory.find(i => i.id === newSale.itemId);
        if(soldItem) await db.updateInventory({ ...soldItem, status: 'Sold' });
      });
      handleLogAction('CREATE', 'Sale', `Recorded sale to ${newSale.buyerName}`, action as Promise<void>);
  };
  const handleUpdateSale = (updatedSale: Sale) => {
      const action = handleAction(() => db.updateSale(updatedSale));
      handleLogAction('UPDATE', 'Sale', `Updated sale ${updatedSale.saleId}`, action as Promise<void>);
  };
  const handleDeleteSale = (saleId: string) => {
      const action = handleAction(async () => {
          const saleToDelete = sales.find(s => s.id === saleId); await db.deleteSale(saleId);
          if (saleToDelete) {
              const soldItem = inventory.find(i => i.id === saleToDelete.itemId);
              if (soldItem) await db.updateInventory({ ...soldItem, status: 'Available' });
          }
      });
      handleLogAction('DELETE', 'Sale', `Deleted sale ${saleId}`, action as Promise<void>);
  };
  const handleCreateVendor = (newVendor: Omit<Vendor, 'id'>) => {
      const action = handleAction(async () => { await db.createVendor(newVendor); addToast('Success', `Vendor "${newVendor.vendorName}" added.`, 'success'); });
      handleLogAction('CREATE', 'Vendor', `Created vendor ${newVendor.vendorName}`, action as Promise<void>);
  };
  const handleUpdateVendor = (updatedVendor: Vendor) => {
      const action = handleAction(() => db.updateVendor(updatedVendor));
      handleLogAction('UPDATE', 'Vendor', `Updated vendor ${updatedVendor.vendorName}`, action as Promise<void>);
  };
  const handleDeleteVendor = (vendorId: string) => {
      const action = handleAction(() => db.deleteVendor(vendorId));
      handleLogAction('DELETE', 'Vendor', `Deleted vendor ${vendorId}`, action as Promise<void>);
  };
  const handleUpdateSmsSettings = (settings: SmsSettings) => {
      const action = handleAction(async () => { await db.saveSmsSettings(settings); setSmsSettings(settings); });
      handleLogAction('UPDATE', 'Settings', 'Updated Twilio Settings', action as Promise<void>);
  };
  const handleUpdateAdminKey = (key: string) => {
      const action = handleAction(async () => { await db.saveAdminKey(key); setAdminKey(key); addToast('Success', 'Admin Key updated.', 'success'); });
      handleLogAction('UPDATE', 'Settings', 'Updated Admin Key', action as Promise<void>);
  };
  const handleUpdateNotificationSettings = (settings: NotificationSettings) => { handleAction(async () => { await db.saveNotificationSettings(settings); setNotificationSettings(settings); }); };
  const handleDeleteLog = (logId: string) => { handleAction(() => db.deleteLogEntry(logId)); };

  if (!authChecked || !isSettingsInitialised || !settingsLoaded) {
    return (<> <Preloader splashLogo={splashLogo} /> <div className="fixed bottom-4 right-4 text-xs text-white z-[10000]">v2.1-Steady</div> </>);
  }

  if (!currentUser) {
    return (<> <Login adminKey={adminKey} splashLogo={splashLogo} addToast={addToast} initialError={loginError} /> <ToastContainer toasts={toasts} removeToast={removeToast} /> </>);
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
          {/* Fix: Passed inventory prop to Dashboard */}
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
