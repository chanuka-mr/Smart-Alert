import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getAllAttendance } from "../api/client";
import dayjs from "dayjs";

const ParentView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getAllAttendance();
      setRecords(data.records || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <Layout>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <h1 style={{ margin: "0 0 20px", color: "var(--text)" }}>
          <i className="fas fa-calendar-check" style={{ marginRight: "12px" }}></i>
          Parent Portal - All Attendance Records
        </h1>
        <p style={{ color: "var(--subtle)", marginBottom: "24px" }}>
          View all attendance records (Read-Only)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="panel" style={{ 
          background: "rgba(211, 47, 47, 0.1)", 
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          textAlign: "center",
          marginBottom: "24px"
        }}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: "8px" }}></i>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="panel" style={{ textAlign: "center", color: "var(--subtle)" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "24px", marginRight: "8px" }}></i>
          Loading attendance records...
        </div>
      )}

      {/* Attendance Records */}
      {!loading && records.length > 0 && (
        <div className="panel">
          <h2 style={{ margin: "0 0 20px", color: "var(--text)" }}>
            <i className="fas fa-list" style={{ marginRight: "8px" }}></i>
            All Attendance Records ({records.length} total)
          </h2>

          <div className="table-container" style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Index</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Justification</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id}>
                    <td>{dayjs(record.date).format("DD/MM/YYYY")}</td>
                    <td>{record.student?.name || "N/A"}</td>
                    <td><span className="badge">{record.student?.std_index || "N/A"}</span></td>
                    <td>{record.student?.section || "N/A"}</td>
                    <td>
                      <span 
                        className={`status-badge ${record.status.toLowerCase()}`}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          ...(record.status === "Present" && {
                            background: "rgba(76, 175, 80, 0.2)",
                            color: "var(--success)",
                            border: "1px solid var(--success)"
                          }),
                          ...(record.status === "Absent" && {
                            background: "rgba(211, 47, 47, 0.2)",
                            color: "var(--danger)",
                            border: "1px solid var(--danger)"
                          }),
                          ...(record.status === "Late" && {
                            background: "rgba(255, 152, 0, 0.2)",
                            color: "#ff9800",
                            border: "1px solid #ff9800"
                          }),
                          ...(record.status === "Excused" && {
                            background: "rgba(156, 39, 176, 0.2)",
                            color: "#9c27b0",
                            border: "1px solid #9c27b0"
                          })
                        }}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--subtle)", fontStyle: "italic" }}>
                      {record.justification || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          <div style={{ 
            marginTop: "32px", 
            padding: "20px", 
            background: "var(--muted)", 
            borderRadius: "8px",
            border: "1px solid var(--border)"
          }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--text)" }}>
              <i className="fas fa-chart-pie" style={{ marginRight: "8px" }}></i>
              Summary Statistics
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
              {["Present", "Absent", "Late", "Excused"].map((status) => {
                const count = records.filter(r => r.status === status).length;
                const percentage = records.length > 0 ? ((count / records.length) * 100).toFixed(1) : 0;
                return (
                  <div key={status} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text)" }}>
                      {count}
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--subtle)" }}>
                      {status} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No Records Message */}
      {!loading && !error && records.length === 0 && (
        <div className="panel" style={{ textAlign: "center", color: "var(--subtle)" }}>
          <i className="fas fa-calendar-times" style={{ fontSize: "48px", marginBottom: "16px", color: "var(--accent)" }}></i>
          <h3>No Records Found</h3>
          <p>No attendance records available at the moment.</p>
        </div>
      )}
    </Layout>
  );
};

export default ParentView;
