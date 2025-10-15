import React, { useEffect, useState, useMemo } from "react";
import Layout from "./components/Layout";
import { getAllAttendance, deleteAttendance, updateAttendance, notifyParentsForAbsents } from "./api/client";
import { STATUS_OPTIONS } from "./utils/statusOptions";
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
      const response = await getAllAttendance();
      const recordsData = response.data?.records || [];
      setRecords(Array.isArray(recordsData) ? recordsData : []);
    } catch (error) {
      console.error("Failed to load attendance records:", error);
      setRecords([]);
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

  // Calculate statistics for dashboard
  const statistics = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const late = filteredRecords.filter(r => r.status === 'Late').length;
    const excused = filteredRecords.filter(r => r.status === 'Excused').length;
    const attendanceRate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return { total, present, absent, late, excused, attendanceRate };
  }, [filteredRecords]);

  return (
    <Layout>
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Attendance Records</h1>
          <p className="page-subtitle">Manage and monitor student attendance</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon present">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{statistics.present}</span>
              <span className="stat-label">Present</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon absent">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{statistics.absent}</span>
              <span className="stat-label">Absent</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon late">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{statistics.late}</span>
              <span className="stat-label">Late</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <span className="stat-value">{statistics.attendanceRate}%</span>
              <span className="stat-label">Attendance Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="filter-panel">
        <div className="panel-header">
          <h3>
            <i className="fas fa-filter"></i>
            Filters & Search
          </h3>
          <div className="header-actions">
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <i className="fas fa-times"></i>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="filter-grid">
          <div className="filter-group">
            <label className="filter-label">Search by Name or Index</label>
            <div className="search-input-container">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Enter name or index number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Date</label>
            <div className="date-input-container">
              <i className="fas fa-calendar input-icon"></i>
              <input
                type="date"
                className="date-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Month</label>
            <div className="date-input-container">
              <i className="fas fa-calendar-alt input-icon"></i>
              <input
                type="month"
                className="date-input"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Status</label>
            <div className="select-container">
              <i className="fas fa-tag input-icon"></i>
              <select
                className="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Section</label>
            <div className="select-container">
              <i className="fas fa-users input-icon"></i>
              <select
                className="section-select"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
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
          </div>

          <div className="filter-group download-group">
            <button
              onClick={downloadReport}
              className="download-btn"
              title="Download filtered attendance report"
            >
              <i className="fas fa-download"></i>
              <span>{getDownloadButtonText()}</span>
            </button>
          </div>
        </div>

        {/* Notification Section for Current Date */}
        {currentDateAbsentLateRecords.length > 0 && (
          <div className="notification-banner">
            <div className="banner-content">
              <div className="banner-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="banner-info">
                <h4>Attendance Alert for Today</h4>
                <p>
                  {currentDateAbsentLateRecords.length} student(s) are absent or late today:{" "}
                  <strong>{currentDateAbsentLateRecords.map(r => r.student.name).join(", ")}</strong>
                </p>
              </div>
              <button
                className="notify-btn"
                onClick={notifyParentsForCurrentDate}
                disabled={notifying}
              >
                <i className="fas fa-bell"></i>
                {notifying ? "Sending Notifications..." : "Notify Parents"}
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          <div className="summary-info">
            <span className="record-count">
              Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
              {hasActiveFilters && " (filtered)"}
            </span>
            {monthFilter && (
              <span className="month-filter">
                <i className="fas fa-calendar"></i>
                {dayjs(monthFilter).format('MMMM YYYY')}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <div className="filter-indicator">
              <i className="fas fa-filter"></i>
              Filters Active
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="table-panel">
        <div className="table-container">
          <table className="records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Index No.</th>
                <th>Section</th>
                <th>Status</th>
                <th>Notification</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="loading-state">
                    <div className="loading-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredRecords.map((record) => (
                <tr key={record._id} className="table-row">
                  <td className="date-cell">
                    <div className="date-display">
                      <span className="date-day">{dayjs(record.date).format("DD")}</span>
                      <span className="date-month">{dayjs(record.date).format("MMM")}</span>
                      <span className="date-year">{dayjs(record.date).format("YYYY")}</span>
                    </div>
                  </td>
                  <td className="name-cell">
                    <div className="student-info">
                      <span className="student-name">{record.student?.name}</span>
                    </div>
                  </td>
                  <td className="index-cell">
                    <span className="index-badge">{record.student?.std_index}</span>
                  </td>
                  <td className="section-cell">
                    <span className="section-tag">{record.student?.section}</span>
                  </td>
                  <td className="status-cell">
                    {editingId === record._id ? (
                      <select 
                        className="status-edit-select"
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`status-badge status-${record.status?.toLowerCase()}`}>
                        <i className={`status-icon ${getStatusIcon(record.status)}`}></i>
                        {record.status}
                      </span>
                    )}
                  </td>
                  <td className="notification-cell">
                    {record.notifiedParent || notifiedRecords.has(record._id) ? (
                      <span className="notification-indicator notified">
                        <i className="fas fa-check-circle"></i>
                        Notified
                      </span>
                    ) : (
                      <span className="notification-indicator pending">
                        <i className="fas fa-clock"></i>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {editingId === record._id ? (
                        <>
                          <button 
                            onClick={() => saveEdit(record._id)} 
                            disabled={saving}
                            className="btn-save"
                          >
                            <i className="fas fa-check"></i>
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button 
                            onClick={cancelEdit} 
                            disabled={saving}
                            className="btn-cancel"
                          >
                            <i className="fas fa-times"></i>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => startEdit(record)}
                            className="btn-edit"
                            title="Edit Record"
                          >
                            <i className="fas fa-edit"></i>
                            Edit
                          </button>
                          <button 
                            onClick={() => remove(record._id)}
                            className="btn-delete"
                            title="Delete Record"
                          >
                            <i className="fas fa-trash"></i>
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
                  <td colSpan="7" className="empty-state">
                    <div className="empty-content">
                      <i className="fas fa-clipboard-list"></i>
                      <h3>No Records Found</h3>
                      <p>
                        {hasActiveFilters 
                          ? "No attendance records match your current filters. Try adjusting your search criteria." 
                          : "No attendance records available. Start by marking attendance for your students."
                        }
                      </p>
                      {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearFilters}>
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .header-content {
          margin-bottom: 1.5rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .page-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
        }

        .header-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .stat-icon.present { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .stat-icon.absent { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .stat-icon.late { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .stat-icon.total { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        .filter-panel {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h3 {
          margin: 0;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
        }

        .clear-filters-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s ease;
        }

        .clear-filters-btn:hover {
          background: #4b5563;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .search-input-container,
        .date-input-container,
        .select-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon,
        .input-icon {
          position: absolute;
          left: 0.75rem;
          color: #6b7280;
          z-index: 10;
        }

        .search-input,
        .date-input,
        .status-select,
        .section-select {
          width: 100%;
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: white;
        }

        .search-input:focus,
        .date-input:focus,
        .status-select:focus,
        .section-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .download-group {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }

        .download-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .notification-banner {
          background: linear-gradient(135deg, #fef3c7, #fbbf24);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .banner-icon {
          color: #d97706;
          font-size: 1.5rem;
        }

        .banner-info {
          flex: 1;
        }

        .banner-info h4 {
          margin: 0 0 0.25rem 0;
          color: #92400e;
        }

        .banner-info p {
          margin: 0;
          color: #92400e;
          font-size: 0.875rem;
        }

        .notify-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s ease;
          font-weight: 600;
          white-space: nowrap;
        }

        .notify-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .notify-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-top: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }

        .summary-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .record-count {
          color: #6b7280;
        }

        .month-filter {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }

        .filter-indicator {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .table-panel {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
        }

        .table-container {
          overflow-x: auto;
        }

        .records-table {
          width: 100%;
          border-collapse: collapse;
        }

        .records-table th {
          background: #f8fafc;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .actions-header {
          text-align: right;
        }

        .table-row {
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f1f5f9;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .table-row td {
          padding: 1rem;
          vertical-align: middle;
        }

        .date-cell {
          min-width: 100px;
        }

        .date-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: #f8fafc;
          padding: 0.5rem;
          border-radius: 6px;
          min-width: 70px;
        }

        .date-day {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .date-month {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }

        .date-year {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .name-cell {
          min-width: 150px;
        }

        .student-name {
          font-weight: 600;
          color: #1f2937;
        }

        .index-cell {
          min-width: 100px;
        }

        .index-badge {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .section-cell {
          min-width: 80px;
        }

        .section-tag {
          background: #f0fdf4;
          color: #166534;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-cell {
          min-width: 120px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-present {
          background: #f0fdf4;
          color: #166534;
        }

        .status-absent {
          background: #fef2f2;
          color: #dc2626;
        }

        .status-late {
          background: #fffbeb;
          color: #d97706;
        }

        .status-excused {
          background: #f8fafc;
          color: #6b7280;
        }

        .status-edit-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.75rem;
          width: 100%;
        }

        .notification-cell {
          min-width: 100px;
        }

        .notification-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .notification-indicator.notified {
          background: #f0fdf4;
          color: #166534;
        }

        .notification-indicator.pending {
          background: #fffbeb;
          color: #d97706;
        }

        .actions-cell {
          min-width: 180px;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn-edit,
        .btn-save,
        .btn-cancel,
        .btn-delete {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
          min-width: 70px;
          justify-content: center;
        }

        .btn-edit {
          background: #3b82f6;
          color: white;
        }

        .btn-edit:hover {
          background: #2563eb;
        }

        .btn-save {
          background: #10b981;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #059669;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .btn-edit:disabled,
        .btn-save:disabled,
        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state {
          text-align: center;
          padding: 3rem !important;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #6b7280;
        }

        .loading-spinner i {
          font-size: 2rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem !important;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: #6b7280;
        }

        .empty-content i {
          font-size: 3rem;
          opacity: 0.5;
        }

        .empty-content h3 {
          margin: 0;
          color: #374151;
        }

        .empty-content p {
          margin: 0;
          max-width: 400px;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .page-header {
            padding: 1.5rem;
          }

          .header-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .banner-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .results-summary {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-edit,
          .btn-save,
          .btn-cancel,
          .btn-delete {
            min-width: auto;
          }
        }
      `}</style>
    </Layout>
  );
};

// Helper function to get status icons
function getStatusIcon(status) {
  switch (status) {
    case 'Present':
      return 'fas fa-check-circle';
    case 'Absent':
      return 'fas fa-times-circle';
    case 'Late':
      return 'fas fa-clock';
    case 'Excused':
      return 'fas fa-user-clock';
    default:
      return 'fas fa-question-circle';
  }
}

export default AttendanceRecords;