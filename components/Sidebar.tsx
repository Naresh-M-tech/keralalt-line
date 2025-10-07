
import React from 'react';
import { View } from '../types';
import { DashboardIcon, TicketIcon, AnalyticsIcon, ControlCenterIcon, MapIcon } from './icons/SidebarIcons';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: View;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <li
        onClick={onClick}
        className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
            isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { view: View.Dashboard, icon: <DashboardIcon /> },
        { view: View.Repairs, icon: <TicketIcon /> },
        { view: View.Analytics, icon: <AnalyticsIcon /> },
        { view: View.Control, icon: <ControlCenterIcon /> },
        { view: View.Map, icon: <MapIcon /> },
    ];

    return (
        <aside className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
            <div className="flex-grow">
                <nav>
                    <ul>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.view}
                                icon={item.icon}
                                label={item.view}
                                isActive={currentView === item.view}
                                onClick={() => setCurrentView(item.view)}
                            />
                        ))}
                    </ul>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
