import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, User, Contact, Rental, Repair, SmsSettings, InventoryItem, Sale, Vendor, SiteContact, SiteRental, SiteRepair, NotificationSettings } from './types';
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
import * as db from './utils/storage';
import { auth, db as firestoreDb } from './utils/firebase';
// FIX: Module '"firebase/auth"' has no exported member 'onAuthStateChanged' or 'signOut'. Removed modular imports.
import { collection, doc, onSnapshot, query, orderBy, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Spinner from './components/Spinner';
import ToastContainer, { ToastMessage } from './components/Toasts';

interface HeaderProps {
    viewName: string;
    user: User;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewName, user, onMenuClick }) => {
    return (
        <header className="bg-brand-light p-4 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="md:hidden text-brand-text p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <h1 className="text-xl font-bold text-brand-text">{viewName}</h1>
            </div>
            <div className="flex items-center space-x-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                <div className="hidden sm:block">
                    <p className="font-semibold text-brand-text">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSettingsInitialised, setIsSettingsInitialised] = useState(false);
  const appLoading = !settingsLoaded || !authChecked;

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.Dashboard);
  
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [splashLogo, setSplashLogo] = useState<string | null>(null);
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({ smsEnabled: true, emailEnabled: true });
  const [adminKey, setAdminKey] = useState<string>('');
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastId = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);
  const [loginError, setLoginError] = useState('');

  // Firebase state
  const [siteContacts, setSiteContacts] = useState<SiteContact[]>([]);
  const [siteRentals, setSiteRentals] = useState<SiteRental[]>([]);
  const [siteRepairs, setSiteRepairs] = useState<SiteRepair[]>([]);
  
  const inactivityTimer = useRef<number | null>(null);
  const initialLoad = useRef({ contacts: true, rentals: true, repairs: true });
  const processedDocIds = useRef(new Set<string>());

  const addToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = toastId.current++;
    setToasts(prevToasts => [...prevToasts, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const handleAction = useCallback(async <T,>(action: () => Promise<T> | T): Promise<T | void> => {
    setIsActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await action();
      return result;
    } catch (error) {
      console.error("An error occurred during the action:", error);
      addToast('Error', 'An error occurred. Please try again.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  }, [addToast]);

  const handleLogout = useCallback(() => handleAction(async () => {
    await auth.signOut();
  }), [handleAction]);

  const logoutDueToInactivity = useCallback(() => {
    handleLogout();
    setTimeout(() => addToast('Session Expired', 'You have been logged out due to inactivity.', 'info'), 100);
  }, [handleLogout, addToast]);
  
  // Effect for inactivity timer
  useEffect(() => {
    if (currentUser) {
        const resetTimer = () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            inactivityTimer.current = window.setTimeout(logoutDueToInactivity, 5 * 60 * 1000); // 5 minutes
        };

        const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
        
        resetTimer(); // Initial timer
        events.forEach(event => window.addEventListener(event, resetTimer));
        
        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }
  }, [currentUser, logoutDueToInactivity]);

  useEffect(() => {
    // Listener for settings, runs immediately and for all users (even logged out)
    const settingsUnsubscriber = onSnapshot(doc(firestoreDb, 'settings', 'main'), (docSnap) => {
        if (docSnap.exists()) {
            const settingsData = docSnap.data();
            setAppLogo(settingsData.appLogo || null);
            setSplashLogo(settingsData.splashLogo || null);
            setAdminKey(settingsData.adminKey || 'admin');
            setSmsSettings(settingsData.smsSettings || { accountSid: '', authToken: '', twilioPhoneNumber: '' });
            setNotificationSettings(settingsData.notificationSettings || { smsEnabled: true, emailEnabled: true });
        } else {
            // Handle case where settings doc doesn't exist yet, set defaults
            setAppLogo(null);
            setSplashLogo(null);
            setAdminKey('admin');
            setSmsSettings({ accountSid: '', authToken: '', twilioPhoneNumber: '' });
            setNotificationSettings({ smsEnabled: true, emailEnabled: true });
        }
        setIsSettingsInitialised(true);
    });

    // FIX: Using compat namespaced API `auth.onAuthStateChanged` instead of modular `onAuthStateChanged(auth, ...)`.
    const authUnsubscriber = auth.onAuthStateChanged(async (authUser: any) => {
        // Unsubscribe from any existing data listeners
        unsubscribers.forEach(unsub => unsub());
        setUnsubscribers([]);

        if (authUser) {
            const userDocRef = doc(firestoreDb, 'users', authUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setLoginError('');
                const plainUserData = JSON.parse(JSON.stringify(userDocSnap.data()));
                const userData = { id: userDocSnap.id, ...plainUserData } as User;
                setCurrentUser(userData);

                // Set up real-time listeners for all data collections
                const newUnsubscribers: (()=>void)[] = [];
                
                type CollectionConfig = {
                    setter: (data: any) => void;
                    orderByField: string;
                    orderDirection?: 'asc' | 'desc';
                };

                const collectionsToSubscribe: Record<string, CollectionConfig> = {
                    users: { setter: setUsers, orderByField: 'name' },
                    contacts: { setter: setContacts, orderByField: 'createdAt', orderDirection: 'desc' },
                    rentals: { setter: setRentals, orderByField: 'startDate', orderDirection: 'desc' },
                    repairs: { setter: setRepairs, orderByField: 'reportedDate', orderDirection: 'desc' },
                    inventory: { setter: setInventory, orderByField: 'purchaseDate', orderDirection: 'desc' },
                    sales: { setter: setSales, orderByField: 'saleDate', orderDirection: 'desc' },
                    vendors: { setter: setVendors, orderByField: 'vendorName' },
                };

                Object.entries(collectionsToSubscribe).forEach(([collectionName, config]) => {
                    const q = query(collection(firestoreDb, collectionName), orderBy(config.orderByField, config.orderDirection || 'asc'));
                    const unsub = onSnapshot(q, (snapshot) => {
                        const data = snapshot.docs.map((d) => {
                            const plainData = JSON.parse(JSON.stringify(d.data()));
                            return { id: d.id, ...plainData };
                        });
                        config.setter(data as any);
                    });
                    newUnsubscribers.push(unsub);
                });
                
                // Initialize site monitoring for ALL logged-in users to get notifications.
                // The UI for viewing these submissions is still restricted to Admins.
                initializeSiteMonitoringListeners(newUnsubscribers);
                setUnsubscribers(newUnsubscribers);

            } else {
                await auth.signOut();
                setLoginError('Your user account was not found in the database. Please register or contact an administrator.');
            }
        } else {
            setCurrentUser(null);
            initialLoad.current = { contacts: true, rentals: true, repairs: true };
            processedDocIds.current.clear();
            [setUsers, setContacts, setRentals, setRepairs, setInventory, setSales, setVendors, setSiteContacts, setSiteRentals, setSiteRepairs].forEach(setter => setter([]));
        }
        setAuthChecked(true);
    });
    
    return () => {
        settingsUnsubscriber();
        authUnsubscriber();
        unsubscribers.forEach(unsub => unsub());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSettingsInitialised) {
        // This effect runs after the first settings snapshot is received.
        // It ensures the Preloader has a render cycle with the correct splashLogo prop
        // before we hide it. The timeout ensures the logo is visible.
        const timer = setTimeout(() => {
            setSettingsLoaded(true);
        }, 6000); // Changed to 6 seconds
        return () => clearTimeout(timer);
    }
  }, [isSettingsInitialised]);

  const initializeSiteMonitoringListeners = (currentUnsubscribers: (()=>void)[]) => {
      const contactsQuery = query(collection(firestoreDb, 'contactSubmissions'), orderBy('timestamp', 'desc'));
      currentUnsubscribers.push(onSnapshot(contactsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              const docId = change.doc.id;
              if (change.type === 'added' && !initialLoad.current.contacts && !processedDocIds.current.has(docId)) {
                  processedDocIds.current.add(docId);
                  const newContact = { id: change.doc.id, ...JSON.parse(JSON.stringify(change.doc.data())), type: 'contact' } as SiteContact;
                  addToast('New Site Submission', `Contact form from ${newContact.name}`, 'success');
              }
          });
          initialLoad.current.contacts = false;
          
          const fullData = snapshot.docs.map(d => ({id: d.id, ...JSON.parse(JSON.stringify(d.data())), type: 'contact'})) as SiteContact[];
          setSiteContacts(fullData);
      }));

      const rentalsQuery = query(collection(firestoreDb, 'rentalAgreements'), orderBy('timestamp', 'desc'));
      currentUnsubscribers.push(onSnapshot(rentalsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              const docId = change.doc.id;
              if (change.type === 'added' && !initialLoad.current.rentals && !processedDocIds.current.has(docId)) {
                  processedDocIds.current.add(docId);
                  const newRental = { id: change.doc.id, ...JSON.parse(JSON.stringify(change.doc.data())), type: 'rental' } as SiteRental;
                  addToast('New Site Submission', `Rental agreement from ${newRental.renter_name}`, 'success');
              }
          });
          initialLoad.current.rentals = false;

          const fullData = snapshot.docs.map(d => ({id: d.id, ...JSON.parse(JSON.stringify(d.data())), type: 'rental'})) as SiteRental[];
          setSiteRentals(fullData);
      }));

      const repairsQuery = query(collection(firestoreDb, 'repairRequests'), orderBy('submissionDate', 'desc'));
      currentUnsubscribers.push(onSnapshot(repairsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              const docId = change.doc.id;
              if (change.type === 'added' && !initialLoad.current.repairs && !processedDocIds.current.has(docId)) {
                  processedDocIds.current.add(docId);
                  const newRepair = { id: change.doc.id, ...JSON.parse(JSON.stringify(change.doc.data())), type: 'repair' } as SiteRepair;
                  addToast('New Site Submission', `Repair request from ${newRepair.customerName}`, 'success');
              }
          });
          initialLoad.current.repairs = false;
          
          const fullData = snapshot.docs.map(d => ({id: d.id, ...JSON.parse(JSON.stringify(d.data())), type: 'repair'})) as SiteRepair[];
          setSiteRepairs(fullData);
      }));
  };

  const handleUpdateFirebaseStatus = (id: string, type: 'contact' | 'rental' | 'repair', newStatus: 'new' | 'pending' | 'completed') => {
    let collectionName = '';
    if (type === 'contact') collectionName = 'contactSubmissions';
    else if (type === 'rental') collectionName = 'rentalAgreements';
    else if (type === 'repair') collectionName = 'repairRequests';
    else return;

    const docRef = doc(firestoreDb, collectionName, id);
    updateDoc(docRef, { status: newStatus })
        .then(() => addToast('Success', `Status updated to ${newStatus}.`, 'success'))
        .catch((error: any) => {
            console.error("Error updating status: ", error);
            addToast('Error', "Failed to update status.", 'error');
        });
  };

  const handleDeleteFirebaseSubmission = (id: string, type: 'contact' | 'rental' | 'repair') => {
    let collectionName = '';
    if (type === 'contact') collectionName = 'contactSubmissions';
    else if (type === 'rental') collectionName = 'rentalAgreements';
    else if (type === 'repair') collectionName = 'repairRequests';
    else return;

    handleAction(async () => {
        try {
            await deleteDoc(doc(firestoreDb, collectionName, id));
            addToast('Success', `Submission deleted successfully.`, 'success');
        } catch (error) {
            console.error("Error deleting submission: ", error);
            addToast('Error', "Failed to delete submission.", 'error');
        }
    });
  };
  
  const handleViewChange = (view: AppView) => {
    if (view === currentView) {
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        return;
    };
    handleAction(() => {
        setCurrentView(view);
    });
    if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
    }
  };
  
  const handleUpdateUser = (updatedUser: User) => handleAction(() => db.updateUser(updatedUser));
  const handleDeleteUser = (userId: string) => handleAction(() => db.deleteUser(userId));
  const handleUpdateLogo = (logo: string | null) => handleAction(async () => { await db.saveAppLogo(logo); setAppLogo(logo); });
  const handleUpdateSplashLogo = (logo: string | null) => handleAction(async () => { await db.saveSplashLogo(logo); setSplashLogo(logo); });

  const handleCreateContact = (newContact: Omit<Contact, 'id'>) => handleAction(async () => {
    await db.createContact(newContact);
    addToast('New Manual Submission', `Client "${newContact.fullName}" created.`, 'success');
  });
  const handleUpdateContact = (updatedContact: Contact) => handleAction(() => db.updateContact(updatedContact));
  const handleDeleteContact = (contactId: string) => handleAction(() => db.deleteContact(contactId));

  const handleCreateRental = (newRental: Omit<Rental, 'id'>) => handleAction(async () => {
    await db.createRental(newRental);
    addToast('New Manual Submission', 'New rental agreement created.', 'success');
  });
  const handleUpdateRental = (updatedRental: Rental) => handleAction(() => db.updateRental(updatedRental));
  const handleDeleteRental = (rentalId: string) => handleAction(() => db.deleteRental(rentalId));

  const handleCreateRepair = (newRepair: Omit<Repair, 'id'>) => handleAction(async () => {
    await db.createRepair(newRepair);
    addToast('New Manual Submission', 'New repair request created.', 'success');
  });
  const handleUpdateRepair = (updatedRepair: Repair) => handleAction(() => db.updateRepair(updatedRepair));
  const handleDeleteRepair = (repairId: string) => handleAction(() => db.deleteRepair(repairId));

  const handleCreateInventory = (newItem: Omit<InventoryItem, 'id'>) => handleAction(async () => {
    await db.createInventory(newItem);
    addToast('New Manual Submission', `Inventory item "${newItem.makeModel}" added.`, 'success');
  });
  const handleUpdateInventory = (updatedItem: InventoryItem) => handleAction(() => db.updateInventory(updatedItem));
  const handleDeleteInventory = (itemId: string) => handleAction(() => db.deleteInventory(itemId));

  const handleCreateSale = (newSale: Omit<Sale, 'id'>) => handleAction(async () => {
    await db.createSale(newSale);
    addToast('New Manual Submission', `Sale to "${newSale.buyerName}" recorded.`, 'success');
    const soldItem = inventory.find(i => i.id === newSale.itemId);
    if(soldItem) {
        await handleUpdateInventory({ ...soldItem, status: 'Sold' });
    }
  });

  const handleUpdateSale = (updatedSale: Sale) => handleAction(async () => {
    const originalSale = sales.find(s => s.id === updatedSale.id);
    await db.updateSale(updatedSale);

    if (originalSale && originalSale.itemId !== updatedSale.itemId) {
        const oldItem = inventory.find(i => i.id === originalSale.itemId);
        const newItem = inventory.find(i => i.id === updatedSale.itemId);
        if(oldItem) await handleUpdateInventory({ ...oldItem, status: 'Available' });
        if(newItem) await handleUpdateInventory({ ...newItem, status: 'Sold' });
    }
  });

  const handleDeleteSale = (saleId: string) => handleAction(async () => {
    const saleToDelete = sales.find(s => s.id === saleId);
    await db.deleteSale(saleId);
    if(saleToDelete) {
        const item = inventory.find(i => i.id === saleToDelete.itemId);
        if(item) await handleUpdateInventory({ ...item, status: 'Available' });
    }
  });

  const handleCreateVendor = (newVendor: Omit<Vendor, 'id'>) => handleAction(async () => {
    await db.createVendor(newVendor);
    addToast('New Manual Submission', `Vendor "${newVendor.vendorName}" added.`, 'success');
  });
  const handleUpdateVendor = (updatedVendor: Vendor) => handleAction(() => db.updateVendor(updatedVendor));
  const handleDeleteVendor = (vendorId: string) => handleAction(() => db.deleteVendor(vendorId));

  const handleUpdateSmsSettings = (settings: SmsSettings) => handleAction(async () => {
    await db.saveSmsSettings(settings);
    setSmsSettings(settings);
  });

  const handleUpdateNotificationSettings = (settings: NotificationSettings) => handleAction(async () => {
    await db.saveNotificationSettings(settings);
    setNotificationSettings(settings);
  });
  
  const handleUpdateAdminKey = (key: string) => handleAction(async () => {
    await db.saveAdminKey(key);
    setAdminKey(key);
    addToast('Success', 'Admin Registration Key updated successfully!', 'success');
  });
  
  if (appLoading) {
    return <Preloader splashLogo={splashLogo} />;
  }

  if (!currentUser) {
    return <Login adminKey={adminKey} splashLogo={splashLogo} addToast={addToast} initialError={loginError} />;
  }

  const isAdmin = currentUser.role === 'Admin';

  const getViewName = (view: AppView): string => {
    switch (view) {
      case AppView.Dashboard: return 'Dashboard';
      case AppView.Inventory: return 'Inventory Management';
      case AppView.Contacts: return 'Clients';
      case AppView.Rentals: return 'Rentals';
      case AppView.SalesLog: return 'Sales Log';
      case AppView.Repairs: return 'Repairs';
      case AppView.Notifications: return 'Notifications';
      case AppView.Reports: return 'Reports';
      case AppView.Vendors: return 'Vendor Management';
      case AppView.Users: return 'Users';
      case AppView.Settings: return 'Settings';
      case AppView.MonitorSite: return 'Site Monitoring Dashboard';
      case AppView.HtmlViewer: return 'HTML Viewer';
      default: return 'Dashboard';
    }
  };

  const renderView = () => {
    const adminOnlyViews = [AppView.Users, AppView.Settings, AppView.Notifications, AppView.Reports, AppView.MonitorSite, AppView.HtmlViewer];
    if (!isAdmin && adminOnlyViews.includes(currentView)) {
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} currentUser={currentUser} />;
    }

    switch (currentView) {
      case AppView.Dashboard:
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} currentUser={currentUser} />;
      case AppView.Inventory:
        return <Inventory inventory={inventory} vendors={vendors} currentUser={currentUser} onCreateItem={handleCreateInventory} onUpdateItem={handleUpdateInventory} onDeleteItem={handleDeleteInventory} addToast={addToast} adminKey={adminKey} />;
      case AppView.SalesLog:
        return <SalesLog sales={sales} inventory={inventory} currentUser={currentUser} onCreateSale={handleCreateSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} addToast={addToast} adminKey={adminKey} />;
      case AppView.Vendors:
        return <Vendors vendors={vendors} inventory={inventory} currentUser={currentUser} onCreateVendor={handleCreateVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} addToast={addToast} adminKey={adminKey} />;
      case AppView.Users:
        return <Users users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} addToast={addToast} adminKey={adminKey} />;
      case AppView.Contacts:
        return <Contacts contacts={contacts} currentUser={currentUser} onCreateContact={handleCreateContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} addToast={addToast} adminKey={adminKey} />;
      case AppView.Settings:
        return <Settings 
                    onUpdateLogo={handleUpdateLogo} 
                    currentLogo={appLogo} 
                    smsSettings={smsSettings} 
                    onUpdateSmsSettings={handleUpdateSmsSettings} 
                    adminKey={adminKey} 
                    onUpdateAdminKey={handleUpdateAdminKey}
                    currentSplashLogo={splashLogo}
                    onUpdateSplashLogo={handleUpdateSplashLogo}
                    addToast={addToast}
                    notificationSettings={notificationSettings}
                    onUpdateNotificationSettings={handleUpdateNotificationSettings}
                />;
      case AppView.Rentals:
        return <Rentals rentals={rentals} contacts={contacts} currentUser={currentUser} onCreateRental={handleCreateRental} onUpdateRental={handleUpdateRental} onDeleteRental={handleDeleteRental} addToast={addToast} adminKey={adminKey} />;
      case AppView.Repairs:
        return <Repairs repairs={repairs} contacts={contacts} currentUser={currentUser} onCreateRepair={handleCreateRepair} onUpdateRepair={handleUpdateRepair} onDeleteRepair={handleDeleteRepair} addToast={addToast} adminKey={adminKey} />;
      case AppView.Notifications:
        return <Notifications contacts={contacts} handleAction={handleAction} smsSettings={smsSettings} addToast={addToast} notificationSettings={notificationSettings} />;
      case AppView.Reports:
        return <Reports 
                    contacts={contacts} 
                    rentals={rentals} 
                    repairs={repairs} 
                    handleAction={handleAction} 
                    siteContacts={siteContacts}
                    siteRentals={siteRentals}
                    siteRepairs={siteRepairs}
                />;
      case AppView.MonitorSite:
        return <MonitorSite 
                    siteContacts={siteContacts} 
                    siteRentals={siteRentals} 
                    siteRepairs={siteRepairs} 
                    onUpdateStatus={handleUpdateFirebaseStatus} 
                    onDeleteSubmission={handleDeleteFirebaseSubmission}
                    adminKey={adminKey}
                    addToast={addToast}
                />;
      case AppView.HtmlViewer:
        return <HtmlViewer />;
      default:
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        {isActionLoading && <Spinner />}
    
        <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar currentView={currentView} setCurrentView={handleViewChange} onLogout={handleLogout} appLogo={appLogo} currentUser={currentUser} />
        </div>
    
        <div className="flex-1 flex flex-col min-w-0">
            <Header viewName={getViewName(currentView)} user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {renderView()}
            </main>
        </div>
    
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}
    </div>
  );
};

export default App;
