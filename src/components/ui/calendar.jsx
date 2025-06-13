import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  ...props
}) {
  const CustomHeader = ({
    date,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => (
    <div className="flex justify-center pt-1 relative items-center">
      <button
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium">
        {date.toLocaleString("default", { month: "long", year: "numeric" })}
      </span>
      <button
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className={cn("p-3", className)}>
      <DatePicker
        selected={selected}
        onChange={onSelect}
        inline
        showOutsideDays={showOutsideDays}
        renderCustomHeader={CustomHeader}
        calendarClassName={cn("border-none", classNames?.months)}
        dayClassName={(date) =>
          cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            date.getTime() === selected?.getTime() &&
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            date.getTime() === new Date().setHours(0, 0, 0, 0) &&
              "bg-accent text-accent-foreground"
          )
        }
        {...props}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
