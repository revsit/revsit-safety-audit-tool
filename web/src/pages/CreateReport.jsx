import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";

export default function CreateReport() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Helper for local datetime string default
    const getLocalISOString = () => {
        const now = new Date();
        return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    // Initial State including all possible fields
    const [formData, setFormData] = useState({
        category: "near_miss",

        // Common / Shared
        title: "",
        date: "",
        time: "",
        location: "",
        reported_date_time: getLocalISOString(), // Default to system local time
        department: "",
        process_type: "",
        witness: "",
        description: "",

        // Near Miss Specific
        near_miss_type: "",
        person_type: "",
        possible_consequences: "",
        unsafe_act_by: "",
        responsible_area_manager: "",

        // Injury/Illness Specific
        object_substances_involved: "",
        possible_cause: "",
        immediate_action_taken: "",
        person_affected_type: "employee", // 'employee' or 'contractor'

        // Employee Specific
        employee_code: "",
        employee_name: "",
        injury_type: "",

        // Contractor Specific
        contractor_type: "contractor", // 'contractor', 'vendor', 'visitor'
        contractor_agency: "",
        contractor_name: "",

        // Injury Nature & Body Parts (Shared by both Person Types)
        injury_nature: "",
        body_parts_affected: "",

        // Keep illness symptom if needed, or map to description
        symptoms: "",
    });

    const [files, setFiles] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                        status: "submitted",
                    },
                ])
                .select()
                .single();

            if (reportError) throw reportError;

            const reportId = report.id;

            // 2. Prepare Dynamic Details based on Category
            const details = [];

            // Helper to add detail only if it has a value (optional, but keeps DB clean)
            // For this implementation, we'll save empty checking to allow optional fields if needed, 
            // but the form has 'required' attributes.
            const addDetail = (key, value) => {
                if (value !== undefined && value !== null) {
                    details.push({ report_id: reportId, question_key: key, answer_value: value });
                }
            };

            // --- Common Fields (for the sections relevant to them) ---
            if (formData.category === "near_miss") {
                addDetail("title", formData.title);
                addDetail("near_miss_type", formData.near_miss_type);
                addDetail("date", formData.date);
                addDetail("location", formData.location);
                addDetail("time", formData.time);
                addDetail("reported_date_time", formData.reported_date_time);
                addDetail("department", formData.department);
                addDetail("person_type", formData.person_type);
                addDetail("process_type", formData.process_type);
                addDetail("witness", formData.witness);
                addDetail("description", formData.description);
                addDetail("possible_consequences", formData.possible_consequences);
                addDetail("unsafe_act_by", formData.unsafe_act_by);
                addDetail("responsible_area_manager", formData.responsible_area_manager);

            } else if (formData.category === "injury" || formData.category === "illness") {
                addDetail("title", formData.title);
                addDetail("location", formData.location);
                addDetail("date", formData.date);
                addDetail("time", formData.time);
                addDetail("department", formData.department);
                addDetail("reported_date_time", formData.reported_date_time);
                addDetail("witness", formData.witness);
                addDetail("object_substances_involved", formData.object_substances_involved);
                addDetail("possible_cause", formData.possible_cause);
                addDetail("process_type", formData.process_type);
                addDetail("description", formData.description);
                addDetail("immediate_action_taken", formData.immediate_action_taken);
                addDetail("person_affected_type", formData.person_affected_type);

                if (formData.person_affected_type === "employee") {
                    addDetail("employee_code", formData.employee_code);
                    addDetail("employee_name", formData.employee_name);
                    addDetail("injury_type", formData.injury_type);
                    addDetail("injury_nature", formData.injury_nature);
                    addDetail("body_parts_affected", formData.body_parts_affected);
                } else {
                    addDetail("contractor_type", formData.contractor_type);
                    addDetail("contractor_agency", formData.contractor_agency);
                    addDetail("contractor_name", formData.contractor_name);
                    addDetail("injury_nature", formData.injury_nature);
                    addDetail("body_parts_affected", formData.body_parts_affected);
                }

                if (formData.category === "illness") {
                    addDetail("symptoms", formData.symptoms);
                }
            }

            const { error: detailsError } = await supabase.from("fir_details").insert(details);
            if (detailsError) throw detailsError;

            // 3. Upload Images
            for (const file of files) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${reportId}/${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("incident-photos")
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("incident-photos")
                    .getPublicUrl(fileName);

                await supabase.from("attachments").insert({
                    report_id: reportId,
                    storage_path: publicUrl,
                    file_type: file.type,
                });
            }

            navigate("/");
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Failed to submit report: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = (label, name, type = "text", required = true, placeholder = "") => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input
                type={type}
                name={name}
                required={required}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
        </div>
    );

    const renderTextArea = (label, name, required = true) => (
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <textarea
                name={name}
                required={required}
                rows="3"
                value={formData[name]}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 font-inter">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
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
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                        }`}
                                >
                                    {cat.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DYNAMIC FORM FIELDS */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-6">
                        <h3 className="text-xl font-bold border-b border-gray-700 pb-2 mb-4 capitalize">
                            {formData.category.replace("_", " ")} Details
                        </h3>

                        {formData.category === "near_miss" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderInput("Near Miss Title", "title")}
                                {renderInput("Near Miss Type", "near_miss_type")}
                                {renderInput("Date", "date", "date")}
                                {renderInput("Time", "time", "time")}
                                {renderInput("Location", "location")}
                                {renderInput("Reported Date & Time", "reported_date_time", "datetime-local")}
                                {renderInput("Department", "department")}
                                {renderInput("Process Type", "process_type")}
                                {renderInput("Person Type", "person_type")}
                                {renderInput("Witness", "witness", "text", false)}
                                {renderInput("Unsafe Act By", "unsafe_act_by")}
                                {renderInput("Responsible Area Manager", "responsible_area_manager")}

                                {renderTextArea("Near Miss Description", "description")}
                                {renderTextArea("Possible Consequences", "possible_consequences")}
                            </div>
                        )}

                        {(formData.category === "injury" || formData.category === "illness") && (
                            <div className="space-y-6">
                                {/* General Injury Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderInput(`${formData.category === 'illness' ? 'Illness' : 'Injury'} Title`, "title")}
                                    {renderInput("Location", "location")}
                                    {renderInput("Date", "date", "date")}
                                    {renderInput("Time", "time", "time")}
                                    {renderInput("Department", "department")}
                                    {renderInput("Reported Date & Time", "reported_date_time", "datetime-local")}
                                    {renderInput("Process Type", "process_type")}
                                    {renderInput("Witness", "witness", "text", false)}
                                    {renderInput("Object/Substances Involved", "object_substances_involved")}
                                    {renderTextArea("Possible Cause", "possible_cause")}
                                    {renderTextArea("Description", "description")}
                                    {renderTextArea("Immediate Action Taken", "immediate_action_taken")}
                                    {formData.category === "illness" && renderTextArea("Symptoms", "symptoms")}
                                </div>

                                {/* Person Affected Logic */}
                                <div className="border-t border-gray-700 pt-6">
                                    <h4 className="text-lg font-semibold mb-4 text-blue-400">Person Affected Details</h4>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Affected Person Type</label>
                                        <div className="flex gap-4">
                                            {["employee", "contractor"].map((type) => (
                                                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="person_affected_type"
                                                        value={type}
                                                        checked={formData.person_affected_type === type}
                                                        onChange={handleChange}
                                                        className="form-radio text-blue-500"
                                                    />
                                                    <span className="capitalize text-white">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Employee Fields */}
                                    {formData.person_affected_type === "employee" && (
                                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {renderInput("Employee Code", "employee_code")}
                                            {renderInput("Employee Name", "employee_name")}
                                            {renderInput("Injury Type", "injury_type")}
                                            {renderInput("Nature of Injury", "injury_nature")}
                                            {renderInput("Body Parts Affected", "body_parts_affected")}
                                        </div>
                                    )}

                                    {/* Contractor Fields */}
                                    {formData.person_affected_type === "contractor" && (
                                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                                                <select
                                                    name="contractor_type"
                                                    value={formData.contractor_type}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2.5 text-white outline-none"
                                                >
                                                    <option value="contractor">Contractor</option>
                                                    <option value="vendor">Vendor</option>
                                                    <option value="visitor">Visitor</option>
                                                </select>
                                            </div>
                                            {renderInput("Agency Name", "contractor_agency")}
                                            {renderInput("Name of Person", "contractor_name")}
                                            {renderInput("Nature of Injury", "injury_nature")}
                                            {renderInput("Body Parts Affected", "body_parts_affected")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Photo Upload */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Evidence Photos</label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition">
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
                        {loading ? "Submitting Report..." : "Submit Report"}
                    </button>
                </form>
            </div>
        </div>
    );
}
