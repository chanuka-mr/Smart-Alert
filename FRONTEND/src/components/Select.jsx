
// Reusable dropdown select component

import React from "react";

const Select = ({ label, value, onChange, options, placeholder = "Select...", required }) => {
  return (
    <div className="field">
      {/* Optional label */}
      {label && <label>{label}</label>}
      {/* Dropdown select element */}
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">{placeholder}</option>
        {/* Render options from array */}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
