
import React, { useState, useMemo } from 'react';
import { Contact, Rental, Repair, SiteContact, SiteRental, SiteRepair } from '../types';
import { ContactsIcon, RentalsIcon, RepairsIcon, MonitorIcon } from './Icons';

type ReportPeriod = 'daily' | 'monthly' | 'yearly' | 'all';

interface ReportData {
    newContacts: number;
    newRentals: number;
    newRepairs: number;
    completedRepairs: number;
    newSiteContacts: number;
    newSiteRentals: number;
    newSiteRepairs: number;
}

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-xl flex items-center space-x-4 shadow-sm border border-gray-200">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-brand-text">{value}</p>
    </div>
  </div>
);

const BarChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const hasData = data.some(d => d.value > 0);
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = 250;
    const barWidth = 40;
    const barMargin = 20;
    const svgWidth = data.length * (barWidth + barMargin);

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold mb-4">Activity Overview</h3>
            {hasData ? (
                <div className="overflow-x-auto pb-4">
                    <svg width={svgWidth} height={chartHeight + 40} className="font-sans min-w-[400px]">
                        {data.map((item, index) => {
                            const barHeight = (item.value / maxValue) * chartHeight;
                            const x = index * (barWidth + barMargin);
                            const y = chartHeight - barHeight;
                            return (
                                <g key={item.label}>
                                    <rect x={x} y={y} width={barWidth} height={barHeight} className={item.color} rx="4" />
                                    <text x={x + barWidth / 2} y={chartHeight + 20} textAnchor="middle" className="text-xs fill-gray-500">{item.label}</text>
                                    <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-sm font-bold fill-brand-text">{item.value}</text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            ) : (
                 <div className="flex items-center justify-center h-[290px] text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                    <div className="text-center">
                         <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No Activity to Display</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            The chart will populate once data is added.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};


interface ReportsProps {
    contacts: Contact[];
    rentals: Rental[];
    repairs: Repair[];
    siteContacts: SiteContact[];
    siteRentals: SiteRental[];
    siteRepairs: SiteRepair[];
    handleAction: (action: () => void) => void;
}

const Reports: React.FC<ReportsProps> = ({ contacts, rentals, repairs, siteContacts, siteRentals, siteRepairs, handleAction }) => {
    const [period, setPeriod] = useState<ReportPeriod>('all');

    const reportData = useMemo<ReportData>(() => {
        const now = new Date();
        const today = now.toDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filterByPeriod = (dateString: string) => {
            if (period === 'all') return true;
            if (!dateString) return false;
            const itemDate = new Date(dateString);
            if(isNaN(itemDate.getTime())) return false; // Invalid date check

            switch (period) {
                case 'daily':
                    return itemDate.toDateString() === today;
                case 'monthly':
                    return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
                case 'yearly':
                    return itemDate.getFullYear() === currentYear;
                default:
                    return false;
            }
        };

        return {
            newContacts: contacts.filter(c => filterByPeriod(c.createdAt)).length,
            newRentals: rentals.filter(r => filterByPeriod(r.startDate)).length,
            newRepairs: repairs.filter(r => filterByPeriod(r.reportedDate)).length,
            completedRepairs: repairs.filter(r => r.status === 'Completed' && filterByPeriod(r.reportedDate)).length,
            newSiteContacts: siteContacts.filter(sc => filterByPeriod(sc.timestamp)).length,
            newSiteRentals: siteRentals.filter(sr => filterByPeriod(sr.timestamp)).length,
            newSiteRepairs: siteRepairs.filter(sr => filterByPeriod(sr.submissionDate)).length,
        };
    }, [period, contacts, rentals, repairs, siteContacts, siteRentals, siteRepairs]);
    
    const chartData = [
        { label: 'CMS Clients', value: reportData.newContacts, color: 'fill-brand-green' },
        { label: 'CMS Rentals', value: reportData.newRentals, color: 'fill-green-500' },
        { label: 'CMS Repairs', value: reportData.newRepairs, color: 'fill-yellow-500' },
        { label: 'Site Contacts', value: reportData.newSiteContacts, color: 'fill-blue-500' },
        { label: 'Site Rentals', value: reportData.newSiteRentals, color: 'fill-indigo-500' },
        { label: 'Site Repairs', value: reportData.newSiteRepairs, color: 'fill-pink-500' },
    ];
    
    const handleExportCSV = () => handleAction(() => {
        const headers = "Metric,Value\n";
        const rows = chartData.map(d => `${d.label},${d.value}`).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    const handleEmailReport = () => handleAction(() => {
        const subject = `SpinCity CMS Report: ${period.charAt(0).toUpperCase() + period.slice(1)} - ${new Date().toLocaleDateString()}`;
        const body = `Here is the ${period} report summary:\n\n` +
                     chartData.map(d => `- ${d.label}: ${d.value}`).join('\n') +
                     `\n\nGenerated from SpinCity CMS.`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    const PeriodButton = ({ value, label }: { value: ReportPeriod, label: string }) => (
        <button
            onClick={() => setPeriod(value)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                period === value ? 'bg-brand-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 sm:p-8 text-brand-text">
            <div className="hidden print:block mb-8 border-b border-gray-300 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-text">Spin City Rentals Report</h1>
                        <p className="text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-xl text-brand-green">Performance Summary</p>
                        <p className="text-sm text-gray-500">Period: {period.charAt(0).toUpperCase() + period.slice(1)}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold print:hidden">Reports</h1>
                <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg self-start sm:self-auto print:hidden">
                    <PeriodButton value="all" label="All Time" />
                    <PeriodButton value="daily" label="Today" />
                    <PeriodButton value="monthly" label="This Month" />
                    <PeriodButton value="yearly" label="This Year" />
                </div>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold mb-4">CMS Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<ContactsIcon className="w-6 h-6 text-white"/>} title="New Clients" value={reportData.newContacts} color="bg-brand-green"/>
                <StatCard icon={<RentalsIcon className="w-6 h-6 text-white"/>} title="New Rentals" value={reportData.newRentals} color="bg-green-500"/>
                <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="New Repairs" value={reportData.newRepairs} color="bg-yellow-500"/>
                <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="Completed Repairs" value={reportData.completedRepairs} color="bg-purple-500"/>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mb-4 mt-8 sm:mt-12">Website Submissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                 <StatCard icon={<ContactsIcon className="w-6 h-6 text-white"/>} title="New Site Contacts" value={reportData.newSiteContacts} color="bg-blue-500"/>
                <StatCard icon={<RentalsIcon className="w-6 h-6 text-white"/>} title="New Site Rentals" value={reportData.newSiteRentals} color="bg-indigo-500"/>
                <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="New Site Repairs" value={reportData.newSiteRepairs} color="bg-pink-500"/>
                <StatCard icon={<MonitorIcon className="w-6 h-6 text-white"/>} title="Total Site Submissions" value={reportData.newSiteContacts + reportData.newSiteRentals + reportData.newSiteRepairs} color="bg-gray-500"/>
            </div>

            <BarChart data={chartData} />
            
            <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm print:hidden">
                <h3 className="text-lg font-bold mb-4">Actions</h3>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <button onClick={handleExportCSV} className="w-full sm:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Export to CSV</button>
                    <button onClick={handleEmailReport} className="w-full sm:w-auto bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">Email Report</button>
                </div>
            </div>
        </div>
    );
};

export default Reports;
