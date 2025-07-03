import { useRef, useState } from "react";
import { CHATBOT_URL } from "../../constants";
import { useLocation } from "wouter";



const ChatbotWindow = () => {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [iframeKey, setIframeKey] = useState(Date.now()); // for reload/close
    const iframeRef = useRef();
    const [location] = useLocation();
    const isMeetingPage = location.startsWith("/meeting-room/");
    const SIDEBAR_WIDTH = 256;

    // Open button (always visible)
    const openButton = (
        <button
            onClick={() => {
                setOpen(true);
                setMinimized(false);
                setIframeKey(Date.now()); // new session on open
            }}
            style={{
                position: "fixed",
                bottom: 24,
                left: isMeetingPage ? SIDEBAR_WIDTH + 24 : "auto",
                right: isMeetingPage ? "auto" : 24,
                transition: "left 0.3s ease, right 0.3s ease",
                zIndex: 101,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 9999,
                width: 56,
                height: 56,
                boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                cursor: "pointer",
                fontSize: 28,
                display: open ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center"
            }}
            aria-label="Open Chatbot"
        >
            💬
        </button>
    );

    // Chatbot window
    const chatbotWindow = open && (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                left: isMeetingPage ? SIDEBAR_WIDTH + 24 : "auto",
                right: isMeetingPage ? "auto" : 24,
                zIndex: 100,
                resize: minimized ? undefined : "both",
                overflow: "auto",
                minWidth: minimized ? 165 : 320,
                minHeight: minimized ? 48 : 400,
                maxWidth: 600,
                maxHeight: 800,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                width: minimized ? 165 : undefined,
                height: minimized ? 45 : undefined,
                transition: "all 0.2s"
            }}
        >
            {/* Header with controls */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f3f4f6",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                padding: "8px 12px"
            }}>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>Chatbot</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setMinimized((m) => !m)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title={minimized ? "Expand" : "Minimize"}
                    >
                        {minimized ? "🗖" : "🗕"}
                    </button>
                    <button
                        onClick={() => setIframeKey(Date.now())}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title="Reload"
                    >
                        🔄
                    </button>
                    <button
                        onClick={() => {
                            setOpen(false);
                            setMinimized(false);
                            setIframeKey(Date.now()); // new session on next open
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title="Close"
                    >
                        ✖
                    </button>
                </div>
            </div>
            <iframe
                key={iframeKey}
                ref={iframeRef}
                src={CHATBOT_URL}
                title="Chatbot"
                width="100%"
                height="100%"
                style={{
                    border: "none", display: minimized ? "none" : "block",
                    minWidth: 320, minHeight: 400, borderRadius: 12
                }}
                allow="clipboard-write;"
            />
        </div>
    );

    return (
        <>
            {openButton}
            {chatbotWindow}
        </>
    );
};

export default ChatbotWindow;
