import React, { useState, useRef, useMemo, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const SeismicTimeDropdown = ({
  label,
  name,
  value,
  onChange,
  error,
  touched,
  toast,
}) => {
  const [open, setOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const wrapperRef = useRef(null); // for outside click
  const listRef = useRef(null);

  const formatTimeForDisplay = (hours24, minutes) => {
    const d = new Date();
    d.setHours(hours24, minutes, 0, 0);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const normalizeManualTime = (input) => {
    const raw = String(input || "")
      .trim()
      .toUpperCase()
      .replace(/\./g, "");

    if (!raw) return null;

    // Accept "12:45PM" and normalize to "12:45 PM"
    const normalized = raw
      .replace(/\s+/g, " ")
      .replace(/^(\d{1,2}:\d{2})(AM|PM)$/, "$1 $2");

    const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
    if (ampmMatch) {
      const hour12 = parseInt(ampmMatch[1], 10);
      const minute = parseInt(ampmMatch[2], 10);
      const meridiem = ampmMatch[3];

      if (hour12 < 1 || hour12 > 12 || minute < 0 || minute > 59) return null;

      let hour24 = hour12 % 12;
      if (meridiem === "PM") hour24 += 12;
      return formatTimeForDisplay(hour24, minute);
    }

    // Accept 24-hour format like "13:45"
    const twentyFourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourMatch) {
      const hour24 = parseInt(twentyFourMatch[1], 10);
      const minute = parseInt(twentyFourMatch[2], 10);

      if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
      return formatTimeForDisplay(hour24, minute);
    }

    return null;
  };

  // Generate all time slots (memoized)
  const times = useMemo(() => {
    const slots = [];
    const startMinutes = 0; // 12:00 AM
    const endMinutes = 23 * 60 + 59; // 11:59 PM upper bound

    for (let totalMinutes = startMinutes; totalMinutes <= endMinutes; totalMinutes += 15) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      const d = new Date();
      d.setHours(h, m, 0, 0);

      slots.push(
        d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }
    return slots;
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
        setManualMode(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Handle manual time input
  const handleManualTime = () => {
    if (!manualValue.trim()) {
      toast?.({
        title: "Time required",
        description: "Enter a valid appointment time.",
        variant: "destructive",
      });
      return;
    }

    const normalizedTime = normalizeManualTime(manualValue);
    if (!normalizedTime) {
      toast?.({
        title: "Invalid time format",
        description: "Try formats like 3:30 PM, 12:45PM, or 15:30.",
        variant: "destructive",
      });
      return;
    }

    onChange({ target: { name, value: normalizedTime } });
    setManualMode(false);
    setManualValue("");
    setOpen(false);
  };

  const isInvalid = touched && error;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Label */}
      <label className="block text-xs font-semibold text-black-600 mb-1">
        {label}
      </label>

      {/* Main button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setManualMode(false);
        }}
        className={`flex justify-between items-center w-full border rounded-md px-3 py-2 text-sm bg-white 
          ${isInvalid ? "border-red-500 bg-red-50" : "border-black-300"}`}
      >
        {value || "Select time"}
        <ChevronDown size={16} />
      </button>

      {/* ✅ INLINE ERROR MESSAGE (ADDED) */}
      {touched && error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white border rounded-xl shadow-xl"
        >
          {/* Manual entry option */}
          <div
            onClick={() => setManualMode(true)}
            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b text-blue-700 font-medium"
          >
            Enter time manually
          </div>

          {/* Manual input */}
          {manualMode && (
            <div className="px-3 py-2 bg-black-50 border-b">
              <input
                type="text"
                placeholder="e.g., 07:45 PM"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                className="border border-black-300 rounded-md w-full p-2 text-sm mb-2"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setManualMode(false);
                    setManualValue("");
                  }}
                  className="px-3 py-1 text-sm bg-black-300 rounded-md"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleManualTime}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Time list */}
          {times.map((t, index) => (
            <div
              key={t}
              data-index={index}
              onClick={() => {
                onChange({ target: { name, value: t } });
                setOpen(false);
              }}
              className="px-3 py-2 text-sm cursor-pointer text-black-800 hover:bg-blue-50"
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeismicTimeDropdown
