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
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

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

  useEffect(() => { 
    load(); 
  }, []);

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

    // Filter by month
    if (monthFilter) {
      filtered = filtered.filter(record => 
        dayjs(record.date).format("YYYY-MM") === monthFilter
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Filter by section
    if (sectionFilter) {
      filtered = filtered.filter(record => record.student?.section === sectionFilter);
    }

    return filtered;
  }, [records, searchTerm, dateFilter, monthFilter, statusFilter, sectionFilter]);

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
    setMonthFilter("");
    setStatusFilter("");
    setSectionFilter("");
  };

  const hasActiveFilters = searchTerm || dateFilter || monthFilter || statusFilter || sectionFilter;

  // Generate text report from data
  const generateTextReport = (data) => {
    let report = '';
    report += '='.repeat(50) + '\n';
    report += `           ${data.title}\n`;
    report += '='.repeat(50) + '\n';
    report += `Generated on: ${data.generatedOn}\n\n`;
    
    // Filters applied
    if (data.filters && Object.keys(data.filters).some(key => data.filters[key])) {
      report += 'Filters Applied:\n';
      report += '-'.repeat(20) + '\n';
      if (data.filters.searchTerm) report += `Search: ${data.filters.searchTerm}\n`;
      if (data.filters.dateFilter) report += `Date: ${data.filters.dateFilter}\n`;
      if (data.filters.monthFilter) report += `Month: ${data.filters.monthFilter}\n`;
      if (data.filters.statusFilter) report += `Status: ${data.filters.statusFilter}\n`;
      if (data.filters.sectionFilter) report += `Section: ${data.filters.sectionFilter}\n`;
      report += '\n';
    }
    
    // Statistics
    report += 'Statistics:\n';
    report += '-'.repeat(20) + '\n';
    report += `Total Records: ${data.statistics.totalRecords}\n`;
    report += `Present: ${data.statistics.present}\n`;
    report += `Absent: ${data.statistics.absent}\n`;
    report += `Late: ${data.statistics.late}\n`;
    report += `Excused: ${data.statistics.excused}\n`;
    report += `Attendance Rate: ${data.statistics.attendancePercentage}%\n\n`;
    
    // Records
    report += 'Records:\n';
    report += '-'.repeat(20) + '\n';
    data.records.forEach((record, index) => {
      report += `${index + 1}. ${record.student?.name || 'Unknown'} (${record.student?.std_index || 'N/A'})\n`;
      report += `   Section: ${record.student?.section || 'N/A'}\n`;
      report += `   Status: ${record.status}\n`;
      report += `   Date: ${new Date(record.date).toLocaleDateString()}\n`;
      report += '\n';
    });
    
    report += '='.repeat(50) + '\n';
    report += 'End of Report\n';
    report += '='.repeat(50) + '\n';
    
    return report;
  };

  // Download functionality
  const downloadReport = async () => {
    try {
      // Check if there are records to download
      if (filteredRecords.length === 0) {
        alert('No records to download. Please adjust your filters or add some attendance records first.');
        return;
      }

      console.log('Downloading report with:', {
        recordCount: filteredRecords.length,
        filters: {
          searchTerm: searchTerm || null,
          dateFilter: dateFilter || null,
          monthFilter: monthFilter || null,
          statusFilter: statusFilter || null,
          sectionFilter: sectionFilter || null,
        }
      });

      const response = await fetch('http://localhost:5000/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: {
            searchTerm: searchTerm || null,
            dateFilter: dateFilter || null,
            monthFilter: monthFilter || null,
            statusFilter: statusFilter || null,
            sectionFilter: sectionFilter || null,
          },
          records: filteredRecords
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Check if response is a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        
        // Check if blob is empty
        if (blob.size === 0) {
          throw new Error('Received empty PDF file. Please try again.');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Generate filename based on filters
        let filename = 'attendance_report';
        if (monthFilter) {
          filename = `attendance_report_${monthFilter}`;
        } else if (dateFilter) {
          filename = `attendance_report_${dateFilter}`;
        } else if (hasActiveFilters) {
          filename = 'attendance_report_filtered';
        }
        filename += '.pdf';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('PDF downloaded successfully:', filename);
        return;
      }

      // If it's JSON (fallback)
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Received JSON response (fallback):', data);
        
        // Create a simple text report as fallback
        const reportText = generateTextReport(data.data);
        
        // Create and download text file
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Generate filename based on filters
        let filename = 'attendance_report';
        if (monthFilter) {
          filename = `attendance_report_${monthFilter}`;
        } else if (dateFilter) {
          filename = `attendance_report_${dateFilter}`;
        } else if (hasActiveFilters) {
          filename = 'attendance_report_filtered';
        }
        filename += '.txt';
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('Text report downloaded successfully (fallback):', filename);
        return;
      }

      // If neither PDF nor JSON
      const errorText = await response.text();
      console.error('Unexpected response type:', contentType, errorText);
      throw new Error('Server returned unexpected response type. Please check server logs.');
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download report: ${error.message}\n\nPlease check that the backend server is running and try again.`);
    }
  };

  // Get button text based on filters
  const getDownloadButtonText = () => {
    if (monthFilter) {
      return `Download ${dayjs(monthFilter).format('MMMM YYYY')} Report`;
    } else if (hasActiveFilters) {
      return 'Download Selected Range Report';
    } else {
      return 'Download Current Report';
    }
  };

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
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 12, 
            alignItems: "end" 
          }}>
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

            {/* Filter by Month */}
            <div className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>Filter by Month</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
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

            {/* Filter by Section */}
            <div className="field" style={{ flex: 1, minWidth: 150 }}>
              <label>Filter by Section</label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">All Sections</option>
                <option value="1A">1A</option>
                <option value="1B">1B</option>
                <option value="2A">2A</option>
                <option value="2B">2B</option>
                <option value="12A">12A</option>
                <option value="11C">11C</option>
              </select>
            </div>

            {/* Download Report Button */}
            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                onClick={downloadReport}
                className="success"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "fit-content",
                  whiteSpace: "nowrap"
                }}
                title="Download filtered attendance report"
              >
                <i className="fas fa-download" style={{ fontSize: "14px" }}></i>
                {getDownloadButtonText()}
              </button>
            </div>

          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end",
              padding: "12px 0",
              borderTop: "1px solid var(--border)"
            }}>
              <button
                className="ghost"
                onClick={clearFilters}
                style={{ 
                  height: "fit-content", 
                  padding: "8px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <i className="fas fa-times" style={{ fontSize: "12px" }}></i>
                Clear Filters
              </button>
            </div>
          )}

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
              {monthFilter && ` - ${dayjs(monthFilter).format('MMMM YYYY')}`}
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
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Index</th>
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Section</th>
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px 8px", textAlign: "left" }}>Notified</th>
              <th style={{ padding: "12px 8px", textAlign: "right", minWidth: "200px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7">Loading...</td></tr>}

            {!loading && filteredRecords.map((r) => (
              <tr 
                key={r._id}
                style={{
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f8f9fa";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}>{dayjs(r.date).format("YYYY-MM-DD")}</td>
                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}>{r.student?.name}</td>
                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}><span className="badge">{r.student?.std_index}</span></td>
                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}>{r.student?.section}</td>

                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}>
                  {editingId === r._id ? (
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{ 
                        padding: "4px 8px", 
                        borderRadius: "4px", 
                        border: "1px solid #ddd",
                        fontSize: "12px"
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px",
                      backgroundColor: r.status === "Present" ? "#d4edda" : 
                                    r.status === "Absent" ? "#f8d7da" : 
                                    r.status === "Late" ? "#fff3cd" : "#e2e3e5",
                      color: r.status === "Present" ? "#155724" : 
                            r.status === "Absent" ? "#721c24" : 
                            r.status === "Late" ? "#856404" : "#6c757d",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      {r.status}
                    </span>
                  )}
                </td>

                <td style={{ padding: "12px 8px", verticalAlign: "middle" }}>
                  {r.notifiedParent || notifiedRecords.has(r._id) ? (
                    <span style={{ 
                      color: "var(--success)", 
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <i className="fas fa-check-circle" style={{ fontSize: "10px" }}></i>
                      Notified
                    </span>
                  ) : (
                    <span style={{ color: "var(--subtle)", fontSize: "12px" }}>-</span>
                  )}
                </td>

                <td style={{ 
                  textAlign: "right", 
                  padding: "8px 4px",
                  verticalAlign: "middle"
                }}>
                  <div style={{ 
                    display: "flex", 
                    gap: "6px", 
                    justifyContent: "flex-end", 
                    alignItems: "center",
                    flexWrap: "nowrap"
                  }}>
                    {editingId === r._id ? (
                      <>
                        <button 
                          onClick={() => saveEdit(r._id)} 
                          disabled={saving}
                          style={{ 
                            fontSize: "11px", 
                            padding: "6px 12px", 
                            minWidth: "60px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            border: "1px solid #28a745",
                            cursor: saving ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            backgroundColor: "white",
                            color: "#28a745"
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.target.style.backgroundColor = "#28a745";
                              e.target.style.color = "white";
                              e.target.style.transform = "translateY(-1px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.target.style.backgroundColor = "white";
                              e.target.style.color = "#28a745";
                              e.target.style.transform = "translateY(0)";
                            }
                          }}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button 
                          className="ghost" 
                          onClick={cancelEdit} 
                          disabled={saving}
                          style={{ 
                            fontSize: "11px", 
                            padding: "6px 12px", 
                            minWidth: "60px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            border: "1px solid #6c757d",
                            cursor: saving ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            backgroundColor: "transparent",
                            color: "#6c757d"
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.target.style.backgroundColor = "#6c757d";
                              e.target.style.color = "white";
                              e.target.style.transform = "translateY(-1px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.target.style.backgroundColor = "transparent";
                              e.target.style.color = "#6c757d";
                              e.target.style.transform = "translateY(0)";
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEdit(r)}
                          style={{ 
                            fontSize: "11px", 
                            padding: "6px 12px", 
                            minWidth: "50px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            border: "1px solid #6c757d",
                            backgroundColor: "#6c757d",
                            color: "white",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#5a6268";
                            e.target.style.color = "white";
                            e.target.style.transform = "translateY(-1px)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#6c757d";
                            e.target.style.color = "white";
                            e.target.style.transform = "translateY(0)";
                          }}
                          title="Edit Record"
                        >
                          Edit
                        </button>
                        <button 
                          className="danger" 
                          onClick={() => remove(r._id)}
                          style={{ 
                            fontSize: "11px", 
                            padding: "6px 12px", 
                            minWidth: "60px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="Delete Record"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
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
