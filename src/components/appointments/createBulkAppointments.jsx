import React, { useState, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { BACKEND_URL } from "../../constants";

const CreateBulkAppointments = ({ onClose }) => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const doctor_email= useSelector((state) => state.me.me.email);
    const doctors = useSelector((state) => state.doctors.doctors);

    const doctor_details = doctors.find(doc => doc.id === doctor_email) || {};
    console.log("Doctor Details:", doctor_details);
    const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    ];

    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e?.target?.files?.[0];

        if (!selected) {
            setMessage("No file selected");
            setFile(null);
            return;
        }

        if (!allowedTypes.includes(selected.type)) {
            setMessage("Please select a valid Excel file (xlsx or xls)");
            setFile(null);
            return;
        }

        setMessage("");
        setFile(selected);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer?.files?.[0];
        if (dropped) {
            // emulate input event shape
            handleFileChange({ target: { files: [dropped] } });
        }
    };

    const openFileDialog = () => fileInputRef.current && fileInputRef.current.click();

    const removeFile = () => {
        setFile(null);
        setMessage("");
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    const handleUpload = async () => {
        if(!file) {
            setMessage("Please select a file first!");
            return;
        }

        try{
            const formData = new FormData();
            formData.append("file", file);
            formData.append("data", JSON.stringify({
                "doctor_name": doctor_details.doctor_name || "",
                "doctor_email": doctor_details.doctor_email || "",
                "specialization": doctor_details.specialization || "",
                "practice_id": "99999",
                "doctor_id": doctor_details.doctor_id || ""
            }))

            const response = await axios.post(`${BACKEND_URL}api/appointments/bulk/appointments`, formData, {
                 headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setMessage("✔ Uploaded Successfully: " + (response?.data?.fileUrl ?? ""));
        } catch (err) {
            console.error(err);
            setMessage("❌ Upload failed: " + (err?.message ?? ""));
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={(e) => {
                if (e.target === e.currentTarget && typeof onClose === "function") onClose();
            }}
        >
            <div
                className="bg-white shadow-xl rounded-xl w-full max-w-2xl mx-4 overflow-hidden border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 bg-blue-600">
                    <h2 className="text-white text-lg font-semibold">Upload Excel File</h2>
                    <button
                        onClick={onClose}
                        className="text-white text-2xl leading-none"
                        aria-label="Close bulk upload"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-700 mb-4">
                        Please upload an Excel file (.xlsx or .xls) containing the appointment details.
                    </p>

                    <div
                        className={`w-full mb-3 rounded-lg p-8 border-2 ${isDragging ? 'border-blue-600 bg-blue-50' : 'border-dashed border-blue-300'} flex flex-col items-center justify-center text-center cursor-pointer`}
                        onDragOver={onDragOver}
                        onDragEnter={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        role="button"
                        tabIndex={0}
                        onClick={openFileDialog}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileChange}
                            accept=".xlsx,.xls"
                            className="hidden"
                        />

                        <div className="text-xl font-semibold text-blue-700 mb-2">Choose a file or drag & drop</div>
                        <div className="text-sm text-gray-500 mb-4">(Max 2GB) — .xlsx or .xls</div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openFileDialog(); }}
                            className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                        >
                            Browse files
                        </button>
                    </div>

                    {file && (
                        <div className="mb-4 flex items-center justify-between text-sm text-gray-700">
                            <div className="flex items-center gap-4">
                                <div>
                                    <strong>{file.name}</strong>
                                    <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                                </div>
                                <button onClick={removeFile} className="text-sm text-red-600 hover:underline bg-red-50 px-2 py-1 rounded">Remove</button>
                            </div>
                            <div className="text-xs text-gray-500">Allowed: .xlsx, .xls</div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => typeof onClose === "function" && onClose()}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>

                        <button
                            onClick={handleUpload}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
                        >
                            Upload
                        </button>
                    </div>

                    {message && (
                        <div className={`mt-4 p-3 rounded-md text-sm ${message.startsWith("✔") ? "bg-green-50 text-green-800 border border-green-100" : message.startsWith("❌") ? "bg-red-50 text-red-800 border border-red-100" : "bg-blue-50 text-blue-800 border border-blue-100"}`}>
                            {message.replace(/^✔\s?|^❌\s?/, "")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateBulkAppointments;
