import React from "react";
import DoctorMultiSelect from "../DoctorMultiSelect";

const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  selectedDoctors,
  onDoctorUpdate,
  isDropdownOpen,
  setDropdownOpen,
  onAddAppointment, //  new prop for Add button
}) => {
  const handleSelect = (ids, enrichedList, options = {}) => {
    onDoctorUpdate(ids, enrichedList);
    if (options.closeDropdown) {
      setDropdownOpen(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 mb-2">
      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("TODAY")}
          className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate("PREV")}
          className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={() => onNavigate("NEXT")}
          className="text-sm px-2 py-1 border rounded hover:bg-gray-100"
        >
          Next
        </button>
      </div>

      {/* Title + Doctor Dropdown */}
      <div className="flex items-center gap-4">
        <div className="text-base font-medium whitespace-nowrap">{label}</div>
        <div className="relative z-20">
          <DoctorMultiSelect
            selectedDoctors={selectedDoctors}
            onDoctorSelect={handleSelect}
            isDropdownOpen={isDropdownOpen}
            setDropdownOpen={setDropdownOpen}
          />
        </div>
      </div>

      {/* Right-side controls: View switch + Add button */}
      <div className="flex items-center gap-2">
        {["day", "week", "agenda"].map((v) => (
          <button
            key={v}
            className={`text-sm px-2 py-1 border rounded hover:bg-gray-100 ${
              view === v ? "bg-blue-500 text-white font-medium" : ""
            }`}
            onClick={() => onView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}

        {/*  Add Appointment button */}
        <button
          onClick={onAddAppointment}
          className="ml-2 bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 shadow-sm"
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export default CustomToolbar
