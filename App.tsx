import React, { useState, useEffect } from 'react';
import { AppView, User, Contact, Rental, Repair, SmsSettings, InventoryItem, Sale, Vendor } from './types';
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
import * as db from './utils/storage';
import Spinner from './components/Spinner';
import Notification from './components/Notification';

interface HeaderProps {
    viewName: string;
    user: User;
}

const Header: React.FC<HeaderProps> = ({ viewName, user }) => {
    return (
        <header className="bg-brand-light p-4 flex justify-between items-center border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-brand-text">{viewName}</h1>
            </div>
            <div className="flex items-center space-x-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                <div>
                    <p className="font-semibold text-brand-text">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
  const [appLoading, setAppLoading] = useState(true);
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
  const [smsSettings, setSmsSettings] = useState<SmsSettings>({ apiKey: '', senderId: '', endpointUrl: '' });
  const [adminKey, setAdminKey] = useState<string>('');
  
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const loadAppData = () => {
        try {
            setAppLoading(true);
            const loadedUsers = db.loadUsers();
            setUsers(loadedUsers);

            const currentUserId = db.getCurrentUserId();
            const appUser = currentUserId ? loadedUsers.find(u => u.id === currentUserId) : null;
            
            setAppLogo(db.loadAppLogo());
            setSplashLogo(db.loadSplashLogo());
            setAdminKey(db.loadAdminKey());

            if (appUser) {
                setCurrentUser(appUser);
                setContacts(db.loadContacts());
                setRentals(db.loadRentals());
                setRepairs(db.loadRepairs());
                setInventory(db.loadInventory());
                setSales(db.loadSales());
                setVendors(db.loadVendors());
                setSmsSettings(db.loadSmsSettings());
            }
        } catch (error) {
            console.error("Error loading app data from localStorage:", error);
            showNotification("Failed to load data. Your storage might be corrupted.");
        } finally {
            setTimeout(() => setAppLoading(false), 1000); // Simulate loading time
        }
    };
    
    loadAppData();
  }, []);
  
  const showNotification = (message: string) => {
    setNotification(message);
  };

  const handleAction = async (action: () => void | Promise<any>) => {
    setIsActionLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await action();
      return result;
    } catch (error) {
      console.error("An error occurred during the action:", error instanceof Error ? error.message : String(error));
      showNotification('An error occurred. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewChange = (view: AppView) => {
    if (view === currentView) return;
    handleAction(() => {
        setCurrentView(view);
    });
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    db.setCurrentUserId(user.id);
    handleViewChange(AppView.Dashboard);
    showNotification(`Welcome back, ${user.name}!`);
    // Reload all data for the logged-in user
    setContacts(db.loadContacts());
    setRentals(db.loadRentals());
    setRepairs(db.loadRepairs());
  };

  const handleRegisterSuccess = (user: User) => {
    const allUsers = [...users, user];
    setUsers(allUsers);
    setAdminKey(db.loadAdminKey());
    handleLogin(user);
  };

  const handleLogout = () => handleAction(() => {
    db.setCurrentUserId(null);
    setCurrentUser(null);
  });
  
  const handleCreateUser = (newUser: Omit<User, 'id'>) => handleAction(() => {
      const createdUser = db.createUser(newUser);
      setUsers(users => [...users, createdUser]);
  });
  
  const handleUpdateUser = (updatedUser: User) => handleAction(() => {
    db.updateUser(updatedUser);
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  });
  
  const handleDeleteUser = (userId: string) => handleAction(() => {
    db.deleteUser(userId);
    setUsers(users.filter(u => u.id !== userId));
  });

  const handleUpdateLogo = (logo: string | null) => handleAction(() => {
    db.saveAppLogo(logo);
    setAppLogo(logo);
  });

  const handleUpdateSplashLogo = (logo: string | null) => handleAction(() => {
    db.saveSplashLogo(logo);
    setSplashLogo(logo);
  });

  const handleCreateContact = (newContact: Omit<Contact, 'id'>) => handleAction(() => {
    const createdContact = db.createContact(newContact);
    setContacts([createdContact, ...contacts]);
  });
  
  const handleUpdateContact = (updatedContact: Contact) => handleAction(() => {
    db.updateContact(updatedContact);
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
  });
  
  const handleDeleteContact = (contactId: string) => handleAction(() => {
    db.deleteContact(contactId);
    setContacts(contacts.filter(c => c.id !== contactId));
  });

  const handleCreateRental = (newRental: Omit<Rental, 'id'>) => handleAction(() => {
    const createdRental = db.createRental(newRental);
    setRentals([createdRental, ...rentals]);
  });

  const handleUpdateRental = (updatedRental: Rental) => handleAction(() => {
    db.updateRental(updatedRental);
    setRentals(rentals.map(r => r.id === updatedRental.id ? updatedRental : r));
  });

  const handleDeleteRental = (rentalId: string) => handleAction(() => {
    db.deleteRental(rentalId);
    setRentals(rentals.filter(r => r.id !== rentalId));
  });

  const handleCreateRepair = (newRepair: Omit<Repair, 'id'>) => handleAction(() => {
    const createdRepair = db.createRepair(newRepair);
    setRepairs([createdRepair, ...repairs]);
  });

  const handleUpdateRepair = (updatedRepair: Repair) => handleAction(() => {
    db.updateRepair(updatedRepair);
    setRepairs(repairs.map(r => r.id === updatedRepair.id ? updatedRepair : r));
  });

  const handleDeleteRepair = (repairId: string) => handleAction(() => {
    db.deleteRepair(repairId);
    setRepairs(repairs.filter(r => r.id !== repairId));
  });

  const handleCreateInventory = (newItem: Omit<InventoryItem, 'id'>) => handleAction(() => {
    const createdItem = db.createInventory(newItem);
    setInventory([createdItem, ...inventory]);
  });

  const handleUpdateInventory = (updatedItem: InventoryItem) => handleAction(() => {
    db.updateInventory(updatedItem);
    setInventory(inventory => inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
  });

  const handleDeleteInventory = (itemId: string) => handleAction(() => {
    db.deleteInventory(itemId);
    setInventory(inventory.filter(i => i.id !== itemId));
  });

  const handleCreateSale = (newSale: Omit<Sale, 'id'>) => handleAction(() => {
    const createdSale = db.createSale(newSale);
    setSales(sales => [createdSale, ...sales]);
    const soldItem = inventory.find(i => i.id === newSale.itemId);
    if(soldItem) {
        handleUpdateInventory({ ...soldItem, status: 'Sold' });
    }
  });

  const handleUpdateSale = (updatedSale: Sale) => handleAction(() => {
    const originalSale = sales.find(s => s.id === updatedSale.id);
    db.updateSale(updatedSale);
    setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));

    if (originalSale && originalSale.itemId !== updatedSale.itemId) {
        const oldItem = inventory.find(i => i.id === originalSale.itemId);
        const newItem = inventory.find(i => i.id === updatedSale.itemId);
        if(oldItem) handleUpdateInventory({ ...oldItem, status: 'Available' });
        if(newItem) handleUpdateInventory({ ...newItem, status: 'Sold' });
    }
  });

  const handleDeleteSale = (saleId: string) => handleAction(() => {
    const saleToDelete = sales.find(s => s.id === saleId);
    db.deleteSale(saleId);
    setSales(sales.filter(s => s.id !== saleId));
    if(saleToDelete) {
        const item = inventory.find(i => i.id === saleToDelete.itemId);
        if(item) handleUpdateInventory({ ...item, status: 'Available' });
    }
  });

  const handleCreateVendor = (newVendor: Omit<Vendor, 'id'>) => handleAction(() => {
    const createdVendor = db.createVendor(newVendor);
    setVendors([createdVendor, ...vendors]);
  });

  const handleUpdateVendor = (updatedVendor: Vendor) => handleAction(() => {
    db.updateVendor(updatedVendor);
    setVendors(vendors.map(v => v.id === updatedVendor.id ? updatedVendor : v));
  });

  const handleDeleteVendor = (vendorId: string) => handleAction(() => {
    db.deleteVendor(vendorId);
    setVendors(vendors.filter(v => v.id !== vendorId));
  });

  const handleUpdateSmsSettings = (settings: SmsSettings) => handleAction(() => {
    db.saveSmsSettings(settings);
    setSmsSettings(settings);
  });
  
  const handleUpdateAdminKey = (key: string) => handleAction(() => {
    db.saveAdminKey(key);
    setAdminKey(key);
    showNotification('Admin Registration Key updated successfully!');
  });
  
  const handleRestoreData = (jsonData: string) => handleAction(() => {
      const result = db.restoreBackupData(jsonData);
      showNotification(result.message);
      if (result.success) {
          setTimeout(() => window.location.reload(), 2000);
      }
  });

  if (appLoading) {
    return <Preloader splashLogo={splashLogo} />;
  }

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} onRegisterSuccess={handleRegisterSuccess} adminKey={adminKey} splashLogo={splashLogo} />;
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
      default: return 'Dashboard';
    }
  };

  const renderView = () => {
    const adminOnlyViews = [AppView.Users, AppView.Settings, AppView.Notifications, AppView.Reports];
    if (!isAdmin && adminOnlyViews.includes(currentView)) {
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} />;
    }

    switch (currentView) {
      case AppView.Dashboard:
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} />;
      case AppView.Inventory:
        return <Inventory inventory={inventory} vendors={vendors} currentUser={currentUser} onCreateItem={handleCreateInventory} onUpdateItem={handleUpdateInventory} onDeleteItem={handleDeleteInventory} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.SalesLog:
        return <SalesLog sales={sales} inventory={inventory} currentUser={currentUser} onCreateSale={handleCreateSale} onUpdateSale={handleUpdateSale} onDeleteSale={handleDeleteSale} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.Vendors:
        return <Vendors vendors={vendors} inventory={inventory} currentUser={currentUser} onCreateVendor={handleCreateVendor} onUpdateVendor={handleUpdateVendor} onDeleteVendor={handleDeleteVendor} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.Users:
        return <Users users={users} currentUser={currentUser} onCreateUser={handleCreateUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.Contacts:
        return <Contacts contacts={contacts} currentUser={currentUser} onCreateContact={handleCreateContact} onUpdateContact={handleUpdateContact} onDeleteContact={handleDeleteContact} showNotification={showNotification} adminKey={adminKey} />;
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
                    showNotification={showNotification}
                    onRestoreData={handleRestoreData}
                />;
      case AppView.Rentals:
        return <Rentals rentals={rentals} contacts={contacts} currentUser={currentUser} onCreateRental={handleCreateRental} onUpdateRental={handleUpdateRental} onDeleteRental={handleDeleteRental} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.Repairs:
        return <Repairs repairs={repairs} contacts={contacts} currentUser={currentUser} onCreateRepair={handleCreateRepair} onUpdateRepair={handleUpdateRepair} onDeleteRepair={handleDeleteRepair} showNotification={showNotification} adminKey={adminKey} />;
      case AppView.Notifications:
        return <Notifications contacts={contacts} handleAction={handleAction} smsSettings={smsSettings} showNotification={showNotification} />;
      case AppView.Reports:
        return <Reports contacts={contacts} rentals={rentals} repairs={repairs} handleAction={handleAction} />;
      default:
        return <Dashboard contacts={contacts} rentals={rentals} repairs={repairs} users={users} />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {notification && <Notification message={notification} onClose={() => setNotification('')} />}
      {isActionLoading && <Spinner />}
      <Sidebar currentView={currentView} setCurrentView={handleViewChange} onLogout={handleLogout} appLogo={appLogo} currentUser={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header viewName={getViewName(currentView)} user={currentUser} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;