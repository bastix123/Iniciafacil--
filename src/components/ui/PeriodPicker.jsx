"use client";

import { useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";

/**
 * value: "YYYY-MM"
 * onChange: (newYYYYMM) => void
 */
export default function PeriodPicker({ value, onChange, label = "Período" }) {
  const selectedDate = useMemo(() => {
    if (!value) return new Date();
    const [y, m] = value.split("-").map(Number);
    return new Date(y, (m || 1) - 1, 1);
  }, [value]);

  const handleChange = (date) => {
    if (!date) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    onChange?.(`${y}-${m}`);
  };

  return (
    <div className="period-wrap">
      <span className="period-label">{label}</span>

      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        showMonthYearPicker
        locale={es}
        dateFormat="MMMM 'de' yyyy"
        className="period-input"
        popperPlacement="bottom-end"
        wrapperClassName="period-dpWrap"
        popperClassName="period-popper"
        calendarClassName="period-calendar"
        fixedHeight
      />
    </div>
  );
}


