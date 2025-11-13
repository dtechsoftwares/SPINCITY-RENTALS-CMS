import { User, Contact, InventoryItem, Vendor, Rental, Repair, Sale, SmsSettings, NotificationSettings } from '../types';
import { db } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

// --- Collections ---
const COLLECTIONS = {
    USERS: 'users',
    CONTACTS: 'contacts',
    INVENTORY: 'inventory',
    VENDORS: 'vendors',
    RENTALS: 'rentals',
    REPAIRS: 'repairs',
    SALES: 'sales',
    SETTINGS: 'settings'
};

const SETTINGS_DOC_ID = 'main';

// --- Settings ---
const saveSetting = async (data: { [key: string]: any }): Promise<void> => {
    const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOC_ID);
    await setDoc(docRef, data, { merge: true });
};

export const saveAdminKey = (key: string) => saveSetting({ adminKey: key });
export const saveAppLogo = (logo: string | null) => saveSetting({ appLogo: logo });
export const saveSplashLogo = (logo: string | null) => saveSetting({ splashLogo: logo });
export const saveSmsSettings = (settings: SmsSettings) => saveSetting({ smsSettings: settings });
export const saveNotificationSettings = (settings: NotificationSettings) => saveSetting({ notificationSettings: settings });


// --- CRUD Operations ---

// Users
export const createUserProfile = async (uid: string, user: Omit<User, 'id' | 'password'>): Promise<void> => {
    await setDoc(doc(db, COLLECTIONS.USERS, uid), user);
};
export const updateUser = async (user: User): Promise<void> => {
    const { id, ...userData } = user;
    delete (userData as Partial<User>).password; // Ensure password is not stored in firestore
    await updateDoc(doc(db, COLLECTIONS.USERS, id), userData);
};
export const deleteUser = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
};


// Generic create, update, delete for other collections
const createDoc = async <T extends { id: string }>(collectionName: string, data: Omit<T, 'id'>): Promise<T> => {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { ...data, id: docRef.id } as T;
};

const updateDocData = async <T extends { id: string }>(collectionName: string, docData: T): Promise<void> => {
    const { id, ...data } = docData;
    await updateDoc(doc(db, collectionName, id), data);
};

const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, collectionName, id));
};

// Contacts
export const createContact = (contact: Omit<Contact, 'id'>) => createDoc<Contact>(COLLECTIONS.CONTACTS, contact);
export const updateContact = (contact: Contact) => updateDocData<Contact>(COLLECTIONS.CONTACTS, contact);
export const deleteContact = (id: string) => deleteDocument(COLLECTIONS.CONTACTS, id);

// Inventory
export const createInventory = (item: Omit<InventoryItem, 'id'>) => createDoc<InventoryItem>(COLLECTIONS.INVENTORY, item);
export const updateInventory = (item: InventoryItem) => updateDocData<InventoryItem>(COLLECTIONS.INVENTORY, item);
export const deleteInventory = (id: string) => deleteDocument(COLLECTIONS.INVENTORY, id);

// Rentals
export const createRental = (rental: Omit<Rental, 'id'>) => createDoc<Rental>(COLLECTIONS.RENTALS, rental);
export const updateRental = (rental: Rental) => updateDocData<Rental>(COLLECTIONS.RENTALS, rental);
export const deleteRental = (id: string) => deleteDocument(COLLECTIONS.RENTALS, id);

// Repairs
export const createRepair = (repair: Omit<Repair, 'id'>) => createDoc<Repair>(COLLECTIONS.REPAIRS, repair);
export const updateRepair = (repair: Repair) => updateDocData<Repair>(COLLECTIONS.REPAIRS, repair);
export const deleteRepair = (id: string) => deleteDocument(COLLECTIONS.REPAIRS, id);

// Sales
export const createSale = (sale: Omit<Sale, 'id'>) => createDoc<Sale>(COLLECTIONS.SALES, sale);
export const updateSale = (sale: Sale) => updateDocData<Sale>(COLLECTIONS.SALES, sale);
export const deleteSale = (id: string) => deleteDocument(COLLECTIONS.SALES, id);

// Vendors
export const createVendor = (vendor: Omit<Vendor, 'id'>) => createDoc<Vendor>(COLLECTIONS.VENDORS, vendor);
export const updateVendor = (vendor: Vendor) => updateDocData<Vendor>(COLLECTIONS.VENDORS, vendor);
export const deleteVendor = (id: string) => deleteDocument(COLLECTIONS.VENDORS, id);
