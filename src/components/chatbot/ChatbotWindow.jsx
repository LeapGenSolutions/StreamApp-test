import { useRef, useState, useEffect, useCallback} from "react";
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
    const [windowSize, setWindowSize] = useState({ width: 320, height: 400 });
    const [isResizing, setIsResizing] = useState(false);
    const chatbotWindowRef = useRef(null);
    // store the starting values to avoid jumps when starting resize
    const resizeStartRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
    // toggle depending on where the handle lives; we placed it in top-left
    const HANDLE_TOP_LEFT = true;

    const onPointerDownResize = useCallback((e) => {
        // use pointer events to support mouse/touch/pen
        const point = e.touches ? e.touches[0] : e;
        const rect = chatbotWindowRef.current?.getBoundingClientRect();
        if (!rect) return;
        resizeStartRef.current = {
            startX: point.clientX,
            startY: point.clientY,
            startWidth: rect.width,
            startHeight: rect.height
        };
        setIsResizing(true);
        // capture pointer to ensure we keep receiving events (if pointer events available)
        if (e.target && e.target.setPointerCapture) {
            try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        e.preventDefault?.();
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!isResizing || !chatbotWindowRef.current) return;
        const point = e.touches ? e.touches[0] : e;
        const { startX, startY, startWidth, startHeight } = resizeStartRef.current;
        const deltaX = point.clientX - startX;
        const deltaY = point.clientY - startY;

        let newWidth;
        let newHeight;
        if (HANDLE_TOP_LEFT) {
            // For a top-left handle, moving pointer right should decrease width (left edge moves right)
            newWidth = Math.round(startWidth - deltaX);
            newHeight = Math.round(startHeight - deltaY);
        } else {
            // bottom-right or default behavior
            newWidth = Math.round(startWidth + deltaX);
            newHeight = Math.round(startHeight + deltaY);
        }

        setWindowSize({
            width: Math.max(320, Math.min(600, newWidth)),
            height: Math.max(400, Math.min(700, newHeight))
        })

        e.preventDefault?.();
    }, [isResizing, HANDLE_TOP_LEFT]);

    const onPointerUp = useCallback((e) => {
        setIsResizing(false);
        // release capture
        if (e.target && e.target.releasePointerCapture) {
            try { e.target.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }, []);

    useEffect(() => {
        if (isResizing) {
            // listen broadly so pointer events outside the element are captured
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
            // fallback for touch/mouse older browsers
            document.addEventListener("mousemove", onPointerMove);
            document.addEventListener("mouseup", onPointerUp);
            document.addEventListener("touchmove", onPointerMove, { passive: false });
            document.addEventListener("touchend", onPointerUp);
        }
        return () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("mousemove", onPointerMove);
            document.removeEventListener("mouseup", onPointerUp);
            document.removeEventListener("touchmove", onPointerMove);
            document.removeEventListener("touchend", onPointerUp);
        };
    }, [isResizing, onPointerMove, onPointerUp]);

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
            ref={chatbotWindowRef}
            style={{
                position: "fixed",
                bottom: 24,
                left: isMeetingPage ? SIDEBAR_WIDTH + 24 : "auto",
                right: isMeetingPage ? "auto" : 24,
                zIndex: 100,
                resize: minimized ? undefined : "both",
                overflow: "hidden",
                minWidth: minimized ? 165 : 320,
                minHeight: minimized ? 48 : 400,
                maxWidth: 600,
                maxHeight: 800,
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                width: minimized ? 165 : windowSize.width,
                height: minimized ? 45 : windowSize.height,
                transition: "all 0.2s"
            }}
        >
            {/* Header with controls */}
            <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f3f4f6",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                padding: "8px 12px",
                paddingLeft: minimized ? 12 : 44 // smaller padding when minimized so title sits flush left
            }}>
                {/* Resize handle placed inside header to avoid overlap with title/buttons */}
                {!minimized && (
                    <div
                        onPointerDown={onPointerDownResize}
                        onTouchStart={onPointerDownResize}
                        style={{
                            position: "absolute",
                            left: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 18,
                            height: 18,
                            cursor: "nwse-resize",
                            backgroundColor: "#2563eb",
                            borderRadius: 6,
                            zIndex: 5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 12,
                            userSelect: "none"
                        }}
                        aria-label="Resize chat window"
                        role="separator"
                    >
                        ⤡
                    </div>
                )}

                <span style={{ fontWeight: 600, color: "#2563eb" }}>Chatbot</span>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={() => setMinimized((m) => !m)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title={minimized ? "Expand" : "Minimize"}
                    >
                        {minimized 
                        ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg> 
                        : <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>}
                    </button>
                    <button
                        onClick={() => setIframeKey(Date.now())}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                        title="Reload"
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.84998 7.49998C1.84998 4.66458 4.05979 1.84998 7.49998 1.84998C10.2783 1.84998 11.6515 3.9064 12.2367 5H10.5C10.2239 5 10 5.22386 10 5.5C10 5.77614 10.2239 6 10.5 6H13.5C13.7761 6 14 5.77614 14 5.5V2.5C14 2.22386 13.7761 2 13.5 2C13.2239 2 13 2.22386 13 2.5V4.31318C12.2955 3.07126 10.6659 0.849976 7.49998 0.849976C3.43716 0.849976 0.849976 4.18537 0.849976 7.49998C0.849976 10.8146 3.43716 14.15 7.49998 14.15C9.44382 14.15 11.0622 13.3808 12.2145 12.2084C12.8315 11.5806 13.3133 10.839 13.6418 10.0407C13.7469 9.78536 13.6251 9.49315 13.3698 9.38806C13.1144 9.28296 12.8222 9.40478 12.7171 9.66014C12.4363 10.3425 12.0251 10.9745 11.5013 11.5074C10.5295 12.4963 9.16504 13.15 7.49998 13.15C4.05979 13.15 1.84998 10.3354 1.84998 7.49998Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
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
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
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
                    minWidth: 336, minHeight: 400, borderRadius: 12
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
