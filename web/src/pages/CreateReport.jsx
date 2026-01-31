import { useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Upload } from "lucide-react";

export default function CreateReport() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        category: "near_miss",
        description: "",
        location: "",
        // Dynamic fields
        body_part: "",
        injury_type: "",
        affected_person: "",
        symptoms: "",
    });
    const [files, setFiles] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create FIR Report
            const { data: report, error: reportError } = await supabase
                .from("fir_reports")
                .insert([
                    {
                        category: formData.category,
                        created_by: user.id,
                        status: "submitted", // Skip draft for simplicity in this MVP
                    },
                ])
                .select()
                .single();

            if (reportError) throw reportError;

            const reportId = report.id;

            // 2. Insert Dynamic Details
            const details = [];
            if (formData.category === "near_miss") {
                details.push({ report_id: reportId, question_key: "location", answer_value: formData.location });
                details.push({ report_id: reportId, question_key: "description", answer_value: formData.description });
            } else if (formData.category === "injury") {
                details.push({ report_id: reportId, question_key: "body_part", answer_value: formData.body_part });
                details.push({ report_id: reportId, question_key: "injury_type", answer_value: formData.injury_type });
                details.push({ report_id: reportId, question_key: "affected_person", answer_value: formData.affected_person });
            } else if (formData.category === "illness") {
                details.push({ report_id: reportId, question_key: "symptoms", answer_value: formData.symptoms });
            }

            const { error: detailsError } = await supabase.from("fir_details").insert(details);
            if (detailsError) throw detailsError;

            // 3. Upload Images & Link Attachments
            for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${reportId}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("incident-photos")
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Get Public URL (assuming public bucket)
                const { data: { publicUrl } } = supabase.storage
                    .from("incident-photos")
                    .getPublicUrl(fileName);

                await supabase.from("attachments").insert({
                    report_id: reportId,
                    storage_path: publicUrl,
                    file_type: file.type,
                });
            }

            navigate("/"); // Redirect to dashboard
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-8">File New Incident</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Incident Category</label>
                        <div className="grid grid-cols-3 gap-4">
                            {["near_miss", "injury", "illness"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat })}
                                    className={`py-3 px-4 rounded-lg font-medium capitalize transition ${formData.category === cat
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                >
                                    {cat.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-4">
                        <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Details</h3>

                        {formData.category === "near_miss" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows="4"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                            </>
                        )}

                        {formData.category === "injury" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Affected Person</label>
                                    <input
                                        type="text"
                                        name="affected_person"
                                        required
                                        value={formData.affected_person}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Body Part</label>
                                    <input
                                        type="text"
                                        name="body_part"
                                        required
                                        value={formData.body_part}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                        placeholder="e.g. Left Hand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Injury Type</label>
                                    <input
                                        type="text"
                                        name="injury_type"
                                        required
                                        value={formData.injury_type}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                        placeholder="e.g. Cut, Burn"
                                    />
                                </div>
                            </>
                        )}

                        {formData.category === "illness" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Symptoms</label>
                                    <textarea
                                        name="symptoms"
                                        required
                                        rows="4"
                                        value={formData.symptoms}
                                        onChange={handleChange}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Photos</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Camera className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                </div>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {Array.from(files).map((file, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm text-gray-300 bg-gray-700/50 p-2 rounded">
                                        <span>{file.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded transition-all ${loading ? "bg-blue-600 text-white animate-pulse" : "bg-emerald-900 text-emerald-300 border border-emerald-500/30"}`}>
                                            {loading ? "Uploading..." : "Ready to Sync"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95"
                    >
                        {loading ? "Submitting..." : "Submit Report"}
                    </button>
                </form>
            </div>
        </div>
    );
}
