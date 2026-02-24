import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

const RightPanel = ({ lines = [] }) => {
  const [location] = useLocation();
  const pathname = location || "";
  const isMeeting = pathname.startsWith('/meeting-room');

  // hooks must run unconditionally
  const [headerHeight, setHeaderHeight] = useState(0);
  const [displayLines, setDisplayLines] = useState(lines || []);
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
    if (lines && lines.length) setDisplayLines(lines.slice(-200));
  }, [lines]);

  // listen for global realtime-transcript events and append
  useEffect(() => {
    const handler = (ev) => {
      const d = ev && ev.detail ? ev.detail : null;
      if (!d) return;
      setDisplayLines((prev) => {
        const next = [...prev, d].slice(-200);
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
      <aside data-rightpanel style={asideStyle} className="hidden md:flex md:flex-col md:fixed md:right-0 w-80 border-l border-neutral-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <h3 className="text-sm font-semibold text-neutral-700">Transcription</h3>
        <p className="text-xs text-neutral-500">Live captions & call data</p>
      </div>

      <div className="p-4 flex-1 min-h-0">
        <div ref={containerRef} className="h-full bg-neutral-50 rounded p-3 text-sm text-neutral-700 overflow-y-auto">
          {(!displayLines || displayLines.length === 0) ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-neutral-500 text-center px-4">
              Listening for speech — transcription will appear automatically when someone speaks.
            </div>
          ) : (
            <div>
              {displayLines.map((l, idx) => (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between items-baseline">
                    <div className="text-xs text-neutral-700 font-semibold">{l.speaker || 'Speaker'}</div>
                    <div className="text-xs text-neutral-400">{l.time ? new Date(l.time).toLocaleTimeString() : ''}</div>
                  </div>
                  <div className="mt-1">{l.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default RightPanel;
