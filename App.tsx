import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Severity, type Alert } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import RepairsView from './components/views/RepairsView';
import AnalyticsView from './components/views/AnalyticsView';
import ControlCenterView from './components/views/ControlCenterView';
import MapView from './components/views/MapView';
import { alertsData } from './constants';

const UserProfileIcon: React.FC = () => (
    <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-300">Grid Operator</span>
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        </div>
    </div>
);

const NotificationBar: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed top-5 right-5 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold">X</button>
    </div>
);

export default function App() {
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [notification, setNotification] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>(alertsData);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const newAlert: Alert = {
                id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
                type: ['Voltage Sag', 'Overload', 'Phase Imbalance', 'High Temperature'][Math.floor(Math.random() * 4)],
                severity: [Severity.Critical, Severity.High, Severity.Medium, Severity.Low][Math.floor(Math.random() * 4)],
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            
            setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 10));

            if (newAlert.severity === Severity.Critical || newAlert.severity === Severity.High) {
                setNotification(`New ${newAlert.severity} Alert: ${newAlert.type} on ${newAlert.id}`);
                audioRef.current?.play().catch(error => console.log("Audio playback failed:", error));
            }

        }, 7000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <DashboardView alerts={alerts} onNotify={handleNotify} />;
            case View.Repairs:
                return <RepairsView />;
            case View.Analytics:
                return <AnalyticsView />;
            case View.Control:
                return <ControlCenterView />;
            case View.Map:
                return <MapView />;
            default:
                return <DashboardView alerts={alerts} onNotify={handleNotify}/>;
        }
    };

    const handleNotify = useCallback((alertDetails: Alert) => {
        console.log("--- SIMULATING NOTIFICATION ---");
        console.log("Alert Details:", alertDetails);
        const message = `Notification sent for ${alertDetails.id} to Field Team B and affected consumers.`;
        setNotification(message);
    }, []);

    return (
        <>
            <audio ref={audioRef} src="data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjQwLjEwMQAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjYwAAAAAAAAAAAAAAAA//OExAAAAAAAAAAAAFhpbmcAAAAPAAAABAAAAcQAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAw//OExAgAAAAAG4d//3+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////-x9e/yL7//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAAADSUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjQwLjEwMQ==" preload="auto" />
            <div className="flex h-screen bg-gray-900 text-gray-100">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-[#111827] border-b border-gray-700 p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-4">
                            <img src="https://picsum.photos/40/40" alt="KSEB Logo" className="h-10 w-10 rounded-full" />
                            <h1 className="text-xl font-bold text-white">KSEBL Grid Intelligence Platform</h1>
                        </div>
                        <UserProfileIcon />
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#111827] p-6">
                        {renderView()}
                    </main>
                </div>
                {notification && <NotificationBar message={notification} onClose={() => setNotification(null)} />}
            </div>
        </>
    );
}