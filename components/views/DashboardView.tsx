import React, { useState } from 'react';
import { supabase } from '../../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { kpiData } from '../../constants';
import { Severity, type Alert, KanbanStatus } from '../../types';

interface DashboardViewProps {
    alerts: Alert[];
    networkHealth: { name: string; health: number; }[];
    onNotify: (message: string, type: 'success' | 'error') => void;
    userRole: string | null;
}

const KPICard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-1">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-white mt-2">{value}</p>
    </div>
);

const getSeverityPillClass = (severity: Severity) => {
    switch (severity) {
        case Severity.Critical:
            return 'bg-red-500 text-red-100';
        case Severity.High:
            return 'bg-amber-500 text-amber-100';
        case Severity.Medium:
            return 'bg-yellow-500 text-yellow-100';
        case Severity.Low:
            return 'bg-blue-500 text-blue-100';
        default:
            return 'bg-gray-500 text-gray-100';
    }
};

const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - alertTime.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (diffInSeconds < 60) {
        return rtf.format(-diffInSeconds, 'second');
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return rtf.format(-diffInMinutes, 'minute');
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return rtf.format(-diffInHours, 'hour');
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return rtf.format(-diffInDays, 'day');
};

const DashboardView: React.FC<DashboardViewProps> = ({ alerts, networkHealth, onNotify, userRole }) => {
    const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
    const [ticketCreated, setTicketCreated] = useState<Set<string>>(new Set());
    const isOperator = userRole === 'operator';

    const handleAcknowledge = (alertId: string) => {
        setAcknowledged(prev => new Set(prev).add(alertId));
    };

    const handleCreateTicket = async (alert: Alert) => {
        if (!isOperator) return;

        const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
        const newTicket = {
            id: ticketId,
            title: `${alert.type} on ${alert.id}`,
            assetId: alert.id,
            assignedTo: 'Unassigned',
            status: KanbanStatus.ToDo,
            created: new Date().toISOString(),
        };

        const { error } = await supabase.from('tickets').insert([newTicket]);

        if (error) {
            console.error('Error creating ticket:', error);
            onNotify(`Error creating ticket: ${error.message}`, 'error');
        } else {
            setTicketCreated(prev => new Set(prev).add(alert.id));
            onNotify(`Successfully created ticket ${ticketId}`, 'success');
        }
    };


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Assets" value={kpiData.totalAssets.toLocaleString()} />
                <KPICard title="Active Faults" value={kpiData.activeFaults} />
                <KPICard title="Transformers" value={kpiData.transformers.toLocaleString()} />
                <KPICard title="Grid Health" value={`${kpiData.gridHealth}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Active Alerts</h3>
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Asset ID</th>
                                    <th scope="col" className="px-4 py-3">Type</th>
                                    <th scope="col" className="px-4 py-3">Severity</th>
                                    <th scope="col" className="px-4 py-3">Timestamp</th>
                                    <th scope="col" className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert, index) => {
                                    const alertKey = `${alert.id}-${alert.timestamp}`;
                                    const isAcknowledged = acknowledged.has(alertKey);
                                    const isTicketCreated = ticketCreated.has(alert.id);

                                    return (
                                    <tr key={alertKey} className={`border-b border-gray-700 hover:bg-gray-700 ${index === 0 ? 'new-alert-flash' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-white">{alert.id}</td>
                                        <td className="px-4 py-3">{alert.type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityPillClass(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{formatRelativeTime(alert.timestamp)}</td>
                                        <td className="px-4 py-3 flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleAcknowledge(alertKey)}
                                                disabled={isAcknowledged}
                                                className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                                                    isAcknowledged 
                                                    ? 'text-green-300 bg-green-800/50 cursor-default' 
                                                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-800/50'
                                                }`}
                                            >
                                                 {isAcknowledged ? '✓ Seen' : 'Acknowledge'}
                                            </button>
                                            <div className="relative group">
                                                <button 
                                                    onClick={() => handleCreateTicket(alert)}
                                                    disabled={isTicketCreated || !isOperator}
                                                    className="text-sm font-medium px-2 py-1 rounded transition-colors text-amber-400 hover:text-amber-300 hover:bg-amber-800/50 disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                >
                                                    {isTicketCreated ? 'Ticketed' : 'Create Ticket'}
                                                </button>
                                                {!isOperator && (
                                                    <span className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-10">
                                                        Permission Denied
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Network Health Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={networkHealth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" />
                            <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }}/>
                            <Legend />
                            <Bar dataKey="health" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;