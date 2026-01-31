import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, Plus, FileText, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Dashboard() {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('fir_reports')
                .select('*, profiles:created_by(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'forwarded': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'submitted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-inter">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <FileText size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">FIR System</h1>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">{userRole?.replace("_", " ")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 hidden sm:block bg-gray-700/50 px-3 py-1 rounded-full border border-gray-600">{user?.email}</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="p-6 max-w-7xl mx-auto space-y-8">

                {/* Stats & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card */}
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Open Cases</p>
                            <h3 className="text-3xl font-bold text-white">{reports.filter(r => r.status !== 'resolved').length}</h3>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-xl">
                            <AlertTriangle size={24} className="text-blue-400" />
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="md:col-span-2 bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">Actions</h3>
                            <p className="text-sm text-gray-300">Manage incidents and safety reports.</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            {userRole === 'safety_engineer' && (
                                <button
                                    onClick={() => navigate('/create-report')}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold shadow-lg transition transform hover:-translate-y-0.5"
                                >
                                    <Plus size={18} /> New Report
                                </button>
                            )}
                            {/* Add more role based actions if needed */}
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">Recent Reports</h2>
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading reports...</div>
                    ) : reports.length === 0 ? (
                        <div className="bg-gray-800 rounded-2xl p-10 text-center border border-gray-700 border-dashed">
                            <p className="text-gray-400 mb-2">No reports found.</p>
                            {userRole === 'safety_engineer' && <p className="text-sm text-gray-500">Create a new report to get started.</p>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    onClick={() => navigate(`/report/${report.id}`)}
                                    className="bg-gray-800 hover:bg-gray-700/80 p-5 rounded-xl border border-gray-700 cursor-pointer transition duration-200 group relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-600 group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-3">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="text-sm font-mono text-gray-400">#{report.ref_no}</span>
                                                <h3 className="text-lg font-semibold text-white capitalize group-hover:text-blue-400 transition">{report.category.replace("_", " ")}</h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span>By: {report.profiles?.full_name || 'Unknown'}</span>
                                                <span>•</span>
                                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                                            {report.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
