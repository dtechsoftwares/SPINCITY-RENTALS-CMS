
import { User, Contact, InventoryItem, Vendor, Rental, Repair, Sale, SmsSettings, NotificationSettings, LogEntry } from '../types';
import { db, auth } from './firebase';
import { 
    doc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    collection, 
    addDoc, 
    getDoc,
    getDocs,
    query,
    orderBy,
    onSnapshot
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Collections ---
const COLLECTIONS = {
    USERS: 'users',
    CONTACTS: 'contacts',
    INVENTORY: 'inventory',
    VENDORS: 'vendors',
    RENTALS: 'rentals',
    REPAIRS: 'repairs',
    SALES: 'sales',
    SETTINGS: 'settings',
    LOGS: 'activity_logs'
};

const SETTINGS_DOC_ID = 'private';
const PUBLIC_SETTINGS_DOC_ID = 'public';

// --- Settings ---
export const saveSetting = async (data: any, isPublic = false): Promise<void> => {
    const docId = isPublic ? PUBLIC_SETTINGS_DOC_ID : SETTINGS_DOC_ID;
    const path = `${COLLECTIONS.SETTINGS}/${docId}`;
    try {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, docId), data, { merge: true });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const saveAdminKey = async (key: string) => {
    await saveSetting({ admin_key: key });
    await saveSetting({ is_initialized: true }, true);
};
export const saveAppLogo = (logo: string | null) => saveSetting({ app_logo: logo }, true);
export const saveSplashLogo = (logo: string | null) => saveSetting({ splash_logo: logo }, true);
export const setInitialized = () => saveSetting({ is_initialized: true }, true);
export const saveSmsSettings = (settings: SmsSettings) => saveSetting({ sms_settings: settings });
export const saveNotificationSettings = (settings: NotificationSettings) => saveSetting({ notification_settings: settings });

// --- CRUD Operations ---

// Users
export const createUserProfile = async (uid: string, user: Omit<User, 'id' | 'password'>): Promise<void> => {
    const path = `${COLLECTIONS.USERS}/${uid}`;
    try {
        await setDoc(doc(db, COLLECTIONS.USERS, uid), user);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const updateUser = async (user: User): Promise<void> => {
    const { id, ...userData } = user;
    delete (userData as any).password;
    const path = `${COLLECTIONS.USERS}/${id}`;
    try {
        await updateDoc(doc(db, COLLECTIONS.USERS, id), userData);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const deleteUser = async (id: string): Promise<void> => {
    const path = `${COLLECTIONS.USERS}/${id}`;
    try {
        await deleteDoc(doc(db, COLLECTIONS.USERS, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

// Activity Logs
export const createLogEntry = async (log: Omit<LogEntry, 'id'>): Promise<void> => {
    const path = COLLECTIONS.LOGS;
    try {
        await addDoc(collection(db, COLLECTIONS.LOGS), log);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
    }
};

export const deleteLogEntry = async (id: string) => {
    const path = `${COLLECTIONS.LOGS}/${id}`;
    try {
        await deleteDoc(doc(db, COLLECTIONS.LOGS, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

// Generic Helpers
const createItem = async <T>(table: string, data: any): Promise<T> => {
    try {
        const docRef = await addDoc(collection(db, table), data);
        return { id: docRef.id, ...data } as T;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, table);
        throw error; // Should not reach here due to handleFirestoreError throwing
    }
};

const updateItem = async (table: string, data: any): Promise<void> => {
    const { id, ...updateData } = data;
    const path = `${table}/${id}`;
    try {
        await updateDoc(doc(db, table, id), updateData);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

const deleteItem = async (table: string, id: string): Promise<void> => {
    const path = `${table}/${id}`;
    try {
        await deleteDoc(doc(db, table, id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

// Contacts
export const createContact = (contact: Omit<Contact, 'id'>) => createItem<Contact>(COLLECTIONS.CONTACTS, contact);
export const updateContact = (contact: Contact) => updateItem(COLLECTIONS.CONTACTS, contact);
export const deleteContact = (id: string) => deleteItem(COLLECTIONS.CONTACTS, id);

// Inventory
export const createInventory = (item: Omit<InventoryItem, 'id'>) => createItem<InventoryItem>(COLLECTIONS.INVENTORY, item);
export const updateInventory = (item: InventoryItem) => updateItem(COLLECTIONS.INVENTORY, item);
export const deleteInventory = (id: string) => deleteItem(COLLECTIONS.INVENTORY, id);

// Rentals
export const createRental = (rental: Omit<Rental, 'id'>) => createItem<Rental>(COLLECTIONS.RENTALS, rental);
export const updateRental = (rental: Rental) => updateItem(COLLECTIONS.RENTALS, rental);
export const deleteRental = (id: string) => deleteItem(COLLECTIONS.RENTALS, id);

// Repairs
export const createRepair = (repair: Omit<Repair, 'id'>) => createItem<Repair>(COLLECTIONS.REPAIRS, repair);
export const updateRepair = (repair: Repair) => updateItem(COLLECTIONS.REPAIRS, repair);
export const deleteRepair = (id: string) => deleteItem(COLLECTIONS.REPAIRS, id);

// Sales
export const createSale = (sale: Omit<Sale, 'id'>) => createItem<Sale>(COLLECTIONS.SALES, sale);
export const updateSale = (sale: Sale) => updateItem(COLLECTIONS.SALES, sale);
export const deleteSale = (id: string) => deleteItem(COLLECTIONS.SALES, id);

// Vendors
export const createVendor = (vendor: Omit<Vendor, 'id'>) => createItem<Vendor>(COLLECTIONS.VENDORS, vendor);
export const updateVendor = (vendor: Vendor) => updateItem(COLLECTIONS.VENDORS, vendor);
export const deleteVendor = (id: string) => deleteItem(COLLECTIONS.VENDORS, id);
