import React, { useState, useEffect } from 'react';
import { supabase } from '../../App';
import { type Disconnector } from '../../types';

interface ControlCenterViewProps {
    userRole: string | null;
}

// Type for the profile lookup map
type ProfileMap = Map<string, { email: string; designation: string | null; }>;

// A simple spinner component to show loading state on the button
const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ControlCenterView: React.FC<ControlCenterViewProps> = ({ userRole }) => {
    const [disconnectors, setDisconnectors] = useState<Disconnector[]>([]);
    const [profiles, setProfiles] = useState<ProfileMap>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('Grid Operator');

    const isOperator = userRole === 'operator';

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setCurrentUserEmail(session.user.email);
            }

            // Fetch both disconnectors and profiles in parallel for efficiency
            const [disconnectorResult, profilesResult] = await Promise.all([
                supabase.from('disconnectors').select('*').order('id', { ascending: true }),
                supabase.from('profiles').select('email, designation')
            ]);

            // Handle disconnector data
            if (disconnectorResult.error) {
                console.error("Supabase error (disconnectors):", disconnectorResult.error.message);
                setError(`Failed to fetch disconnector data: ${disconnectorResult.error.message}`);
                setLoading(false);
                return;
            } else {
                setDisconnectors(disconnectorResult.data);
            }
            
            // Handle profiles data to get designations
            if (profilesResult.error) {
                 console.warn("Could not fetch profiles for designations:", profilesResult.error.message);
            } else {
                const profileMap: ProfileMap = new Map();
                profilesResult.data.forEach(profile => {
                    if (profile.email) {
                        profileMap.set(profile.email, { email: profile.email, designation: profile.designation });
                    }
                });
                setProfiles(profileMap);
            }

            setLoading(false);
        };

        fetchInitialData();
        
        const disconnectorChannel = supabase.channel('realtime-disconnectors')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'disconnectors' }, (payload) => {
                const updatedDisconnector = payload.new as Disconnector;
                setDisconnectors(current => current.map(d => d.id === updatedDisconnector.id ? updatedDisconnector : d));
            })
            .subscribe();

        // Also subscribe to profile changes to keep designations up-to-date
        const profileChannel = supabase.channel('realtime-profiles-designations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                // Refetch all profiles on any change
                supabase.from('profiles').select('email, designation').then(({data, error}) => {
                     if (!error && data) {
                        const profileMap: ProfileMap = new Map();
                        data.forEach(profile => { if (profile.email) { profileMap.set(profile.email, { email: profile.email, designation: profile.designation }); } });
                        setProfiles(profileMap);
                     }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(disconnectorChannel);
            supabase.removeChannel(profileChannel);
        };
    }, []);
    
    const handleToggleStatus = async (disconnector: Disconnector) => {
        if (!isOperator) return;
        setUpdatingId(disconnector.id);
        const newStatus = disconnector.status === 'Connected' ? 'Disconnected' : 'Connected';
        
        const { error } = await supabase.from('disconnectors').update({ 
            status: newStatus, 
            operator: currentUserEmail, 
            lastChanged: new Date().toISOString() 
        }).eq('id', disconnector.id);
        
        if (error) {
            console.error("Error updating disconnector:", error.message);
        }
        setUpdatingId(null);
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-300">Loading Disconnector Data...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400 bg-red-900/20 rounded-lg">{error}</div>;
    }

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
                        {disconnectors.map((d: Disconnector) => {
                            const operatorProfile = profiles.get(d.operator);
                            return (
                            <tr key={d.id} className="border-b border-gray-700 hover:bg-gray-700">
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-sm font-medium ${d.status === 'Connected' ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`h-2.5 w-2.5 rounded-full mr-2 ${d.status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {d.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{d.id}</td>
                                <td className="px-6 py-4">{d.assetId}</td>
                                <td className="px-6 py-4">{new Date(d.lastChanged).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div>
                                        <span className="font-medium">{d.operator}</span>
                                        {operatorProfile?.designation && (
                                            <span className="block text-xs text-gray-400">{operatorProfile.designation}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {isOperator ? (
                                        <button 
                                            onClick={() => handleToggleStatus(d)}
                                            disabled={updatingId === d.id}
                                            className={`font-medium rounded-md px-3 py-1 text-xs transition-colors flex items-center justify-center w-28
                                                ${d.status === 'Connected' 
                                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40' 
                                                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/40'}
                                                disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {updatingId === d.id ? (
                                                <>
                                                    <Spinner />
                                                    Updating...
                                                </>
                                            ) : (
                                                d.status === 'Connected' ? 'Disconnect' : 'Connect'
                                            )}
                                        </button>
                                    ) : (
                                        <div className="relative group">
                                            <button
                                                disabled
                                                className="font-medium rounded-md px-3 py-1 text-xs flex items-center justify-center w-28 bg-gray-600/30 text-gray-500 cursor-not-allowed"
                                            >
                                                {d.status === 'Connected' ? 'Disconnect' : 'Connect'}
                                            </button>
                                            <span className="absolute hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap z-10">
                                                Permission Denied
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ControlCenterView;