import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TeenProfile, Summary } from '../types';
import { AegisIcon, UserIcon, ClipboardIcon } from './Icons';

// A component to render a single summary card
const SummaryCard: React.FC<{ summary: Summary }> = ({ summary }) => {
    const { summary_data, created_at } = summary;
    const date = new Date(created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Safely render summary, providing fallbacks for missing data to prevent crashes.
    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-4">
            <p className="text-sm font-semibold text-gray-500">{date}</p>
            <div className="space-y-3 text-sm">
                <div>
                    <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Mood Cues:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {(summary_data?.moodCues || []).map((cue, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--bg-user)', color: 'var(--text-main)' }}>
                                {cue}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Possible Stressors:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                        {(summary_data?.possibleStressors || []).map((stressor, index) => (
                            <span key={index} className="px-2 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--bg-user)', color: 'var(--text-main)' }}>
                                {stressor}
                            </span>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="font-semibold" style={{ color: 'var(--text-heading)' }}>Suggested Follow-Up:</p>
                    <p className="mt-1" style={{ color: 'var(--text-main)' }}>{summary_data?.suggestedFollowUp || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};


const TherapistDashboard: React.FC = () => {
    const [patients, setPatients] = useState<TeenProfile[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<TeenProfile | null>(null);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSummariesLoading, setIsSummariesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // This RPC should return all teens assigned to the currently logged-in therapist.
                // It relies on the therapist's ID from the JWT.
                const { data, error: rpcError } = await supabase.rpc('get_assigned_teens');

                if (rpcError) throw rpcError;
                setPatients(data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch assigned patients.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const handleSelectPatient = async (patient: TeenProfile) => {
        setSelectedPatient(patient);
        setIsSummariesLoading(true);
        setError(null);
        setSummaries([]);

        try {
            const { data, error: summariesError } = await supabase
                .from('summaries')
                .select('*')
                .eq('teen_id', patient.id)
                .order('created_at', { ascending: false });

            if (summariesError) throw summariesError;
            setSummaries(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch summaries.');
        } finally {
            setIsSummariesLoading(false);
        }
    };
    
    const handleSignOut = async () => {
      await supabase.auth.signOut();
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
                <AegisIcon className="w-16 h-16 animate-pulse" />
                <p className="mt-4 text-lg text-gray-600">Loading Dashboard...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    <AegisIcon className="w-8 h-8"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Therapist Dashboard</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <h2 className="p-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Assigned Patients</h2>
                    <ul className="mt-2 space-y-1">
                        {patients.map(patient => (
                            <li key={patient.id}>
                                <button 
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        selectedPatient?.id === patient.id ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <UserIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>{patient.unique_display_id}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                 <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {error && (
                        <div className="p-4 mb-6 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                            <p><span className="font-bold">Error:</span> {error}</p>
                        </div>
                    )}

                    {selectedPatient ? (
                        <>
                            <div className="pb-4 border-b border-gray-300 mb-6">
                                <h2 className="text-3xl font-bold text-gray-800">
                                    Conversation Summaries
                                </h2>
                                <p className="mt-1 text-lg text-gray-600">
                                    Patient ID: <span className="font-semibold text-gray-900">{selectedPatient.unique_display_id}</span>
                                </p>
                            </div>
                            
                            {isSummariesLoading ? (
                                <div className="text-center py-10">
                                    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent" />
                                    <p className="mt-4 text-gray-600">Loading summaries...</p>
                                </div>
                            ) : summaries.length > 0 ? (
                                <div className="space-y-6">
                                    {summaries.map(summary => <SummaryCard key={summary.id} summary={summary} />)}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-white rounded-lg border-2 border-dashed border-gray-300">
                                    <ClipboardIcon className="w-12 h-12 mx-auto text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No summaries found</h3>
                                    <p className="mt-1 text-sm text-gray-500">This patient has not had any conversations with AEGIS in shared mode yet.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <AegisIcon className="w-24 h-24" style={{ filter: 'grayscale(100%)', opacity: 0.4 }} />
                            <h2 className="mt-6 text-2xl font-semibold text-gray-700">Welcome to AEGIS</h2>
                            <p className="mt-2 text-gray-500">Please select a patient from the sidebar to view their AI-generated conversation summaries.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TherapistDashboard;