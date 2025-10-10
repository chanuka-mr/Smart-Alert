

import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Select from "../components/Select";
import AttendanceRow from "../components/AttendanceRow";
import { getStudents, markAttendance, getAllAttendance } from "../api/client";
import dayjs from "dayjs";

const Attendance = () => {
 
  const [students, setStudents] = useState([]);           
  const [section, setSection] = useState("");             
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD")); 
  const [rows, setRows] = useState({});                   
  const [submitting, setSubmitting] = useState(false);    
  const [loading, setLoading] = useState(true);          

  // Track which students already have attendance marked
  const [existingIdsForDate, setExistingIdsForDate] = useState(new Set());
  const [loadingExisting, setLoadingExisting] = useState(false);

 
  // Load all students from database
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getStudents();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  };

  // Load students on component mount
  useEffect(() => { load(); }, []);

  // Update date every minute to keep it current
  useEffect(() => {
    const id = setInterval(() => {
      setDate(dayjs().format("YYYY-MM-DD"));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

 
  // Generate unique sections for dropdown
  const sections = useMemo(() => {
    const set = new Set(students.map((s) => s.section));
    return Array.from(set).sort().map((s) => ({ value: s, label: s }));
  }, [students]);

  // Filter students by selected section
  const visible = useMemo(
    () => (section ? students.filter((s) => s.section === section) : []),
    [students, section]
  );

  useEffect(() => {
    if (!section) {
      setRows({});
      return;
    }
    const map = {};
    visible.forEach((s) => {
      map[s._id] = rows[s._id] ?? { status: "Present" };
    });
    setRows(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, section]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!section) {
        setExistingIdsForDate(new Set());
        return;
      }
      setLoadingExisting(true);
      try {
        const { data } = await getAllAttendance();
        const list = Array.isArray(data.records) ? data.records : [];
        const ids = new Set(
          list
            .filter((r) => dayjs(r.date).format("YYYY-MM-DD") === date)
            .filter((r) => r.student?.section === section)
            .map((r) => r.student?._id)
            .filter(Boolean)
        );
        setExistingIdsForDate(ids);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadExisting();
  }, [date, section]);

  const updateRow = (studentId, newRow) => {
    setRows((r) => ({ ...r, [studentId]: newRow }));
  };

  const nothingToSubmit = useMemo(() => {
    return visible.every((s) => existingIdsForDate.has(s._id));
  }, [visible, existingIdsForDate]);

  
  // Submit attendance for selected students
  const submit = async () => {
    if (!section) return alert("Select a class/section first");
    
    setSubmitting(true);
    try {
      // Get students who don't have attendance marked yet
      const toSubmit = visible.filter((s) => !existingIdsForDate.has(s._id));
      if (toSubmit.length === 0) {
        alert("Attendance already marked for all students in this section for this date.");
        return;
      }

      // Prepare attendance data for each student
      const payloads = toSubmit.map((s) => {
        const status = rows[s._id]?.status || "Present";
        return {
          studentId: s._id,
          date,
          status,
          notifiedParent: false // Always false when marking attendance
        };
      });

      // Submit attendance for each student
      for (const p of payloads) {
        await markAttendance(p);
      }

      // Update local state to reflect submitted attendance
      setExistingIdsForDate((prev) => {
        const next = new Set(prev);
        toSubmit.forEach((s) => next.add(s._id));
        return next;
      });

      alert("Attendance marked successfully");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (!section) {
    return (
      <Layout>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <h1 style={{ margin: "0 0 20px" }}>Mark Attendance</h1>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 320 }}>
                <Select
                  label=""
                  value={section}
                  onChange={setSection}
                  options={[{ value: "", label: "Select Section" }, ...sections]}
                />
              </div>
              <div style={{ width: 320 }}>
                <input
                  type="date"
                  value={date}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--muted)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    textAlign: "center",
                    pointerEvents: "none"
                  }}
                  aria-label="Date"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: 24, textAlign: "center", color: "#aaa", marginTop: 16 }}>
          Select a section to begin marking attendance
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="header" style={{ flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ margin: "0 0 14px" }}>Mark Attendance</h1>
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 320 }}>
              <Select
                label=""
                value={section}
                onChange={setSection}
                options={[{ value: "", label: "Select Section" }, ...sections]}
              />
            </div>
            <div style={{ width: 320 }}>
              <input
                type="date"
                value={date}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--muted)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  textAlign: "center",
                  pointerEvents: "none"
                }}
                aria-label="Date"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Index</th>
              <th>Section</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(loading || loadingExisting) && <tr><td colSpan="4">Loading...</td></tr>}
            {!loading && !loadingExisting && visible.map((s) => (
              <AttendanceRow
                key={s._id}
                student={s}
                row={rows[s._id] || { status: "Present" }}
                onChange={updateRow}
                disabled={existingIdsForDate.has(s._id)}
              />
            ))}
            {!loading && !loadingExisting && visible.length === 0 && (
              <tr><td colSpan="4" style={{ color: "#aaa" }}>No students in this section</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          <button className="ghost" onClick={() => setRows({})}>Reset</button>
          <button
            onClick={submit}
            disabled={submitting || !section || nothingToSubmit}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Attendance;
