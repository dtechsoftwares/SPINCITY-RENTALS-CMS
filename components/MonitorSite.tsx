import React, { useState, useMemo } from 'react';
import { SiteContact, SiteRental, SiteRepair } from '../types';
import { CloseIcon } from './Icons';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

type Submission = SiteContact | SiteRental | SiteRepair;

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-t-4 ${color}`}>
      <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-brand-text mt-2">{value}</p>
    </div>
);

const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children?: React.ReactNode, title: string }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 animate-fade-in-down">
        <div className="bg-white text-brand-text w-full max-w-md md:max-w-4xl rounded-xl shadow-2xl border border-gray-200">
          <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-brand-text"><CloseIcon /></button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
};

interface MonitorSiteProps {
    siteContacts: SiteContact[];
    siteRentals: SiteRental[];
    siteRepairs: SiteRepair[];
    onUpdateStatus: (id: string, type: 'contact' | 'rental' | 'repair', newStatus: 'new' | 'pending' | 'completed') => void;
    onDeleteSubmission: (id: string, type: 'contact' | 'rental' | 'repair') => void;
    adminKey: string;
    addToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
}

const MonitorSite: React.FC<MonitorSiteProps> = ({ siteContacts, siteRentals, siteRepairs, onUpdateStatus, onDeleteSubmission, adminKey, addToast }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

    const allSubmissions = useMemo(() => [...siteContacts, ...siteRentals, ...siteRepairs], [siteContacts, siteRentals, siteRepairs]);
    
    const stats = useMemo(() => ({
        total: allSubmissions.length,
        contacts: siteContacts.length,
        rentals: siteRentals.length,
        repairs: siteRepairs.length,
    }), [allSubmissions, siteContacts, siteRentals, siteRepairs]);

    const handleDeleteRequest = (submission: Submission) => {
        setSubmissionToDelete(submission);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (submissionToDelete) {
            onDeleteSubmission(submissionToDelete.id, submissionToDelete.type);
        }
        setIsConfirmModalOpen(false);
        setSubmissionToDelete(null);
    };

    const renderSubmissionDetails = () => {
        if (!selectedSubmission) return null;

        const DetailItem = ({ label, value, fullWidth = false }: { label: string; value: React.ReactNode; fullWidth?: boolean }) => (
            <div className={fullWidth ? 'col-span-2' : ''}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <div className="text-md font-medium text-brand-text bg-gray-50 p-2 rounded mt-1">{value || 'N/A'}</div>
            </div>
        );
        
        const submission = selectedSubmission;
        const status = submission.status || 'new';

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="Submission ID" value={submission.id} />
                <DetailItem label="Status" value={<span className={`px-2 py-1 text-xs rounded-full font-semibold ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>} />
                
                {submission.type === 'contact' && <>
                    <DetailItem label="Name" value={submission.name} />
                    <DetailItem label="Email" value={submission.email} />
                    <DetailItem label="Phone" value={submission.phone} />
                    <DetailItem label="Address" value={submission.address} />
                    <DetailItem label="Plan" value={submission.plan} />
                    <DetailItem label="Hookups" value={submission.hookups} />
                    <DetailItem label="Message" value={submission.message} fullWidth />
                </>}

                {submission.type === 'rental' && <>
                    <DetailItem label="Renter Name" value={submission.renter_name} />
                    <DetailItem label="Verified Email" value={submission.Renter_Verified_Email} />
                    <DetailItem label="Property Address" value={submission.property_address} />
                    <DetailItem label="Selected Plan" value={submission.selected_plan} />
                    <DetailItem label="Maintenance" value={submission.maintenance_option} />
                    <DetailItem label="Emergency Contact" value={`${submission.emergency_name} (${submission.emergency_phone})`} />
                    <DetailItem label="Signature Name" value={submission.signature_name} />
                    <DetailItem label="Signature Date" value={submission.signature_date} />
                </>}

                 {submission.type === 'repair' && <>
                    <DetailItem label="Customer Name" value={submission.customerName} />
                    <DetailItem label="Email" value={submission.email} />
                    <DetailItem label="Phone" value={submission.phone} />
                    <DetailItem label="Service Address" value={submission.serviceAddress} />
                    <DetailItem label="Appliance" value={submission.applianceType} />
                    <DetailItem label="Issue" value={submission.issueType} />
                    <DetailItem label="Urgency" value={submission.urgency} />
                    <DetailItem label="Image Count" value={submission.imageCount.toString()} />
                    <DetailItem label="Issue Description" value={submission.issueDescription} fullWidth />
                    {submission.imageCount > 0 && (
                        <div className="col-span-2 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                            <div className="flex">
                                <div className="py-1">
                                    <svg className="h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-yellow-800">Images Submitted</p>
                                    <p className="text-sm text-yellow-700">
                                        This request includes {submission.imageCount} image(s). Please check the <strong>repairservices@spincityrentals.com</strong> email inbox to view them.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </>}

                 <div className="col-span-2 mt-4 pt-4 border-t">
                    <button onClick={() => {
                        const newStatus = status === 'completed' ? 'new' : 'completed';
                        onUpdateStatus(submission.id, submission.type, newStatus);
                        setSelectedSubmission(null);
                    }} className={`w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors`}>
                        Mark as {status === 'completed' ? 'New' : 'Completed'}
                    </button>
                 </div>
            </div>
        );
    };

    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === id ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );

    const SubmissionList = ({ data, onDelete }: { data: Submission[], onDelete: (item: Submission) => void }) => {
        const [filter, setFilter] = useState('');
        const filteredData = useMemo(() => {
            if (!filter) return data;
            return data.filter(item => 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(filter.toLowerCase())
                )
            );
        }, [data, filter]);

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
                <input 
                    type="text"
                    placeholder="Search submissions..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full md:w-1/3 mb-4 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text"
                />
                {filteredData.length > 0 ? (
                     <ul className="divide-y divide-gray-200">
                        {filteredData.map(item => (
                             <li key={item.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex-grow">
                                    <p className="font-bold text-lg capitalize">{item.type}: {(item as any).name || (item as any).renter_name || (item as any).customerName}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                        <span>{(item as any).email || (item as any).Renter_Verified_Email}</span>
                                        <span>Date: {new Date((item as any).timestamp || (item as any).submissionDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 self-end sm:self-center">
                                    <span className={`px-3 py-1 text-sm rounded-full font-semibold ${item.status === 'completed' ? 'bg-green-100 text-green-700' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{item.status || 'new'}</span>
                                    <div className="flex space-x-4 text-gray-500">
                                        <button onClick={() => setSelectedSubmission(item)} className="hover:text-brand-green">View</button>
                                        <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-400">Delete</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-8">No submissions found.</p>
                )}
            </div>
        )
    };

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <h1 className="text-3xl font-bold mb-2">Site Monitoring Dashboard</h1>
            <p className="text-gray-500 mb-8">Live data from your public website's forms.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Submissions" value={stats.total} color="border-blue-500" />
                <StatCard title="Contact Forms" value={stats.contacts} color="border-brand-green" />
                <StatCard title="Rental Agreements" value={stats.rentals} color="border-purple-500" />
                <StatCard title="Repair Requests" value={stats.repairs} color="border-yellow-500" />
            </div>
            
            <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg overflow-x-auto">
                <TabButton id="overview" label="All Submissions" />
                <TabButton id="contacts" label="Contact Forms" />
                <TabButton id="rentals" label="Rental Agreements" />
                <TabButton id="repairs" label="Repair Requests" />
            </div>

            {activeTab === 'overview' && <SubmissionList data={allSubmissions} onDelete={handleDeleteRequest} />}
            {activeTab === 'contacts' && <SubmissionList data={siteContacts} onDelete={handleDeleteRequest} />}
            {activeTab === 'rentals' && <SubmissionList data={siteRentals} onDelete={handleDeleteRequest} />}
            {activeTab === 'repairs' && <SubmissionList data={siteRepairs} onDelete={handleDeleteRequest} />}


            <Modal isOpen={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} title="Submission Details">
                {renderSubmissionDetails()}
            </Modal>

            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Submission"
                message="Are you sure you want to permanently delete this submission from the site database? This action cannot be undone."
                adminKey={adminKey}
                addToast={addToast}
            />
        </div>
    );
};

export default MonitorSite;