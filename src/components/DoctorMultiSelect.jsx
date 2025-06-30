import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown } from "lucide-react";
import { getColorFromName } from "../constants/colors";
import { fetchDoctors } from "../redux/doctors-actions";

export const doctorColorMap = {};

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
};

const DoctorMultiSelect = ({
  className = "",
  selectedDoctors,
  onDoctorSelect,
  isDropdownOpen,
  setDropdownOpen,
}) => {
  const reduxEmail = useSelector((state) => state.me?.me?.email);
  const email = reduxEmail?.trim().toLowerCase();

  const [doctorOptions, setDoctorOptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSelection, setTempSelection] = useState([]);
  const [defaultSelection, setDefaultSelection] = useState([]);
  const dropdownRef = useRef(null);
  const hasPreselected = useRef(false);
  const rawDoctors = useSelector((state) => state.doctors?.doctors || []);
  const dispatch  = useDispatch();

  useEffect(() => {
    if(rawDoctors.length === 0){
      dispatch(fetchDoctors());
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const enriched = rawDoctors
          .filter((doc) => doc.fullName && doc.userID)
          .map((doc) => {
            const emailKey = (doc.userID || "").trim().toLowerCase();
            const color = getColorFromName(emailKey);
            doctorColorMap[emailKey] = color;

            return {
              email: emailKey,
              fullName: doc.fullName,
              initials: getInitials(doc.fullName),
              color,
            };
          });

        setDoctorOptions(enriched);

        if (email && !hasPreselected.current && selectedDoctors.length === 0) {
          const match = enriched.find((doc) => doc.email === email);
          if (match) {
            onDoctorSelect([match.email], [match]);
            setDefaultSelection([match.email]);
            hasPreselected.current = true;
          }
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };

    loadDoctors();
  }, [email, onDoctorSelect, selectedDoctors.length, rawDoctors]);

  useEffect(() => {
    if (isDropdownOpen) {
      setTempSelection([...selectedDoctors]);
    }
  }, [isDropdownOpen, selectedDoctors]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setDropdownOpen]);

  const toggleDoctor = (email) => {
    setTempSelection((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const allSelected =
    doctorOptions.length > 0 && tempSelection.length === doctorOptions.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setTempSelection([]);
    } else {
      setTempSelection(doctorOptions.map((doc) => doc.email));
    }
  };

  const handleApply = () => {
    const enrichedList = doctorOptions.filter((doc) =>
      tempSelection.includes(doc.email)
    );
    onDoctorSelect(tempSelection, enrichedList, { closeDropdown: true });
    setDropdownOpen(false);
  };

  const handleUndo = (e) => {
    e?.stopPropagation();
    const enrichedList = doctorOptions.filter((doc) =>
      defaultSelection.includes(doc.email)
    );
    onDoctorSelect(defaultSelection, enrichedList, { closeDropdown: false });
    setTempSelection(defaultSelection);
  };

  const getPlaceholder = () => {
    const liveSelection = isDropdownOpen ? tempSelection : selectedDoctors;
    if (doctorOptions.length > 0 && liveSelection.length === doctorOptions.length)
      return "All Selected";
    if (liveSelection.length === 1) return "Selected 1";
    if (liveSelection.length > 1) return `Selected ${liveSelection.length}`;
    return "Select doctors";
  };

  const filteredDoctors = doctorOptions.filter((doc) =>
    doc.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedDocs = filteredDoctors.filter((doc) =>
    tempSelection.includes(doc.email)
  );
  const unselectedDocs = filteredDoctors.filter(
    (doc) => !tempSelection.includes(doc.email)
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center justify-between w-64 h-10 border border-gray-300 rounded-md px-4 text-sm bg-white shadow-sm hover:border-blue-500 cursor-pointer select-none"
      >
        <span>{getPlaceholder()}</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>

      {isDropdownOpen && (
        <div className="absolute mt-2 w-64 border rounded-md bg-white shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="p-2 sticky top-0 bg-white z-10">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div
            className="px-3 py-2 border-b text-sm hover:bg-gray-100 cursor-pointer select-none"
            onClick={handleSelectAll}
          >
            {allSelected ? "Unselect All" : "Select All"}
          </div>

          {[...selectedDocs, ...unselectedDocs].map((doc) => (
            <div
              key={doc.email}
              className="flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition select-none"
              onClick={() => toggleDoctor(doc.email)}
            >
              <input
                type="checkbox"
                checked={tempSelection.includes(doc.email)}
                readOnly
                className="mr-3 accent-blue-600 pointer-events-none"
              />
              <span
                className="w-6 h-6 flex items-center justify-center rounded-full text-white font-semibold text-xs mr-3"
                style={{ backgroundColor: doc.color }}
              >
                {doc.initials}
              </span>
              <span className="text-gray-800">{doc.fullName}</span>
            </div>
          ))}

          <div className="sticky bottom-0 bg-white border-t px-3 py-2 flex justify-between">
            <button
              onClick={(e) => handleUndo(e)}
              className="px-3 py-1 bg-gray-300 text-sm rounded hover:bg-gray-400 select-none"
            >
              Undo
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 select-none"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorMultiSelect;
