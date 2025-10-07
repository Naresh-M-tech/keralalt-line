import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { kpiData, networkHealthData } from '../../constants';
import { Severity, type Alert } from '../../types';

interface DashboardViewProps {
    alerts: Alert[];
    onNotify: (alert: Alert) => void;
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

const DashboardView: React.FC<DashboardViewProps> = ({ alerts, onNotify }) => {
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Asset ID</th>
                                    <th scope="col" className="px-4 py-3">Type</th>
                                    <th scope="col" className="px-4 py-3">Severity</th>
                                    <th scope="col" className="px-4 py-3">Timestamp</th>
                                    <th scope="col" className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((alert, index) => (
                                    <tr key={alert.id + alert.timestamp} className={`border-b border-gray-700 hover:bg-gray-700 ${index === 0 ? 'new-alert-flash' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-white">{alert.id}</td>
                                        <td className="px-4 py-3">{alert.type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityPillClass(alert.severity)}`}>
                                                {alert.severity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{alert.timestamp}</td>
                                        <td className="px-4 py-3 flex items-center space-x-2">
                                            <button className="text-blue-400 hover:text-blue-300 font-medium">Isolate</button>
                                            <button onClick={() => onNotify(alert)} className="text-green-400 hover:text-green-300 font-medium">Notify</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Network Health Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={networkHealthData}>
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