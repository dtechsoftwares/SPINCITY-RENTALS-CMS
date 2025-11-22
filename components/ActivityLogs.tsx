
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';
import AdminKeyConfirmationModal from './AdminKeyConfirmationModal';

interface ActivityLogsProps {
    logs: LogEntry[];
    onDeleteLog: (id: string) => void;
    adminKey: string;
    addToast: (title: string, message: string, type: 'success' | 'info' | 'error') => void;
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs, onDeleteLog, adminKey, addToast }) => {
    const [filter, setFilter] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);

    const filteredLogs = useMemo(() => {
        if (!filter) return logs;
        const lowerFilter = filter.toLowerCase();
        return logs.filter(log => 
            log.adminName.toLowerCase().includes(lowerFilter) ||
            log.actionType.toLowerCase().includes(lowerFilter) ||
            log.entity.toLowerCase().includes(lowerFilter) ||
            log.details.toLowerCase().includes(lowerFilter)
        );
    }, [logs, filter]);

    const getActionColor = (type: string) => {
        switch (type) {
            case 'CREATE': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleDeleteRequest = (logId: string) => {
        setLogToDelete(logId);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (logToDelete) {
            onDeleteLog(logToDelete);
            addToast('Success', 'Activity log deleted successfully.', 'success');
        }
        setIsConfirmModalOpen(false);
        setLogToDelete(null);
    };

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activity Logs</h1>
                    <p className="text-gray-500 mt-1">Audit trail of all administrative actions.</p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
                <div className="mb-6">
                    <input 
                        type="text"
                        placeholder="Search logs by admin, action, or details..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full md:w-1/3 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-text"
                    />
                </div>

                {filteredLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{log.adminName}</div>
                                            <div className="text-sm text-gray-500">{log.adminEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.actionType)}`}>
                                                {log.actionType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {log.entity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleDeleteRequest(log.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No logs found.</p>
                )}
            </div>

            <AdminKeyConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Activity Log"
                message="Are you sure you want to permanently delete this activity log? This action cannot be undone."
                adminKey={adminKey}
                addToast={addToast}
            />
        </div>
    );
};

export default ActivityLogs;
