import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function ReportDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole, user } = useAuth();

    const [report, setReport] = useState(null);
    const [details, setDetails] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [riskAssessment, setRiskAssessment] = useState(null);
    const [loading, setLoading] = useState(true);

    // Risk Form State
    const [severity, setSeverity] = useState(1);
    const [likelihood, setLikelihood] = useState(1);
    const [mitigation, setMitigation] = useState("");

    useEffect(() => {
        fetchReportData();
    }, [id]);

    const fetchReportData = async () => {
        try {
            // Fetch Main Report
            const { data: reportData, error: reportError } = await supabase
                .from("fir_reports")
                .select("*, profiles:created_by(full_name)")
                .eq("id", id)
                .single();
            if (reportError) throw reportError;
            setReport(reportData);

            // Fetch Dynamic Details
            const { data: detailsData } = await supabase
                .from("fir_details")
                .select("*")
                .eq("report_id", id);
            setDetails(detailsData || []);

            // Fetch Attachments
            const { data: attachData } = await supabase
                .from("attachments")
                .select("*")
                .eq("report_id", id);
            setAttachments(attachData || []);

            // Fetch Risk Assessment if exists
            const { data: riskData } = await supabase
                .from("risk_assessments")
                .select("*")
                .eq("report_id", id)
                .single();
            setRiskAssessment(riskData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRiskSubmit = async (e) => {
        e.preventDefault();
        if (!report) return;

        try {
            const { error } = await supabase.from("risk_assessments").insert({
                report_id: report.id,
                severity,
                likelihood,
                mitigation_plan: mitigation,
                assessed_by: user.id
            });

            if (error) throw error;

            // Update Report Status
            await supabase
                .from("fir_reports")
                .update({ status: "forwarded" })
                .eq("id", report.id);

            alert("Risk Assessment Submitted & Report Forwarded!");
            fetchReportData(); // Refresh UI
        } catch (err) {
            console.error("Error submitting risk:", err);
            alert("Submission failed");
        }
    };

    const handleCloseLoop = async () => {
        try {
            await supabase.from("fir_reports").update({ status: "resolved" }).eq("id", report.id);
            alert("Case Resolved!");
            fetchReportData();
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className="p-10 text-white">Loading...</div>;
    if (!report) return <div className="p-10 text-white">Report not found.</div>;

    const riskScore = riskAssessment ? riskAssessment.severity * riskAssessment.likelihood : severity * likelihood;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Report Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h1 className="text-2xl font-bold">FIR #{report.ref_no}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                            ${report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                                        report.status === 'forwarded' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {report.status.replace("_", " ")}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                                <div>
                                    <span className="block text-gray-500 text-xs">Category</span>
                                    <span className="capitalize">{report.category}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Reported By</span>
                                    <span>{report.profiles?.full_name || 'Unknown'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Date</span>
                                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Details - Grouped */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-8">

                            {/* General Details Group */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-blue-400 border-b border-gray-700 pb-2">Report Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                    {details.filter(d => !['contractor', 'employee', 'injury', 'body_parts'].some(k => d.question_key.includes(k)) && d.question_key !== 'description').map((detail) => (
                                        <div key={detail.id} className="">
                                            <span className="block text-xs text-gray-500 uppercase font-medium">{detail.question_key.replace(/_/g, " ")}</span>
                                            <p className="text-gray-200 text-sm mt-1">{detail.answer_value?.toString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Detailed Description */}
                            {details.find(d => d.question_key === 'description') && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-gray-400">Description</h3>
                                    <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700/50">
                                        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                            {details.find(d => d.question_key === 'description').answer_value}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Person/Injury Specific Group */}
                            {details.some(d => ['employee', 'contractor', 'person', 'injury', 'body'].some(k => d.question_key.includes(k))) && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-blue-400 border-b border-gray-700 pb-2">Person & Injury Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                                        {details.filter(d => ['employee', 'contractor', 'person', 'injury', 'body'].some(k => d.question_key.includes(k))).map((detail) => (
                                            <div key={detail.id} className="">
                                                <span className="block text-xs text-gray-500 uppercase font-medium">{detail.question_key.replace(/_/g, " ")}</span>
                                                <p className="text-gray-200 text-sm mt-1">{detail.answer_value?.toString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-semibold mb-4 text-gray-200">Photos</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {attachments.map((file) => (
                                    <a key={file.id} href={file.storage_path} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-gray-700">
                                        <img src={file.storage_path} alt="Evidence" className="w-full h-32 object-cover transition transform group-hover:scale-110" />
                                    </a>
                                ))}
                                {attachments.length === 0 && <p className="text-gray-500 text-sm italic">No photos attached.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Risk Assessment & Actions */}
                    <div className="space-y-6">
                        {/* Risk Card */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-amber-500" />
                                Risk Assessment
                            </h3>

                            {riskAssessment ? (
                                // View Assessment
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                        <span className="text-sm text-gray-400">Severity</span>
                                        <span className="font-bold">{riskAssessment.severity}/5</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                        <span className="text-sm text-gray-400">Likelihood</span>
                                        <span className="font-bold">{riskAssessment.likelihood}/5</span>
                                    </div>
                                    <div className="text-center pt-2 border-t border-gray-700">
                                        <span className="block text-xs text-gray-500 uppercase">Risk Score</span>
                                        <span className={`text-4xl font-black ${riskScore >= 12 ? 'text-red-500' : riskScore >= 6 ? 'text-amber-500' : 'text-green-500'
                                            }`}>{riskScore}</span>
                                    </div>
                                    <div className="pt-4">
                                        <span className="block text-xs text-gray-500 uppercase mb-1">Mitigation Plan</span>
                                        <p className="text-sm text-gray-300 bg-gray-900 p-3 rounded">{riskAssessment.mitigation_plan}</p>
                                    </div>

                                    {userRole === 'dept_manager' && report.status !== 'resolved' && (
                                        <button
                                            onClick={handleCloseLoop}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold mt-4"
                                        >
                                            Approve & Close Loop
                                        </button>
                                    )}
                                </div>
                            ) : (
                                // Create Assessment Form (Safety Manager Only)
                                userRole === 'safety_manager' ? (
                                    <form onSubmit={handleRiskSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Severity (1-5)</label>
                                            <input type="range" min="1" max="5" value={severity} onChange={e => setSeverity(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                            <div className="flex justify-between text-xs text-gray-500 px-1"><span>Low</span><span>Critical</span></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Likelihood (1-5)</label>
                                            <input type="range" min="1" max="5" value={likelihood} onChange={e => setLikelihood(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                            <div className="flex justify-between text-xs text-gray-500 px-1"><span>Rare</span><span>Certain</span></div>
                                        </div>
                                        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center">
                                            <span className="block text-gray-500 text-xs mb-1">Projected Risk Score</span>
                                            <span className="text-2xl font-bold text-white">{severity * likelihood}</span>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Mitigation Plan</label>
                                            <textarea
                                                required
                                                rows="3"
                                                value={mitigation}
                                                onChange={e => setMitigation(e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm"
                                                placeholder="Action plan to prevent recurrence..."
                                            ></textarea>
                                        </div>
                                        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg transition">
                                            Submit Assessment
                                        </button>
                                    </form>
                                ) : (
                                    <div className="text-center text-gray-500 py-4 italic">
                                        Pending Risk Assessment by Safety Manager.
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
