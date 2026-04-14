import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import VBCChecklist from "../VBCChecklist";

const MAX_TRANSCRIPT_LINES = 120;
const DUPLICATE_WINDOW_MS = 1800;

const normalizeTranscriptText = (value = "") =>
  String(value).replace(/\s+/g, " ").trim();

const shouldIgnoreTranscript = (text) => {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return true;

  const ignoredValues = new Set([
    ".",
    "..",
    "...",
    "[noise]",
    "(noise)",
    "[inaudible]",
    "(inaudible)",
  ]);

  return ignoredValues.has(normalized);
};

const RightPanel = ({
  lines,
  appointmentId,
  doctorName = "",
  doctorEmail = "",
  showChecklist = false,
}) => {
  const [location] = useLocation();
  const pathname = location || "";
  const isMeeting = pathname.startsWith('/meeting-room');

  // hooks must run unconditionally
  const [headerHeight, setHeaderHeight] = useState(0);
  const [displayLines, setDisplayLines] = useState(Array.isArray(lines) ? lines : []);
  const [isMobileChecklistOpen, setIsMobileChecklistOpen] = useState(false);
  const [isDesktopChecklistOpen, setIsDesktopChecklistOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      try {
        const hdr = document.querySelector('header');
        const h = hdr ? Math.round(hdr.getBoundingClientRect().height) : 0;
        setHeaderHeight(h);
      } catch (e) {
        setHeaderHeight(0);
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [location]);

  // when `lines` prop changes (e.g., from parent), reflect it
  useEffect(() => {
    if (!Array.isArray(lines)) {
      return;
    }

    if (lines.length === 0) {
      setDisplayLines((previous) => (previous.length === 0 ? previous : []));
      return;
    }

    const cleaned = lines
      .map((line) => ({
        ...line,
        text: normalizeTranscriptText(line?.text),
        is_final: line?.is_final !== false,
      }))
      .filter((line) => line.text && !shouldIgnoreTranscript(line.text))
      .slice(-MAX_TRANSCRIPT_LINES);

    setDisplayLines(cleaned);
  }, [lines]);

  // Listen for realtime transcript events and merge partial/final updates.
  useEffect(() => {
    const handler = (ev) => {
      const d = ev && ev.detail ? ev.detail : null;
      if (!d) return;

      const text = normalizeTranscriptText(d.text);
      if (!text || shouldIgnoreTranscript(text)) return;

      const incoming = {
        ...d,
        text,
        speaker: d.speaker || "Speaker",
        time: Number.isFinite(d.time) ? d.time : Date.now(),
        is_final: d.is_final !== false,
      };

      setDisplayLines((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        const normalizedIncoming = incoming.text.toLowerCase();

        if (last) {
          const normalizedLast = normalizeTranscriptText(last.text).toLowerCase();
          const sameSpeaker =
            String(last.speaker || "").toLowerCase() ===
            String(incoming.speaker || "").toLowerCase();
          const withinDedupeWindow =
            Math.abs((incoming.time || 0) - (last.time || 0)) < DUPLICATE_WINDOW_MS;
          const isDuplicate =
            withinDedupeWindow &&
            sameSpeaker &&
            normalizedIncoming === normalizedLast;

          if (isDuplicate) {
            if (incoming.is_final && !last.is_final) {
              next[next.length - 1] = incoming;
              return next;
            }
            return prev;
          }

          if (sameSpeaker && !last.is_final) {
            next[next.length - 1] = incoming;
            return next;
          }
        }

        next.push(incoming);
        if (next.length > MAX_TRANSCRIPT_LINES) {
          return next.slice(-MAX_TRANSCRIPT_LINES);
        }

        return next;
      });
    };

    window.addEventListener('realtime-transcript', handler);
    return () => window.removeEventListener('realtime-transcript', handler);
  }, []);

  // autoscroll when displayLines updates
  useEffect(() => {
    try {
      if (containerRef.current) {
        const el = containerRef.current;
        // only auto-scroll if user is already near the bottom
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const THRESHOLD = 80; // px tolerance to consider "at bottom"
        if (distanceFromBottom < THRESHOLD) {
          el.scrollTop = el.scrollHeight;
        }
      }
    } catch (e) {}
  }, [displayLines]);

  const asideStyle = headerHeight ? { top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` } : { top: '0px', height: '100vh' };

  // Only show the panel when in the meeting-room route
  if (!isMeeting) return null;

  return (
    <>
      <style>{`:root{ --rightpanel-offset: 320px; }`}</style>
      {showChecklist && (
        <div className="md:hidden fixed right-3 bottom-24 z-30">
        <button
          onClick={() => setIsMobileChecklistOpen((prev) => !prev)}
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          {isMobileChecklistOpen ? "Hide VBC Checklist" : "Show VBC Checklist"}
        </button>
        </div>
      )}

      {showChecklist && isMobileChecklistOpen && (
        <div className="md:hidden fixed inset-x-3 bottom-36 z-30 max-h-[56vh] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
            <h3 className="text-sm font-semibold text-neutral-800">VBC Checklist</h3>
            <button
              onClick={() => setIsMobileChecklistOpen(false)}
              className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600"
            >
              Close
            </button>
          </div>
          <div className="max-h-[calc(56vh-44px)] overflow-y-auto p-3">
            <VBCChecklist
              appointmentId={appointmentId}
              doctorName={doctorName}
              doctorEmail={doctorEmail}
            />
          </div>
        </div>
      )}

      <aside
        data-rightpanel
        style={asideStyle}
        className="hidden md:flex md:flex-col md:fixed md:right-0 w-80 border-l border-neutral-200 bg-white overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-700">Transcription</h3>
            <p className="text-xs text-neutral-500">Live captions & call data</p>
          </div>
          {showChecklist && (
            <button
              type="button"
              onClick={() => setIsDesktopChecklistOpen((prev) => !prev)}
              className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700"
            >
              {isDesktopChecklistOpen ? "Close" : "VBC Checklist"}
            </button>
          )}
        </div>

        <div className="relative p-4 flex-1 min-h-0">
          <div
            ref={containerRef}
            className="h-full bg-neutral-50 rounded p-3 text-sm text-neutral-700 overflow-y-auto"
          >
            {!displayLines || displayLines.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500 text-center px-4">
                Listening for speech — transcription will appear automatically when someone speaks.
              </div>
            ) : (
              <div>
                {displayLines.map((l, idx) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between items-baseline">
                      <div className="text-xs text-neutral-700 font-semibold">
                        {l.speaker || 'Speaker'}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {l.time ? new Date(l.time).toLocaleTimeString() : ''}
                      </div>
                    </div>
                    <div className={`mt-1 ${l.is_final ? "" : "italic text-neutral-500"}`}>
                      {l.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showChecklist && isDesktopChecklistOpen && (
            <div className="absolute inset-4 z-10 overflow-hidden rounded border border-neutral-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
                <h3 className="text-sm font-semibold text-neutral-800">VBC Checklist</h3>
                <button
                  type="button"
                  onClick={() => setIsDesktopChecklistOpen(false)}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600"
                >
                  Close
                </button>
              </div>
              <div className="h-[calc(100%-45px)] overflow-y-auto p-3">
                <VBCChecklist
                  appointmentId={appointmentId}
                  doctorName={doctorName}
                  doctorEmail={doctorEmail}
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default RightPanel;
