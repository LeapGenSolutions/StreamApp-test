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

  // Generate all time slots (memoized)
  const times = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 18; h++) {
      for (let m = 0; m < 60; m += 15) {
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
    }
    return slots;
  }, []);

  // ⭐ CLICK OUTSIDE TO CLOSE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);     // close dropdown
        setManualMode(false); // close manual box if open
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
    const parsed = new Date(`1970-01-01 ${manualValue}`);
    if (isNaN(parsed)) {
      toast?.({
        title: "Invalid time format",
        description: "Try formats like 3:30 PM or 15:30.",
        variant: "destructive",
      });
      return;
    }

    onChange({ target: { name, value: manualValue } });
    setManualMode(false);
    setOpen(false);
  };

  const isInvalid = touched && error;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Label */}
      <label className="block text-xs font-semibold text-black-600 mb-1">
        {label}
      </label>

      {/* MAIN BUTTON */}
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

      {/* DROPDOWN */}
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white border rounded-xl shadow-xl"
        >
          {/* MANUAL ENTRY OPTION */}
          <div
            onClick={() => setManualMode(true)}
            className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 border-b text-blue-700 font-medium"
          >
            Enter time manually
          </div>

          {/* MANUAL INPUT BOX */}
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

          {/* TIME LIST */}
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