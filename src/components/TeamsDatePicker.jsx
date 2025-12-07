import React, { useState, useMemo } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameWeek,
  format,
  getYear,
  getMonth,
  setMonth,
  setYear,
} from "date-fns";

const monthNames = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec",
];

const TeamsDatePicker = ({ selectedDate, onSelectDate, currentView }) => {
  const [leftMonth, setLeftMonth] = useState(startOfMonth(selectedDate));
  const [rightYear, setRightYear] = useState(getYear(selectedDate));

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(leftMonth);
    const monthEnd = endOfMonth(leftMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const allDays = [];
    let current = start;

    while (current <= end) {
      allDays.push(current);
      current = addMonths(current, 0);
      current = new Date(current.setDate(current.getDate() + 1));
    }

    const result = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }

    return result;
  }, [leftMonth]);

  const handleSelectDay = (day) => {
    onSelectDate(day);
  };
  const handleSelectMonthTile = (monthIndex) => {
    const updated = setMonth(setYear(leftMonth, rightYear), monthIndex);
    setLeftMonth(startOfMonth(updated));
  };

  const renderDayCell = (day) => {
    const isSelected = isSameDay(day, selectedDate);

    return (
      <div
        key={day}
        onClick={() => handleSelectDay(day)}
        className="flex items-center justify-center h-9 cursor-pointer hover:bg-blue-100 rounded-full"
      >
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full
            ${isSelected ? "bg-blue-600 text-white" : "text-gray-800"}
          `}
        >
          {format(day, "d")}
        </div>
      </div>
    );
  };


  const renderWeekRow = (week) => {
    const weekHasSelected =
      currentView === "week" &&
      week.some((day) => isSameWeek(day, selectedDate));

    return (
      <div
        key={week[0]}
        className={`grid grid-cols-7 rounded-full px-1 py-0.5 mb-0.5 ${
          weekHasSelected ? "bg-blue-50" : ""
        }`}
      >
        {week.map(renderDayCell)}
      </div>
    );
  };


  return (
    <div className="flex bg-white shadow-lg rounded-lg overflow-hidden">

      {(currentView === "month" ||
        currentView === "week" ||
        currentView === "day") && (
        <div className="p-4 min-w-[280px] border-r">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setLeftMonth(subMonths(leftMonth, 1))}
              className="px-2 py-1 hover:bg-gray-200 rounded"
            >
              ◀
            </button>

            <div className="font-semibold text-lg">
              {format(leftMonth, "MMMM yyyy")}
            </div>

            <button
              onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
              className="px-2 py-1 hover:bg-gray-200 rounded"
            >
              ▶
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Week Rows */}
          {weeks.map(renderWeekRow)}
        </div>
      )}

      {(currentView === "week" || currentView === "day") && (
        <div className="p-4 min-w-[260px]">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setRightYear(rightYear - 1)}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              ▲
            </button>

            <div className="text-xl font-semibold">{rightYear}</div>

            <button
              onClick={() => setRightYear(rightYear + 1)}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              ▼
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            {monthNames.map((m, index) => {
              const isCurrentMonth =
                index === getMonth(selectedDate) &&
                rightYear === getYear(selectedDate);

              return (
                <button
                  key={index}
                  onClick={() => handleSelectMonthTile(index)}
                  className={`py-2 rounded-full hover:bg-blue-100 transition text-center
                    ${isCurrentMonth ? "bg-blue-600 text-white" : "text-gray-800"}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsDatePicker
