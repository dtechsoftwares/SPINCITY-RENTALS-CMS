import React, { useState, useMemo } from 'react';
import { Contact, Rental, Repair } from '../types';
import { ContactsIcon, RentalsIcon, RepairsIcon } from './Icons';

type ReportPeriod = 'daily' | 'monthly' | 'yearly';

interface ReportData {
    newContacts: number;
    newRentals: number;
    newRepairs: number;
    completedRepairs: number;
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
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = 250;
    const barWidth = 40;
    const barMargin = 20;
    const svgWidth = data.length * (barWidth + barMargin);

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold mb-4">Activity Overview</h3>
            <div className="overflow-x-auto">
                <svg width={svgWidth} height={chartHeight + 40} className="font-sans">
                    {data.map((item, index) => {
                        const barHeight = (item.value / maxValue) * chartHeight;
                        const x = index * (barWidth + barMargin);
                        const y = chartHeight - barHeight;
                        return (
                            <g key={item.label}>
                                <rect x={x} y={y} width={barWidth} height={barHeight} className={item.color} rx="4" />
                                <text x={x + barWidth / 2} y={chartHeight + 15} textAnchor="middle" className="text-xs fill-gray-500">{item.label}</text>
                                <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-sm font-bold fill-brand-text">{item.value}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};


interface ReportsProps {
    contacts: Contact[];
    rentals: Rental[];
    repairs: Repair[];
    handleAction: (action: () => void) => void;
}

const Reports: React.FC<ReportsProps> = ({ contacts, rentals, repairs, handleAction }) => {
    const [period, setPeriod] = useState<ReportPeriod>('daily');

    const reportData = useMemo<ReportData>(() => {
        const now = new Date();
        const today = now.toDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const filterByPeriod = (dateString: string) => {
            const itemDate = new Date(`${dateString}T00:00:00`);
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
        };
    }, [period, contacts, rentals, repairs]);
    
    const chartData = [
        { label: 'Clients', value: reportData.newContacts, color: 'fill-brand-green' },
        { label: 'Rentals', value: reportData.newRentals, color: 'fill-green-500' },
        { label: 'New Repairs', value: reportData.newRepairs, color: 'fill-yellow-500' },
        { label: 'Done Repairs', value: reportData.completedRepairs, color: 'fill-purple-500' },
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

    const handlePrint = () => handleAction(() => {
        window.print();
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
        <div className="p-8 text-brand-text">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Reports</h1>
                <div className="flex space-x-2 p-1 bg-gray-200 rounded-lg">
                    <PeriodButton value="daily" label="Today" />
                    <PeriodButton value="monthly" label="This Month" />
                    <PeriodButton value="yearly" label="This Year" />
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={<ContactsIcon className="w-6 h-6 text-white"/>} title="New Clients" value={reportData.newContacts} color="bg-brand-green"/>
                <StatCard icon={<RentalsIcon className="w-6 h-6 text-white"/>} title="New Rentals" value={reportData.newRentals} color="bg-green-500"/>
                <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="New Repairs" value={reportData.newRepairs} color="bg-yellow-500"/>
                <StatCard icon={<RepairsIcon className="w-6 h-6 text-white"/>} title="Completed Repairs" value={reportData.completedRepairs} color="bg-purple-500"/>
            </div>

            <BarChart data={chartData} />
            
            <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-4">Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button onClick={handleExportCSV} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">Export to CSV</button>
                    <button onClick={handlePrint} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors">Print / Save as PDF</button>
                    <button onClick={handleEmailReport} className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-green-dark transition-colors">Email Report</button>
                </div>
            </div>
        </div>
    );
};

export default Reports;