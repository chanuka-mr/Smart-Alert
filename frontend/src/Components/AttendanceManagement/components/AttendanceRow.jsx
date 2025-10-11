import React from "react";
import { STATUS_OPTIONS } from "../utils/statusOptions";

const AttendanceRow = ({ student, row, onChange, disabled }) => {
  const set = (key) => (e) =>
    onChange(student._id, {
      ...row,
      [key]: e?.target ? e.target.value : e
    });

  return (
    <tr>
      <td>{student.name}</td>
      <td><span className="badge">{student.std_index}</span></td>
      <td>{student.section}</td>
      <td>
        <select value={row.status} onChange={set("status")} disabled={disabled}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
    </tr>
  );
};

export default AttendanceRow;
