import { User, Contact, InventoryItem, Vendor, Rental, Repair, Sale, SmsSettings } from '../types';

const get = <T>(key: string, fallback: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return fallback;
    }
};

const set = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting ${key} in localStorage`, error);
    }
};

const newId = () => new Date().getTime().toString();

// --- Keys ---
const KEYS = {
    USERS: 'spincity_users',
    CONTACTS: 'spincity_contacts',
    INVENTORY: 'spincity_inventory',
    VENDORS: 'spincity_vendors',
    RENTALS: 'spincity_rentals',
    REPAIRS: 'spincity_repairs',
    SALES: 'spincity_sales',
    CURRENT_USER_ID: 'spincity_currentUserId',
    ADMIN_KEY: 'spincity_adminKey',
    APP_LOGO: 'spincity_appLogo',
    SPLASH_LOGO: 'spincity_splashLogo',
    SMS_SETTINGS: 'spincity_smsSettings',
};

// --- Data Loaders ---
export const loadUsers = () => get<User[]>(KEYS.USERS, []);
export const loadContacts = () => get<Contact[]>(KEYS.CONTACTS, []);
export const loadInventory = () => get<InventoryItem[]>(KEYS.INVENTORY, []);
export const loadVendors = () => get<Vendor[]>(KEYS.VENDORS, []);
export const loadRentals = () => get<Rental[]>(KEYS.RENTALS, []);
export const loadRepairs = () => get<Repair[]>(KEYS.REPAIRS, []);
export const loadSales = () => get<Sale[]>(KEYS.SALES, []);

// --- Session & Settings Loaders/Savers ---
export const getCurrentUserId = () => get<string | null>(KEYS.CURRENT_USER_ID, null);
export const setCurrentUserId = (id: string | null) => set(KEYS.CURRENT_USER_ID, id);
export const loadAdminKey = () => get<string>(KEYS.ADMIN_KEY, '');
export const saveAdminKey = (key: string) => set(KEYS.ADMIN_KEY, key);
export const loadAppLogo = () => get<string | null>(KEYS.APP_LOGO, null);
export const saveAppLogo = (logo: string | null) => set(KEYS.APP_LOGO, logo);
export const loadSplashLogo = () => get<string | null>(KEYS.SPLASH_LOGO, null);
export const saveSplashLogo = (logo: string | null) => set(KEYS.SPLASH_LOGO, logo);
export const loadSmsSettings = () => get<SmsSettings>(KEYS.SMS_SETTINGS, { apiKey: '', senderId: '', endpointUrl: '' });
export const saveSmsSettings = (settings: SmsSettings) => set(KEYS.SMS_SETTINGS, settings);


// --- CRUD Operations ---

// Users
export const createUser = (user: Omit<User, 'id'>): User => {
    const users = loadUsers();
    const newUser = { ...user, id: newId() };
    set(KEYS.USERS, [...users, newUser]);
    return newUser;
};
export const updateUser = (user: User) => {
    set(KEYS.USERS, loadUsers().map(u => u.id === user.id ? user : u));
};
export const deleteUser = (id: string) => {
    set(KEYS.USERS, loadUsers().filter(u => u.id !== id));
};

// Contacts
export const createContact = (contact: Omit<Contact, 'id'>): Contact => {
    const newContact = { ...contact, id: newId() };
    set(KEYS.CONTACTS, [newContact, ...loadContacts()]);
    return newContact;
};
export const updateContact = (contact: Contact) => {
    set(KEYS.CONTACTS, loadContacts().map(c => c.id === contact.id ? contact : c));
};
export const deleteContact = (id: string) => {
    set(KEYS.CONTACTS, loadContacts().filter(c => c.id !== id));
};

// Inventory
export const createInventory = (item: Omit<InventoryItem, 'id'>): InventoryItem => {
    const newItem = { ...item, id: newId() };
    set(KEYS.INVENTORY, [newItem, ...loadInventory()]);
    return newItem;
};
export const updateInventory = (item: InventoryItem) => {
    set(KEYS.INVENTORY, loadInventory().map(i => i.id === item.id ? item : i));
};
export const deleteInventory = (id: string) => {
    set(KEYS.INVENTORY, loadInventory().filter(i => i.id !== id));
};

// Rentals
export const createRental = (rental: Omit<Rental, 'id'>): Rental => {
    const newRental = { ...rental, id: newId() };
    set(KEYS.RENTALS, [newRental, ...loadRentals()]);
    return newRental;
};
export const updateRental = (rental: Rental) => {
    set(KEYS.RENTALS, loadRentals().map(r => r.id === rental.id ? rental : r));
};
export const deleteRental = (id: string) => {
    set(KEYS.RENTALS, loadRentals().filter(r => r.id !== id));
};

// Repairs
export const createRepair = (repair: Omit<Repair, 'id'>): Repair => {
    const newRepair = { ...repair, id: newId() };
    set(KEYS.REPAIRS, [newRepair, ...loadRepairs()]);
    return newRepair;
};
export const updateRepair = (repair: Repair) => {
    set(KEYS.REPAIRS, loadRepairs().map(r => r.id === repair.id ? repair : r));
};
export const deleteRepair = (id: string) => {
    set(KEYS.REPAIRS, loadRepairs().filter(r => r.id !== id));
};

// Sales
export const createSale = (sale: Omit<Sale, 'id'>): Sale => {
    const newSale = { ...sale, id: newId() };
    set(KEYS.SALES, [newSale, ...loadSales()]);
    return newSale;
};
export const updateSale = (sale: Sale) => {
    set(KEYS.SALES, loadSales().map(s => s.id === sale.id ? sale : s));
};
export const deleteSale = (id: string) => {
    set(KEYS.SALES, loadSales().filter(s => s.id !== id));
};

// Vendors
export const createVendor = (vendor: Omit<Vendor, 'id'>): Vendor => {
    const newVendor = { ...vendor, id: newId() };
    set(KEYS.VENDORS, [newVendor, ...loadVendors()]);
    return newVendor;
};
export const updateVendor = (vendor: Vendor) => {
    set(KEYS.VENDORS, loadVendors().map(v => v.id === vendor.id ? vendor : v));
};
export const deleteVendor = (id: string) => {
    set(KEYS.VENDORS, loadVendors().filter(v => v.id !== id));
};

// --- Backup & Restore ---
export const getBackupData = (): string => {
    const backupData: { [key: string]: any } = {};
    Object.values(KEYS).forEach(key => {
        if (key !== KEYS.CURRENT_USER_ID) { // Don't back up session
            backupData[key] = get(key, null);
        }
    });
    return JSON.stringify(backupData, null, 2);
};

export const restoreBackupData = (jsonData: string): { success: boolean, message: string } => {
    try {
        const backupData = JSON.parse(jsonData);
        let restoredKeys = 0;
        Object.values(KEYS).forEach(key => {
            if (key in backupData) {
                set(key, backupData[key]);
                restoredKeys++;
            }
        });
        if (restoredKeys === 0) {
            return { success: false, message: "Invalid backup file: No matching data found." };
        }
        return { success: true, message: "Data restored successfully! The application will now reload." };
    } catch (error) {
        console.error("Restore failed:", error);
        return { success: false, message: "Restore failed. The backup file may be corrupted." };
    }
};