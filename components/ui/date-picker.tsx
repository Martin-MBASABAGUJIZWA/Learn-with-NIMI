"use client";

import React, { useState } from "react";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  min?: string;
  max?: string;
}

export function DatePicker({ value = "", onChange, label, min, max }: DatePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  }

  return (
    <label className="flex flex-col gap-1">
      {label && <span className="font-medium">{label}</span>}
      <input
        type="date"
        value={selectedDate}
        onChange={handleChange}
        min={min}
        max={max}
        className="border rounded px-3 py-2"
      />
    </label>
  );
}
