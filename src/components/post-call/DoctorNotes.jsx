import React, { useEffect, useState } from "react";
import { fetchDoctorNotesByAppointment, updateDoctorNotesByAppointment } from "../../api/doctorNotes";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const DoctorNotes = ({ appointmentId, username }) => {
    const [notes, setNotes] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        title: "",
        doctor_notes: "",
        priority: "normal",
        tags: [],
    });
    const [currentTag, setCurrentTag] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchDoctorNotesByAppointment(appointmentId, username);
                setNotes(data);
                setForm({
                    title: data.data?.title || "",
                    doctor_notes: data.data?.doctor_notes || "",
                    priority: data.data?.priority || "normal",
                    tags: data.data?.tags || [],
                });
            } catch (e) {
                setNotes(null);
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();
    }, [appointmentId, username]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateDoctorNotesByAppointment(appointmentId, {
                userID: username,
                content: form.doctor_notes,
                priority: form.priority,
                title: form.title,
                tags: form.tags
            });
            setNotes({
                id: `${username}_${appointmentId}_DoctorNotes`,
                userID: username,
                session_id: appointmentId,
                type: "doctor_notes",
                data: { ...form },
                created_at: new Date().toISOString(),
                last_update: new Date().toISOString(),
            });
            setEditMode(false);
        } catch (e) {
            setError("Failed to save doctor notes");
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div className="p-4">Loading doctor notes...</div>;

    // Show message if no notes and not in edit mode
    if (!notes && !editMode) {
        return (
            <div className="max-w-xl mx-auto bg-white rounded shadow p-6 border border-blue-100 text-center">
                <div className="mb-4 text-gray-500">No doctor notes saved during video call.<br />You can now add new notes.</div>
                <Button size="sm" className="bg-blue-500 text-white" onClick={() => setEditMode(true)}>
                    Add Doctor Notes
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto bg-white rounded shadow p-6 border border-blue-100">
            {notes && !editMode && (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">Doctor Notes</h2>
                        <Button size="sm" onClick={() => setEditMode(true)} className="bg-blue-500 text-white">Edit</Button>
                    </div>
                    <div className="mb-2">
                        <span className="font-medium text-gray-700">Title:</span> {notes.data.title}
                    </div>
                    <div className="mb-2">
                        <span className="font-medium text-gray-700">Priority:</span> <Badge className="ml-1 bg-blue-100 text-blue-800 border border-blue-300">{notes.data.priority}</Badge>
                    </div>
                    <div className="mb-2">
                        <span className="font-medium text-gray-700">Tags:</span> {notes.data.tags && notes.data.tags.length > 0 ? notes.data.tags.map((tag, i) => (
                            <Badge key={i} className="ml-1 bg-blue-100 text-blue-800 border border-blue-300">{tag}</Badge>
                        )) : <span className="text-gray-400 ml-2">No tags</span>}
                    </div>
                    <div className="mb-2">
                        <span className="font-medium text-gray-700">Notes:</span>
                        <div className="bg-blue-50 border border-blue-100 rounded p-2 mt-1 text-gray-800 whitespace-pre-line">{notes.data.doctor_notes}</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Last updated: {new Date(notes.last_update).toLocaleString()}</div>
                </>
            )}
            {(!notes || editMode) && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">{notes ? "Edit Doctor Notes" : "Add Doctor Notes"}</h2>
                        {notes && <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>}
                    </div>
                    <Input
                        placeholder="Title"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="bg-blue-50 border-blue-200"
                    />
                    <Select value={form.priority} onValueChange={value => setForm(f => ({ ...f, priority: value }))}>
                        <SelectTrigger className="bg-blue-50 border-blue-200">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea
                        placeholder="Doctor notes..."
                        value={form.doctor_notes}
                        onChange={e => setForm(f => ({ ...f, doctor_notes: e.target.value }))}
                        rows={5}
                        className="bg-blue-50 border-blue-200"
                    />
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Input
                                placeholder="Add tag..."
                                value={currentTag}
                                onChange={e => setCurrentTag(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && currentTag.trim() && !form.tags.includes(currentTag.trim())) {
                                        setForm(f => ({ ...f, tags: [...f.tags, currentTag.trim()] }));
                                        setCurrentTag("");
                                    }
                                }}
                                className="text-xs flex-1 bg-blue-50 border-blue-200"
                            />
                            <Button
                                size="sm"
                                onClick={() => {
                                    if (currentTag.trim() && !form.tags.includes(currentTag.trim())) {
                                        setForm(f => ({ ...f, tags: [...f.tags, currentTag.trim()] }));
                                        setCurrentTag("");
                                    }
                                }}
                                disabled={!currentTag.trim()}
                                className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
                            >Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {form.tags.map((tag, i) => (
                                <Badge key={i} className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300">
                                    {tag}
                                    <span
                                        className="ml-1 cursor-pointer hover:text-red-500"
                                        onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}
                                    >×</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                    {error && <div className="text-red-500 text-xs">{error}</div>}
                    <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={handleSave}
                        disabled={saving}
                    >{saving ? "Saving..." : notes ? "Save Changes" : "Add Notes"}</Button>
                </div>
            )}
        </div>
    );
};

export default DoctorNotes;
