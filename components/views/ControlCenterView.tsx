
import React from 'react';
import { disconnectorData } from '../../constants';
import { type Disconnector } from '../../types';

const ControlCenterView: React.FC = () => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Disconnector Control</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Disconnector ID</th>
                            <th scope="col" className="px-6 py-3">Asset ID</th>
                            <th scope="col" className="px-6 py-3">Last Changed</th>
                            <th scope="col" className="px-6 py-3">Operator</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disconnectorData.map((d: Disconnector) => (
                            <tr key={d.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-sm font-medium ${d.status === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${d.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {d.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{d.id}</td>
                                <td className="px-6 py-4">{d.assetId}</td>
                                <td className="px-6 py-4">{d.lastChanged}</td>
                                <td className="px-6 py-4">{d.operator}</td>
                                <td className="px-6 py-4 flex items-center space-x-3">
                                    <button className="font-medium text-blue-500 hover:underline">Override</button>
                                    <button className="font-medium text-gray-400 hover:underline">History</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ControlCenterView;
