import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { View, Severity, type Alert } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import RepairsView from './components/views/RepairsView';
import AnalyticsView from './components/views/AnalyticsView';
import ControlCenterView from './components/views/ControlCenterView';
import MapView from './components/views/MapView';
import LoginView from './components/views/LoginView';
import { networkHealthData } from './constants';

// --- Supabase Client Initialization ---
// VITAL: The URL has been set from your connection string.
// You MUST replace the placeholder anon key below with your actual Supabase project's Public Anon Key.
// You can find this in your Supabase project dashboard under Settings > API.
const supabaseUrl = 'https://rdhecihxwnrijlqtjoei.supabase.co';
// FIX: Explicitly typing `supabaseAnonKey` as a string prevents a TypeScript error on line 72
// where comparing a literal string constant to another string is disallowed.
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkaGVjaWh4d25yaWpscXRqb2VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODY3OTQsImV4cCI6MjA3NTM2Mjc5NH0.lJ6rERm1apRxZSUmf2nXaoMnB1wJ_ZFvTYmA7596d1w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- End Supabase Client Initialization ---


const SupabaseNotConfigured: React.FC = () => (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-gray-100">
        <div className="max-w-2xl rounded-lg bg-gray-800 p-8 text-center shadow-lg border border-red-500">
            <h1 className="text-3xl font-bold text-green-400">Almost There!</h1>
            <p className="mt-4 text-gray-300">
                The application is connected to your Supabase project URL. The final step is to add your <strong className="text-white">Public Anon Key</strong>.
            </p>
            <p className="mt-2 text-gray-300">
                Please open the <code className="rounded bg-gray-700 px-2 py-1 text-sm font-mono text-amber-400">App.tsx</code> file and replace the placeholder string for the <code className="rounded bg-gray-700 px-2 py-1 text-sm font-mono text-amber-400">supabaseAnonKey</code> variable with your actual Supabase project key.
            </p>
            <p className="mt-6 text-sm text-gray-500">
                You can find this key in your Supabase project dashboard under <span className="font-semibold">Settings &gt; API &gt; Project API keys</span>. It is the one labeled 'anon' and 'public'.
            </p>
        </div>
    </div>
);


const UserProfileIcon: React.FC<{ userEmail: string | null; onLogout: () => void; }> = ({ userEmail, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <span className="text-sm text-gray-300 truncate max-w-48" title={userEmail || undefined}>{userEmail || 'Loading...'}</span>
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
            </div>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                    <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-gray-300">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{userEmail || 'Loading...'}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};


const NotificationBar: React.FC<{ message: string; type: 'success' | 'error', onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    return (
        <div className={`fixed top-5 right-5 ${bgColor} text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-down z-50`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">X</button>
        </div>
    );
};

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [justVerified, setJustVerified] = useState(false);
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [networkHealth, setNetworkHealth] = useState(networkHealthData);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [profileWarning, setProfileWarning] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    const isSupabaseConfigured = supabaseAnonKey !== 'your-public-anon-key';

    const handleNotify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) return;
        
        const fetchUserRole = async (user: any) => {
            setUserEmail(user.email);
            // Using .limit(1).maybeSingle() is more robust than .single().
            // It prevents the "Cannot coerce result to single object" error if duplicate profiles exist
            // by safely returning the first result or null.
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .limit(1)
                .maybeSingle();

            // Handle schema/table errors first
            if (error && (error.message.includes("does not exist") || error.message.includes("schema cache"))) {
                console.error("CRITICAL: The 'profiles' table is missing.", error.message);
                setProfileWarning("The user 'profiles' table is missing. Role-based features are disabled. Please run the setup script in your Supabase SQL Editor to fix this.");
                setUserRole('customer'); // Default role
                return;
            }
            
            // Handle other potential database errors
            if (error) {
                console.error("Could not fetch user profile:", error.message);
                setUserRole('customer'); // Default to least privileged role
                return;
            }

            // Handle the case where a user profile is found
            if (data) {
                setUserRole(data.role);
                setProfileWarning(null); // Clear warning on success
            } else {
                // This case is for when the query runs but finds no matching profile.
                console.warn(`User profile not found for user ID: ${user.id}. Defaulting to 'customer' role.`);
                setUserRole('customer'); // Default to least privileged role
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsAuthenticated(true);
                fetchUserRole(session.user);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            if (_event === 'SIGNED_IN' && hashParams.get('type') === 'email_confirmation') {
                supabase.auth.signOut();
                setJustVerified(true);
                window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            } else {
                setIsAuthenticated(!!session);
                if (session) {
                    setJustVerified(false);
                    fetchUserRole(session.user);
                } else {
                    setUserRole(null);
                    setUserEmail(null);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [isSupabaseConfigured]);

    // Real-time alerts subscription
    useEffect(() => {
        if (!isAuthenticated || !isSupabaseConfigured) {
            setAlerts([]);
            return;
        }

        const fetchInitialAlerts = async () => {
            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(20);

            if (error) {
                console.error("Error fetching initial alerts:", error.message);
                handleNotify(`Error fetching alerts: ${error.message}`, 'error');
            } else {
                setAlerts(Array.isArray(data) ? data : []);
            }
        };

        fetchInitialAlerts();

        const channel = supabase.channel('realtime-alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'alerts' },
                (payload) => {
                    const newAlert = payload.new as Alert;
                    setAlerts(prevAlerts => [newAlert, ...prevAlerts].slice(0, 20));

                    if (newAlert.severity === Severity.Critical || newAlert.severity === Severity.High) {
                        handleNotify(`New ${newAlert.severity} Alert: ${newAlert.type} on ${newAlert.id}`, 'success');
                        audioRef.current?.play().catch(error => console.log("Audio playback failed:", error));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, isSupabaseConfigured, handleNotify]);

    // Network health simulation
    useEffect(() => {
        if (!isAuthenticated) return;

        const healthIntervalId = setInterval(() => {
            setNetworkHealth(currentHealthData => 
                currentHealthData.map(zone => {
                    const newHealth = Math.max(20, Math.min(100, zone.health + (Math.random() - 0.5) * 10));
                    return { ...zone, health: Math.round(newHealth) };
                })
            );
        }, 4000);

        return () => clearInterval(healthIntervalId);
    }, [isAuthenticated]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!isSupabaseConfigured) {
        return <SupabaseNotConfigured />;
    }
    
    if (!isAuthenticated) {
        return <LoginView justVerified={justVerified} />;
    }

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <DashboardView alerts={alerts} networkHealth={networkHealth} onNotify={handleNotify} userRole={userRole} />;
            case View.Repairs:
                return <RepairsView userRole={userRole} />;
            case View.Analytics:
                return <AnalyticsView />;
            case View.Control:
                return <ControlCenterView userRole={userRole} />;
            case View.Map:
                return <MapView userRole={userRole} onNotify={handleNotify} />;
            default:
                return <DashboardView alerts={alerts} networkHealth={networkHealth} onNotify={handleNotify} userRole={userRole} />;
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUserRole(null);
        setUserEmail(null);
    };

    return (
        <>
            {profileWarning && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-[1000] shadow-lg">
                    <strong>Configuration Error:</strong> {profileWarning}
                </div>
            )}
            {/* FIX: Corrected invalid JSX for the <audio> tag by making it self-closing and removing an invalid character from the base64 string. */}
            <audio ref={audioRef} src="data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjQwLjEwMQAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjYwAAAAAAAAAAAAAAAA//OExAAAAAAAAAAAAFhpbmcAAAAPAAAABAAAAcQAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA-
            MDAwMDAwMDAwMDAwMA==" />
            <div className="flex h-screen bg-gray-900 text-gray-100">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-[#111827] border-b border-gray-700 p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center space-x-4">
                            <img src="https://picsum.photos/40/40" alt="KSEB Logo" className="h-10 w-10 rounded-full" />
                            <h1 className="text-xl font-bold text-white">KSEBL Grid Intelligence Platform</h1>
                        </div>
                        <UserProfileIcon userEmail={userEmail} onLogout={handleLogout} />
                    </header>
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#111827] p-6">
                        {renderView()}
                    </main>
                </div>
                {notification && <NotificationBar message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
            </div>
        </>
    );
}