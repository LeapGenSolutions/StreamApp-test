import React, { useState, useRef, useEffect } from "react";
import DoctorMultiSelect from "../DoctorMultiSelect";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import TeamsDatePicker from "../TeamsDatePicker";

const viewOptions = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
];

const CustomToolbar = ({
  date,
  onNavigate,
  onView,
  view,
  selectedDoctors,
  onDoctorUpdate,
  isDropdownOpen,
  setDropdownOpen,
  onAddAppointment,
  onAddBulkAppointment,
}) => {
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);


  const viewMenuRef = useRef(null);
  const datePickerRef = useRef(null);
  const addMenuRef = useRef(null); 


  useEffect(() => {
    function handleClickOutside(e) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setViewMenuOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setDatePickerOpen(false);
      }

      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateLabel = () => {
    if (view === "day") return format(date, "EEEE MMM dd");

    if (view === "week") {
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = endOfWeek(date, { weekStartsOn: 0 });
      return `${format(start, "MMMM d")} – ${format(end, "MMMM d, yyyy")}`;
    }

    return format(date, "MMMM yyyy");
  };

  const label = formatDateLabel();

  const handleViewSelect = (value) => {
    setViewMenuOpen(false);
    onView(value);
  };

  const handleSelectDoctors = (ids, list, options = {}) => {
    onDoctorUpdate(ids, list);
    if (options.closeDropdown) setDropdownOpen(false);
  };

  const currentViewLabel =
    viewOptions.find((opt) => opt.value === view)?.label || "Week";

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-4">
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate("TODAY")}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-blue-100 hover:bg-blue-200"
        >
          <CalendarIcon size={14} />
          Today
        </button>

        <button
          onClick={() => onNavigate("PREV")}
          className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 hover:bg-blue-200"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => onNavigate("NEXT")}
          className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 hover:bg-blue-200"
        >
          <ChevronRight size={16} />
        </button>

        <div className="relative" ref={datePickerRef}>
          <button
            onClick={() => setDatePickerOpen((prev) => !prev)}
            className="flex items-center gap-1 text-base font-medium px-2 py-1"
          >
            {label}
            <ChevronDown size={16} />
          </button>

          {datePickerOpen && (
            <div className="absolute mt-2 z-30 bg-white border border-blue-200 rounded-lg shadow-lg">
            <TeamsDatePicker
              selectedDate={date}
              currentView={view}   
              onSelectDate={(d) => {
                setDatePickerOpen(false);
                onNavigate("DATE", d);
              }}
            />
            </div>
          )}
        </div>
      </div>


      <div className="flex items-center gap-3 flex-1 justify-center">
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setViewMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 text-sm bg-blue-100 px-3 py-1.5 rounded-md hover:bg-blue-200"
          >
            <CalendarIcon size={14} />
            {currentViewLabel}
            <ChevronDown size={14} />
          </button>

          {viewMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md border border-gray-200 shadow-md z-20">
              {viewOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    view === opt.value ? "text-blue-600 font-medium" : "text-gray-700"
                  }`}
                  onClick={() => handleViewSelect(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <DoctorMultiSelect
          selectedDoctors={selectedDoctors}
          onDoctorSelect={handleSelectDoctors}
          isDropdownOpen={isDropdownOpen}
          setDropdownOpen={setDropdownOpen}
        />
      </div>

      <div className="relative flex justify-end" ref={addMenuRef}>
        <button
          onClick={() => setShowAddMenu((prev) => !prev)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          + Add <ChevronDown size={14} />
        </button>

        {showAddMenu && (
          <div className="absolute right=0 mt-1 w-40 bg-white rounded-md border border-blue-200 shadow-md z-20 text-sm">
            <button
              className="block w-full text-left px-3 py-2 hover:bg-blue-100"
              onClick={() => {
                setShowAddMenu(false);
                onAddAppointment();
              }}
            >
              Add Appointment
            </button>

            <button
              className="block w-full text-left px-3 py-2 hover:bg-blue-100"
              onClick={() => {
                setShowAddMenu(false);
                onAddBulkAppointment();
              }}
            >
              Bulk Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomToolbar
