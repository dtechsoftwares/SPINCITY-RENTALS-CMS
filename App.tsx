
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
import * as db from './utils/storage';
import { auth, db as firestoreDb } from './utils/firebase';
import { collection, doc, onSnapshot, query, orderBy, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Spinner from './components/Spinner';
import ToastContainer, { ToastMessage } from './components/Toasts';

// EmailJS Config
const EMAILJS_CONFIG = {
    PUBLIC_KEY: "Jil8e_qWbBah38tVF", // Updated Public Key
    SERVICE_ID: "service_1eklhb5", // Service for CMS/Activity Logs
    LOG_TEMPLATE_ID: "template_71508un"    // Template for Activity Logs
};

interface HeaderProps {
    viewName: string;
    user: User;
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewName, user, onMenuClick }) => {
    return (
        <header className="bg-brand-light p-4 flex justify-between items-center border-b border-gray-200 flex-shrink-0 print:hidden">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="md:hidden text-brand-text p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <h1 className="text-xl font-bold text-brand-text">{viewName}</h1>
            </div>
            <div className="flex items-center space-x-3">
                <img src={user.avatar} alt="User Avatar" className="w-10 h-10 rounded-full object-cover" />
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
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

  useEffect(() => {
    // Initialize EmailJS using window object to ensure it's loaded from CDN
    const win = window as any;
    if (win.emailjs) {
        win.emailjs.init({
             publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
        });
    }
  }, []);

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

  // Centralized Logging and Notification Logic
  const handleLogAction = useCallback(async (
      actionType: 'CREATE' | 'UPDATE' | 'DELETE', 
      entity: string, 
      details: string, 
      actionPromise: Promise<void>
  ) => {
      try {
          await actionPromise; // Wait for the actual action to complete first

          if (!currentUser) return;

          const logData = {
              timestamp: new Date().toISOString(),
              adminName: currentUser.name,
              adminEmail: currentUser.email,
              actionType,
              entity,
              details
          };

          // 1. Save log to Firestore
          await db.createLogEntry(logData);

          // 2. Send Email Notification
          const emailJS = (window as any).emailjs;
          
          if (emailJS) {
              // Prepare robust parameters for the template
              const templateParams = {
                to_email: 'developer@dtechsoftwares.com',
                email: 'developer@dtechsoftwares.com', // For backward compatibility with some templates
                to_name: 'Developer',
                
                from_name: currentUser.name,
                from_email: currentUser.email,
                
                subject: `[CMS Log] ${actionType} ${entity}`,
                
                action_type: actionType,
                entity: entity,
                admin_name: currentUser.name,
                admin_email: currentUser.email,
                timestamp: new Date().toLocaleString(),
                details: details,
                message: details // Some templates might use 'message' instead of 'details'
            };

            // Explicitly pass public key as 4th arg to ensure correct auth context
            emailJS.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.LOG_TEMPLATE_ID, templateParams, EMAILJS_CONFIG.PUBLIC_KEY)
                .then((response: any) => {
                    console.log("Log email sent successfully", response.status, response.text);
                })
                .catch((error: any) => {
                    console.error("FULL EmailJS Error Object:", error);
                    
                    let errorInfo = "Unknown error";
                    if (error) {
                         if (error.text) {
                             errorInfo = `EmailJS Error: ${error.text} (Status: ${error.status})`;
                         } else if (error.message) {
                             errorInfo = error.message;
                         } else if (typeof error === 'string') {
                             errorInfo = error;
                         } else {
                             try {
                                 const json = JSON.stringify(error);
                                 if (json !== '{}') errorInfo = json;
                                 else errorInfo = String(error);
                             } catch (e) {
                                 errorInfo = "Non-serializable error object";
                             }
                         }
                    }

                    addToast('Email Log Failed', `Log saved, but email failed: ${errorInfo}`, 'error');
                });
          } else {
              console.warn("EmailJS library not loaded or found on window object.");
          }

      } catch (error) {
          console.error("Error logging action or sending email:", error);
          addToast('Action Failed', 'The database operation could not be completed.', 'error');
      }
  }, [currentUser, addToast]);


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

    const authUnsubscriber = auth.onAuthStateChanged(async (authUser: any) => {
        // Unsubscribe from any existing data listeners
        unsubscribers.forEach(unsub => unsub());
        setUnsubscribers([]);

        if (authUser) {
            const userDocRef = doc(firestoreDb, 'users', authUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                setLoginError('');
                const userData = { id: userDocSnap.id, ...userDocSnap.data() } as User;
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
                    activity_logs: { setter: setLogs, orderByField: 'timestamp', orderDirection: 'desc' }
                };

                Object.entries(collectionsToSubscribe).forEach(([collectionName, config]) => {
                    const q = query(collection(firestoreDb, collectionName), orderBy(config.orderByField, config.orderDirection || 'asc'));
                    const unsub = onSnapshot(q, (snapshot) => {
                        const data = snapshot.docs.map((doc) => {
                            const plainData = doc.data();
                            return { id: doc.id, ...plainData };
                        });
                        config.setter(data as any);
                    });
                    newUnsubscribers.push(unsub);
                });
                
                // Initialize site monitoring for ALL logged-in users
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
            [setUsers, setContacts, setRentals, setRepairs, setInventory, setSales, setVendors, setSiteContacts, setSiteRentals, setSiteRepairs, setLogs].forEach(setter => setter([]));
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
        const timer = setTimeout(() => {
            setSettingsLoaded(true);
        }, 6000); 
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
                  const newContact = { id: change.doc.id, ...change.doc.data(), type: 'contact' } as SiteContact;
                  addToast('New Site Submission', `Contact form from ${newContact.name}`, 'success');
              }
          });
          initialLoad.current.contacts = false;
          
          const fullData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'contact' })) as SiteContact[];
          setSiteContacts(fullData);
      }));

      const rentalsQuery = query(collection(firestoreDb, 'rentalAgreements'), orderBy('timestamp', 'desc'));
      currentUnsubscribers.push(onSnapshot(rentalsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              const docId = change.doc.id;
              if (change.type === 'added' && !initialLoad.current.rentals && !processedDocIds.current.has(docId)) {
                  processedDocIds.current.add(docId);
                  const newRental = { id: change.doc.id, ...change.doc.data(), type: 'rental' } as SiteRental;
                  addToast('New Site Submission', `Rental agreement from ${newRental.renter_name}`, 'success');
              }
          });
          initialLoad.current.rentals = false;

          const fullData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'rental' })) as SiteRental[];
          setSiteRentals(fullData);
      }));

      const repairsQuery = query(collection(firestoreDb, 'repairRequests'), orderBy('submissionDate', 'desc'));
      currentUnsubscribers.push(onSnapshot(repairsQuery, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
              const docId = change.doc.id;
              if (change.type === 'added' && !initialLoad.current.repairs && !processedDocIds.current.has(docId)) {
                  processedDocIds.current.add(docId);
                  const newRepair = { id: change.doc.id, ...change.doc.data(), type: 'repair' } as SiteRepair;
                  addToast('New Site Submission', `Repair request from ${newRepair.customerName}`, 'success');
              }
          });
          initialLoad.current.repairs = false;
          
          const fullData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'repair' })) as SiteRepair[];
          setSiteRepairs(fullData);
      }));
  };

  const handleUpdateFirebaseStatus = (id: string, type: 'contact' | 'rental' | 'repair', newStatus: 'new' | 'pending' | 'completed') => {
    let collectionName = '';
    if (type === 'contact') collectionName = 'contactSubmissions';
    else if (type === 'rental') collectionName = 'rentalAgreements';
    else if (type === 'repair') collectionName = 'repairRequests';
    else return;

    const action = handleAction(() => updateDoc(doc(firestoreDb, collectionName, id), { status: newStatus }));
    handleLogAction('UPDATE', 'Site Submission', `Updated status of ${type} (ID: ${id}) to ${newStatus}`, action as Promise<void>);
    
    action.then(() => addToast('Success', `Status updated to ${newStatus}.`, 'success'))
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

    const action = handleAction(() => deleteDoc(doc(firestoreDb, collectionName, id)));
    handleLogAction('DELETE', 'Site Submission', `Deleted ${type} submission (ID: ${id})`, action as Promise<void>);

    action.then(() => addToast('Success', `Submission deleted successfully.`, 'success'))
          .catch((error) => {
            console.error("Error deleting submission: ", error);
            addToast('Error', "Failed to delete submission.", 'error');
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
  
  const handleUpdateUser = (updatedUser: User) => {
      const action = handleAction(() => db.updateUser(updatedUser));
      handleLogAction('UPDATE', 'User', `Updated user ${updatedUser.name} (${updatedUser.email})`, action as Promise<void>);
  };
  
  const handleDeleteUser = (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      const action = handleAction(() => db.deleteUser(userId));
      handleLogAction('DELETE', 'User', `Deleted user ${userToDelete?.name || userId}`, action as Promise<void>);
  };

  const handleUpdateLogo = (logo: string | null) => {
      const action = handleAction(async () => { await db.saveAppLogo(logo); setAppLogo(logo); });
      handleLogAction('UPDATE', 'Settings', 'Updated Application Logo', action as Promise<void>);
  };

  const handleUpdateSplashLogo = (logo: string | null) => {
      const action = handleAction(async () => { await db.saveSplashLogo(logo); setSplashLogo(logo); });
      handleLogAction('UPDATE', 'Settings', 'Updated Splash Screen Logo', action as Promise<void>);
  };

  const handleCreateContact = (newContact: Omit<Contact, 'id'>) => {
      const action = handleAction(async () => {
        await db.createContact(newContact);
        addToast('New Manual Submission', `Client "${newContact.fullName}" created.`, 'success');
      });
      handleLogAction('CREATE', 'Client', `Created client ${newContact.fullName}`, action as Promise<void>);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
      const action = handleAction(() => db.updateContact(updatedContact));
      handleLogAction('UPDATE', 'Client', `Updated client ${updatedContact.fullName}`, action as Promise<void>);
  };

  const handleDeleteContact = (contactId: string) => {
      const contactToDelete = contacts.find(c => c.id === contactId);
      const action = handleAction(() => db.deleteContact(contactId));
      handleLogAction('DELETE', 'Client', `Deleted client ${contactToDelete?.fullName || contactId}`, action as Promise<void>);
  };

  const handleCreateRental = (newRental: Omit<Rental, 'id'>) => {
      const contactName = contacts.find(c => c.id === newRental.contactId)?.fullName || 'Unknown';
      const action = handleAction(async () => {
        await db.createRental(newRental);
        addToast('New Manual Submission', 'New rental agreement created.', 'success');
      });
      handleLogAction('CREATE', 'Rental', `Created rental for ${contactName}`, action as Promise<void>);
  };

  const handleUpdateRental = (updatedRental: Rental) => {
      const action = handleAction(() => db.updateRental(updatedRental));
      handleLogAction('UPDATE', 'Rental', `Updated rental ${updatedRental.id}`, action as Promise<void>);
  };

  const handleDeleteRental = (rentalId: string) => {
      const action = handleAction(() => db.deleteRental(rentalId));
      handleLogAction('DELETE', 'Rental', `Deleted rental ${rentalId}`, action as Promise<void>);
  };

  const handleCreateRepair = (newRepair: Omit<Repair, 'id'>) => {
      const contactName = contacts.find(c => c.id === newRepair.contactId)?.fullName || 'Unknown';
      const action = handleAction(async () => {
        await db.createRepair(newRepair);
        addToast('New Manual Submission', 'New repair request created.', 'success');
      });
      handleLogAction('CREATE', 'Repair', `Created repair request for ${contactName}`, action as Promise<void>);
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
      const action = handleAction(async () => {
        await db.createInventory(newItem);
        addToast('New Manual Submission', `Inventory item "${newItem.makeModel}" added.`, 'success');
      });
      handleLogAction('CREATE', 'Inventory', `Added ${newItem.itemType}: ${newItem.makeModel} (SN: ${newItem.serialNumber})`, action as Promise<void>);
  };

  const handleUpdateInventory = (updatedItem: InventoryItem) => {
      const action = handleAction(() => db.updateInventory(updatedItem));
      handleLogAction('UPDATE', 'Inventory', `Updated item ${updatedItem.makeModel} (SN: ${updatedItem.serialNumber})`, action as Promise<void>);
  };

  const handleDeleteInventory = (itemId: string) => {
      const itemToDelete = inventory.find(i => i.id === itemId);
      const action = handleAction(() => db.deleteInventory(itemId));
      handleLogAction('DELETE', 'Inventory', `Deleted item ${itemToDelete?.makeModel || itemId}`, action as Promise<void>);
  };

  const handleCreateSale = (newSale: Omit<Sale, 'id'>) => {
      const action = handleAction(async () => {
        await db.createSale(newSale);
        addToast('New Manual Submission', `Sale to "${newSale.buyerName}" recorded.`, 'success');
        const soldItem = inventory.find(i => i.id === newSale.itemId);
        if(soldItem) {
            await db.updateInventory({ ...soldItem, status: 'Sold' });
        }
      });
      handleLogAction('CREATE', 'Sale', `Recorded sale ${newSale.saleId} to ${newSale.buyerName}`, action as Promise<void>);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
      const action = handleAction(() => db.updateSale(updatedSale));
      handleLogAction('UPDATE', 'Sale', `Updated sale ${updatedSale.saleId}`, action as Promise<void>);
  };

  const handleDeleteSale = (saleId: string) => {
      const saleToDelete = sales.find(s => s.id === saleId);
      const action = handleAction(async () => {
          await db.deleteSale(saleId);
          // Optionally revert item status, but business logic might vary. Keeping simple for now.
          if (saleToDelete) {
              const soldItem = inventory.find(i => i.id === saleToDelete.itemId);
              if (soldItem) {
                  await db.updateInventory({ ...soldItem, status: 'Available' });
              }
          }
      });
      handleLogAction('DELETE', 'Sale', `Deleted sale ${saleToDelete?.saleId || saleId}`, action as Promise<void>);
  };

  const handleCreateVendor = (newVendor: Omit<Vendor, 'id'>) => {
      const action = handleAction(async () => {
        await db.createVendor(newVendor);
        addToast('New Manual Submission', `Vendor "${newVendor.vendorName}" added.`, 'success');
      });
      handleLogAction('CREATE', 'Vendor', `Created vendor ${newVendor.vendorName}`, action as Promise<void>);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
      const action = handleAction(() => db.updateVendor(updatedVendor));
      handleLogAction('UPDATE', 'Vendor', `Updated vendor ${updatedVendor.vendorName}`, action as Promise<void>);
  };

  const handleDeleteVendor = (vendorId: string) => {
      const vendorToDelete = vendors.find(v => v.id === vendorId);
      const action = handleAction(() => db.deleteVendor(vendorId));
      handleLogAction('DELETE', 'Vendor', `Deleted vendor ${vendorToDelete?.vendorName || vendorId}`, action as Promise<void>);
  };
  
  const handleUpdateSmsSettings = (settings: SmsSettings) => {
      const action = handleAction(async () => {
          await db.saveSmsSettings(settings);
          setSmsSettings(settings);
      });
      handleLogAction('UPDATE', 'Settings', 'Updated Twilio SMS Settings', action as Promise<void>);
  };

  const handleUpdateAdminKey = (key: string) => {
      const action = handleAction(async () => {
          await db.saveAdminKey(key);
          setAdminKey(key);
          addToast('Success', 'Admin Key updated successfully.', 'success');
      });
      handleLogAction('UPDATE', 'Settings', 'Updated Admin Registration Key', action as Promise<void>);
  };

  const handleUpdateNotificationSettings = (settings: NotificationSettings) => {
      const action = handleAction(async () => {
          await db.saveNotificationSettings(settings);
          setNotificationSettings(settings);
      });
      // No log for this to avoid spamming logs when toggling
  };

  const handleDeleteLog = (logId: string) => {
      const action = handleAction(() => db.deleteLogEntry(logId));
      handleLogAction('DELETE', 'Activity Log', `Deleted log entry ${logId}`, action as Promise<void>);
  };

  // Render logic
  if (!authChecked || !isSettingsInitialised || !settingsLoaded) {
    return (
        <>
            <Preloader splashLogo={splashLogo} />
            <div className="fixed bottom-4 right-4 text-xs text-white z-[10000]">v1.1</div>
        </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <Login adminKey={adminKey} splashLogo={splashLogo} addToast={addToast} initialError={loginError} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans print:h-auto print:block">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden print:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 md:z-0 flex flex-col h-full print:hidden`}>
        <Sidebar 
            currentView={currentView} 
            setCurrentView={handleViewChange} 
            onLogout={handleLogout}
            appLogo={appLogo}
            currentUser={currentUser}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative print:block print:h-auto print:overflow-visible">
        <Header viewName={currentView === AppView.MonitorSite ? 'Site Monitor' : AppView[currentView]} user={currentUser} onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative print:h-auto print:overflow-visible">
          {currentView === AppView.Dashboard && <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} currentUser={currentUser} />}
          {currentView === AppView.Users && <Users users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Contacts && <Contacts contacts={contacts} currentUser={currentUser} onCreateContact={handleCreateContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Rentals && <Rentals rentals={rentals} contacts={contacts} currentUser={currentUser} onCreateRental={handleCreateRental} onUpdateRental={handleUpdateRental} onDeleteRental={handleDeleteRental} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Repairs && <Repairs repairs={repairs} contacts={contacts} currentUser={currentUser} onCreateRepair={handleCreateRepair} onUpdateRepair={handleUpdateRepair} onDeleteRepair={handleDeleteRepair} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Inventory && <Inventory inventory={inventory} vendors={vendors} currentUser={currentUser} onCreateItem={handleCreateInventory} onUpdateItem={handleUpdateInventory} onDeleteItem={handleDeleteInventory} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.SalesLog && <SalesLog sales={sales} inventory={inventory} currentUser={currentUser} onCreateSale={handleCreateSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Vendors && <Vendors vendors={vendors} inventory={inventory} currentUser={currentUser} onCreateVendor={handleCreateVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} addToast={addToast} adminKey={adminKey} />}
          {currentView === AppView.Notifications && <Notifications contacts={contacts} smsSettings={smsSettings} notificationSettings={notificationSettings} handleAction={handleAction} addToast={addToast} />}
          {currentView === AppView.Reports && <Reports contacts={contacts} rentals={rentals} repairs={repairs} siteContacts={siteContacts} siteRentals={siteRentals} siteRepairs={siteRepairs} handleAction={handleAction} />}
          {currentView === AppView.MonitorSite && <MonitorSite siteContacts={siteContacts} siteRentals={siteRentals} siteRepairs={siteRepairs} onUpdateStatus={handleUpdateFirebaseStatus} onDeleteSubmission={handleDeleteFirebaseSubmission} adminKey={adminKey} addToast={addToast} />}
          {currentView === AppView.HtmlViewer && <HtmlViewer />}
          {currentView === AppView.ActivityLogs && <ActivityLogs logs={logs} onDeleteLog={handleDeleteLog} adminKey={adminKey} addToast={addToast} />}
          
          {currentView === AppView.Settings && (
              <Settings 
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
              />
          )}
        </main>
        
        {isActionLoading && <Spinner />}
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default App;
