export enum AppView {
  Dashboard,
  Inventory,
  Contacts,
  Rentals,
  SalesLog,
  Repairs,
  Users,
  Notifications,
  Reports,
  Vendors,
  Settings,
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'User';
  avatar: string;
}

export const ContactPlans = [
    '6-Month Flex Plan ($59.99/month)',
    '12-Month Smart Plan ($49.99/month)',
    '24-Month Value Plan ($39.99/month)',
    'Not sure, need advice',
] as const;
export type ContactPlan = typeof ContactPlans[number];

export const HookupTypes = [
    'Electric Dryer Hookup',
    'Gas Dryer Hookup',
    'Not sure',
] as const;
export type HookupType = typeof HookupTypes[number];

export interface Contact {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  plan: ContactPlan;
  hookupType: HookupType;
  notes?: string;
  createdAt: string; // 'YYYY-MM-DD'
}

export const RentalPlans = {
  '24-Month Value Plan': 39.99,
  '12-Month Smart Plan': 49.99,
  '6-Month Flex Plan': 59.99,
};
export type RentalPlan = keyof typeof RentalPlans;

export const MaintenanceOptions = ['Maintenance Plan', 'Self-Maintenance'] as const;
export type MaintenanceOption = typeof MaintenanceOptions[number];

export const RentalStatuses = ['Active', 'Pending Signature', 'Terminated'] as const;
export type RentalStatus = typeof RentalStatuses[number];

export const DeliveryPaymentOptions = [
    'Pay the full $55 delivery and installation fee at time of installation',
    'Spread the fee over 3 monthly payments of $18.33',
] as const;
export type DeliveryPaymentOption = typeof DeliveryPaymentOptions[number];

export interface Rental {
    id: string;
    contactId: string;
    plan: RentalPlan;
    maintenanceOption: MaintenanceOption;
    status: RentalStatus;
    startDate: string; // 'YYYY-MM-DD'
    monthlyRate: number;
    rentalPropertyAddress: string;
    emergencyContactFullName: string;
    emergencyContactRelationship: string;
    emergencyContactAddress: string;
    emergencyContactEmail: string;
    emergencyContactPhone: string;
    deliveryPaymentOption: DeliveryPaymentOption;
    ackPaymentTerms: boolean;
    ackRelocationTerms: boolean;
    ackAdditionalTerms: boolean;
    renterPrintedName: string;
    digitalSignature: string;
}


export const Appliances = ['Washing Machine', 'Dryer', 'Washer/Dryer Combo'] as const;
export type Appliance = typeof Appliances[number];

export const UrgencyLevels = ['High', 'Low'] as const;
export type UrgencyLevel = typeof UrgencyLevels[number];

export const RepairStatuses = ['Open', 'In Progress', 'Completed', 'Cancelled'] as const;
export type RepairStatus = typeof RepairStatuses[number];

export const IssueTypes = [
    'Not starting',
    'Making strange noises',
    'Leaking water',
    'Not heating/drying',
    'Not spinning',
    'Error code on display',
    'Other',
] as const;
export type IssueType = typeof IssueTypes[number];

export const PreferredTimesOfDay = [
    'Any time',
    'Morning (8am - 12pm)',
    'Afternoon (12pm - 5pm)',
] as const;
export type PreferredTimeOfDay = typeof PreferredTimesOfDay[number];


export interface Repair {
    id: string;
    contactId: string;
    appliance: Appliance;
    issueDescription: string;
    status: RepairStatus;
    reportedDate: string; // 'YYYY-MM-DD'
    accountNumber?: string;
    serviceAddress: string;
    city: string;
    zipCode: string;
    issueType: IssueType;
    errorCodes?: string;
    urgency: UrgencyLevel;
    preferredServiceDate?: string;
    preferredTimeOfDay: PreferredTimeOfDay;
    imageUrls?: string[];
    additionalInfo?: string;
    accessInstructions?: string;
    scheduledDate?: string; 
    notes?: string;
}

export interface SmsSettings {
    apiKey: string;
    senderId: string;
    endpointUrl: string;
}

export interface Vendor {
    id: string;
    vendorId: string;
    vendorName: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    website?: string;
    notes?: string;
}

export const InventoryItemTypes = ['Washer', 'Dryer', 'Electric Stove', 'Refrigerator', 'Washer/Dryer Combo'] as const;
export type InventoryItemType = typeof InventoryItemTypes[number];

export const InventoryConditions = ['New', 'Used', 'Refurbished'] as const;
export type InventoryCondition = typeof InventoryConditions[number];

export const InventoryStatuses = ['Available', 'Rented', 'In Repair', 'Sold', 'Decommissioned'] as const;
export type InventoryStatus = typeof InventoryStatuses[number];

export interface InventoryItem {
    id: string;
    purchaseId: string;
    purchaseDate: string; // YYYY-MM-DD
    vendor: string;
    itemType: InventoryItemType;
    makeModel: string;
    serialNumber: string;
    condition: InventoryCondition;
    purchaseCost: number;
    status: InventoryStatus;
    notes?: string;
}

export interface Sale {
    id: string;
    saleId: string;
    saleDate: string; // YYYY-MM-DD
    itemId: string;
    salePrice: number;
    buyerName: string;
    buyerContact: string;
    buyerEmail: string;
    buyerAddress: string;
    billOfSaleLink: string;
    notes?: string;
}