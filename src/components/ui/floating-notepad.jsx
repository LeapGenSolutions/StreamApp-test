
import { useState, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { StickyNote, Save, X, RotateCcw, Tag, Clock } from "lucide-react";
import { updateDoctorNotesByAppointment } from "../../api/doctorNotes";
import { useSelector } from "react-redux";

export function FloatingNotepad({
    isOpen,
    onClose,
    patientName,
    meetingStartTime,
    appointmentId,
    isVideoCall = false
}) {
    const myEmail = useSelector((state) => state.me.me.email);
    const [noteData, setNoteData] = useState({
        title: "",
        content: "",
        patientName: patientName || "",
        priority: "normal",
        tags: [],
        images: [],
        userID: myEmail
    });
    const [currentTag, setCurrentTag] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [elapsedTime, setElapsedTime] = useState("");

    // Auto-save functionality
    const handleAutoSave = useCallback(async () => {
        if (!noteData.content && !noteData.title) return;
        setIsSaving(true);
        try {
            // You may want to add userID to noteData if required by your API
            await updateDoctorNotesByAppointment(appointmentId, noteData);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Auto-save failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [noteData, appointmentId]);

    useEffect(() => {
        if (noteData.content || noteData.title) {
            const timer = setTimeout(() => {
                handleAutoSave();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [noteData.content, noteData.title, handleAutoSave]);

    // Update word count
    useEffect(() => {
        const words = noteData.content.trim().split(/\s+/).filter(word => word.length > 0);
        setWordCount(words.length);
    }, [noteData.content]);

    useEffect(() => {
        if (!meetingStartTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.floor((now - meetingStartTime) / 1000);
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsedTime(`${mins}m ${secs}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [meetingStartTime]);

    if (!isOpen) return null;

    return (
        <div className="fixed right-5 bottom-[7rem] w-[30vw] h-[65vh] bg-white shadow-lg z-50 flex flex-col border-l border-blue-200">

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-blue-500" />
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Quick Notes</h2>
                        {isVideoCall && (
                            <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-800 border border-blue-300">
                                🟢 Live Session
                            </Badge>
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Patient Info */}
            {patientName && (
                <div className="bg-blue-50 p-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">{patientName}</h3>
                            <p className="text-xs text-gray-500">Checkup Appointment</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-500">
                                ⏱️ {elapsedTime ? `Live for ${elapsedTime}` : "Starting..."}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">

                {/* Title */}
                <Input
                    placeholder="Note title..."
                    value={noteData.title}
                    onChange={(e) => setNoteData(prev => ({ ...prev, title: e.target.value }))}
                    className="font-medium bg-blue-50 border-blue-200 text-gray-900 placeholder-gray-400"
                />

                {/* Priority */}
                <Select value={noteData.priority} onValueChange={(value) => setNoteData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="bg-blue-50 border-blue-200 text-gray-900">
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-200">
                        <SelectItem value="low" className="text-gray-800">Low Priority</SelectItem>
                        <SelectItem value="normal" className="text-gray-800">Normal Priority</SelectItem>
                        <SelectItem value="high" className="text-gray-800">High Priority</SelectItem>
                    </SelectContent>
                </Select>

                {/* Content */}
                <Textarea
                    placeholder="Take notes during the consultation..."
                    value={noteData.content}
                    onChange={(e) => setNoteData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="resize-none bg-blue-50 border-blue-200 text-gray-900 placeholder-gray-400"
                />
                <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>{wordCount} words</span>
                    {isSaving && <span>Saving...</span>}
                    {lastSaved && !isSaving && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Input
                            placeholder="Add tag..."
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (currentTag.trim() && !noteData.tags.includes(currentTag.trim())) {
                                        setNoteData(prev => ({
                                            ...prev,
                                            tags: [...prev.tags, currentTag.trim()]
                                        }));
                                        setCurrentTag("");
                                    }
                                }
                            }}
                            className="text-xs flex-1 bg-blue-50 border-blue-200 text-gray-900 placeholder-gray-400"
                        />
                        <Button
                            size="sm"
                            onClick={() => {
                                if (currentTag.trim() && !noteData.tags.includes(currentTag.trim())) {
                                    setNoteData(prev => ({
                                        ...prev,
                                        tags: [...prev.tags, currentTag.trim()]
                                    }));
                                    setCurrentTag("");
                                }
                            }}
                            disabled={!currentTag.trim()}
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300"
                        >
                            <Tag className="w-3 h-3" />
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {noteData.tags.map((tag, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-300"
                            >
                                {tag}
                                <X
                                    className="w-2 h-2 cursor-pointer hover:text-red-500"
                                    onClick={() => {
                                        setNoteData(prev => ({
                                            ...prev,
                                            tags: prev.tags.filter((t) => t !== tag)
                                        }));
                                    }}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-blue-200 bg-blue-50">
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    {patientName && (
                        <span className="text-blue-600 font-medium">Patient: {patientName}</span>
                    )}
                </div>
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setNoteData({
                                title: "",
                                content: "",
                                patientName: patientName || "",
                                priority: "normal",
                                tags: [],
                                images: [],
                                userID: myEmail
                            });
                            setCurrentTag("");
                            setLastSaved(null);
                        }}
                        className="flex-1 border-blue-300 text-gray-800 hover:bg-blue-100"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> Clear
                    </Button>
                    <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
                        onClick={handleAutoSave}
                        disabled={isSaving}
                    >
                        <Save className="w-3 h-3 mr-1" />
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 