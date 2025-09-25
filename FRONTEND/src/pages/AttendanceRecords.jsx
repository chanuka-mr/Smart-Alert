import React, { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import { getAllAttendance, deleteAttendance, updateAttendance, notifyParentsForAbsents } from "../api/client";
import { STATUS_OPTIONS } from "../utils/statusOptions";
import dayjs from "dayjs";

const AttendanceRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Notification states
  const [notifying, setNotifying] = useState(false);
  const [notifiedRecords, setNotifiedRecords] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getAllAttendance();
      setRecords(data.records || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filter records based on search criteria
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Filter by search term (name or index)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(record => 
        record.student?.name?.toLowerCase().includes(term) ||
        record.student?.std_index?.toLowerCase().includes(term)
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(record => 
        dayjs(record.date).format("YYYY-MM-DD") === dateFilter
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    return filtered;
  }, [records, searchTerm, dateFilter, statusFilter]);

  // Get current date records that are absent/late and not yet notified
  const currentDateAbsentLateRecords = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return records.filter(record => 
      dayjs(record.date).format("YYYY-MM-DD") === today &&
      (record.status === "Absent" || record.status === "Late") &&
      !record.notifiedParent &&
      !notifiedRecords.has(record._id)
    );
  }, [records, notifiedRecords]);

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await deleteAttendance(id);
    await load();
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setEditStatus(record.status || "Present");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStatus("");
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await updateAttendance(id, { status: editStatus });
      await load();
      cancelEdit();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update record");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setStatusFilter("");
  };

  const hasActiveFilters = searchTerm || dateFilter || statusFilter;

  // Notify parents for current date absent/late students
  const notifyParentsForCurrentDate = async () => {
    if (currentDateAbsentLateRecords.length === 0) {
      alert("No absent or late students found for today.");
      return;
    }

    setNotifying(true);
    try {
      const items = currentDateAbsentLateRecords.map(record => ({
        studentId: record.student._id,
        status: record.status,
        date: dayjs(record.date).format("YYYY-MM-DD")
      }));

      console.log("Sending notifications for:", items);

      const { data } = await notifyParentsForAbsents(items);
      const succeeded = Array.isArray(data?.succeeded) ? data.succeeded : [];
      const failed = Array.isArray(data?.failed) ? data.failed : [];

      if (succeeded.length > 0) {
        // Mark records as notified locally
        const newNotifiedSet = new Set(notifiedRecords);
        currentDateAbsentLateRecords.forEach(record => {
          if (succeeded.includes(record.student._id)) {
            newNotifiedSet.add(record._id);
          }
        });
        setNotifiedRecords(newNotifiedSet);

        // Update the records in the database
        await Promise.all(
          currentDateAbsentLateRecords
            .filter(record => succeeded.includes(record.student._id))
            .map(record => 
              updateAttendance(record._id, { notifiedParent: true })
            )
        );

        alert(`Successfully notified ${succeeded.length} parent(s) for today's absent/late students.`);
      }

      if (failed.length > 0) {
        const names = failed
          .map((f) => {
            const record = currentDateAbsentLateRecords.find(r => r.student._id === f.studentId);
            return record ? `${record.student.name} (${record.student.parentPhoneNum})` : f.studentId;
          })
          .join(", ");
        alert(`Failed to notify: ${names}\n\nPlease check phone numbers and try again.`);
      }
    } catch (e) {
      console.error("Notification error:", e);
      alert(e?.response?.data?.message || "Failed to send notifications. Please check your Twilio configuration.");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <Layout>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <h1 style={{ margin: 0 }}>Attendance Records</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="panel" style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
            {/* Search by Name/Index */}
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Search by Name or Index</label>
              <input
                type="text"
                placeholder="Enter name or index number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* Filter by Date */}
            <div className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>Filter by Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            {/* Filter by Status */}
            <div className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                className="ghost"
                onClick={clearFilters}
                style={{ height: "fit-content", marginBottom: 0 }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Notification Section for Current Date */}
          {currentDateAbsentLateRecords.length > 0 && (
  <div className="notification-section">
    <div className="notification-content">
      <div className="notification-info">
        <h4>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: "8px" }}></i>
          {currentDateAbsentLateRecords.length} absent/late student(s) for today
        </h4>
        <p>
          {currentDateAbsentLateRecords.map(r => r.student.name).join(", ")}
        </p>
      </div>
      <button
        className="success"
        onClick={notifyParentsForCurrentDate}
        disabled={notifying}
        style={{ whiteSpace: "nowrap" }}
      >
        <i className="fas fa-bell" style={{ marginRight: "8px" }}></i>
        {notifying ? "Sending..." : "Notify Parents (Today Only)"}
      </button>
    </div>
  </div>
)}

          {/* Results Summary */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "8px 0",
            borderTop: "1px solid var(--border)",
            fontSize: "14px",
            color: "var(--subtle)"
          }}>
            <span>
              Showing {filteredRecords.length} of {records.length} records
              {hasActiveFilters && " (filtered)"}
            </span>
            {hasActiveFilters && (
              <span style={{ color: "var(--primary)" }}>
                Filters active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Index</th>
              <th>Section</th>
              <th>Status</th>
              <th>Notified</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7">Loading...</td></tr>}

            {!loading && filteredRecords.map((r) => (
              <tr key={r._id}>
                <td>{dayjs(r.date).format("YYYY-MM-DD")}</td>
                <td>{r.student?.name}</td>
                <td><span className="badge">{r.student?.std_index}</span></td>
                <td>{r.student?.section}</td>

                <td>
                  {editingId === r._id ? (
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    r.status
                  )}
                </td>

                <td>
                  {r.notifiedParent || notifiedRecords.has(r._id) ? (
                    <span style={{ color: "var(--success)", fontSize: "12px" }}>✓ Notified</span>
                  ) : (
                    <span style={{ color: "var(--subtle)", fontSize: "12px" }}>-</span>
                  )}
                </td>

                <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {editingId === r._id ? (
                    <>
                      <button className="success" onClick={() => saveEdit(r._id)} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button className="ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(r)}>Edit</button>
                      <button className="danger" onClick={() => remove(r._id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!loading && filteredRecords.length === 0 && (
              <tr>
                <td colSpan="7" style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
                  {hasActiveFilters ? "No records match your search criteria" : "No records"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AttendanceRecords;
