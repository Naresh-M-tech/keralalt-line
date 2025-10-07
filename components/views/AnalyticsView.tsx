
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { failureForecastData, highRiskAssetsData, preventiveActionsData } from '../../constants';

const AnalyticsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">90-Day Failure Forecast (Grid-Wide)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={failureForecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottomRight', offset: -10, fill: '#A0AEC0' }} stroke="#A0AEC0" />
                        <YAxis label={{ value: 'Probability %', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} stroke="#A0AEC0" />
                        <Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="probability" name="Failure Probability" stroke="#ef4444" dot={false} strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">High-Risk Asset Leaderboard</h3>
                    <ul className="space-y-3">
                        {highRiskAssetsData.map((asset) => (
                             <li key={asset.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
                                 <span className="font-medium text-white">{asset.id}</span>
                                 <span className={`text-sm font-semibold ${asset.risk === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>{asset.risk}</span>
                                 <span className="text-lg font-bold text-white">{asset.probability.toFixed(1)}%</span>
                             </li>
                        ))}
                    </ul>
                 </div>

                 <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Suggested Preventive Actions</h3>
                     <ul className="space-y-3 list-disc list-inside text-gray-300">
                         {preventiveActionsData.map((action, index) => (
                             <li key={index}>{action}</li>
                         ))}
                     </ul>
                 </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
