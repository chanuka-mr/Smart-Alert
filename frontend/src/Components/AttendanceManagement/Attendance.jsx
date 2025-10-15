import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import Select from "./components/Select";
import AttendanceRow from "./components/AttendanceRow";
import { getStudents, markAttendance, getAllAttendance } from "./api/client";
import dayjs from "dayjs";
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaUsers, 
  FaClipboardList, 
  FaRedoAlt, 
  FaCheckCircle, 
  FaHistory 
} from "react-icons/fa";


const Attendance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [rows, setRows] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingIdsForDate, setExistingIdsForDate] = useState(new Set());
  const [loadingExisting, setLoadingExisting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await getStudents();
      const studentsData = response.data?.students || [];
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      console.error("Failed to load students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDate(dayjs().format("YYYY-MM-DD"));
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const sections = useMemo(() => {
    const set = new Set(students.map((s) => s.section));
    return Array.from(set).sort().map((s) => ({ value: s, label: s }));
  }, [students]);

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
  }, [visible.length, section, rows, visible]);

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

  const submit = async () => {
    if (!section) return alert("Select a class/section first");
    
    setSubmitting(true);
    try {
      const toSubmit = visible.filter((s) => !existingIdsForDate.has(s._id));
      if (toSubmit.length === 0) {
        alert("Attendance already marked for all students in this section for this date.");
        return;
      }

      const payloads = toSubmit.map((s) => {
        const status = rows[s._id]?.status || "Present";
        return {
          studentId: s._id,
          date,
          status,
          notifiedParent: false
        };
      });

      for (const p of payloads) {
        await markAttendance(p);
      }

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


  // --------------------
  // SECTION SELECTION VIEW
  // --------------------
  if (!section) {
    return (
      <Layout>
        <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Selection Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                {/* Hero Content */}
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start mb-4">
                    <div className="p-3 bg-blue-100 rounded-2xl shadow-sm">
                      <FaClipboardList className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Mark Attendance
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                    Choose a section to begin recording today's attendance
                  </p>
                </div>

                {/* View Records Button */}
                <div className="w-full sm:w-auto flex justify-center sm:justify-end">
                  <button 
                    onClick={() => window.location.href = "/records"}
                    className="inline-flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:border-gray-400"
                  >
                    <FaHistory className="text-lg" />
                    View Records
                  </button>
                </div>
              </div>

              {/* Form Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-6 items-end">
                  {/* Class Section Input */}
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Class Section
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                      value={section}
                      onChange={setSection}
                      options={[{ value: "", label: "Choose a section" }, ...sections]}
                      className="w-full"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: '1px solid #d1d5db',
                          borderRadius: '0.5rem',
                          padding: '0.25rem 0',
                          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                          '&:hover': {
                            borderColor: '#9ca3af'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Date Display */}
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Selected Date
                    </label>
                    <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200 font-medium text-center shadow-sm">
                      <div className="text-sm font-semibold text-blue-600 mb-1">Today</div>
                      <div className="text-lg font-bold">
                        {dayjs(date).format("MMMM D, YYYY")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!section.value}
                  >
                    Start Marking Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // --------------------
  // MAIN ATTENDANCE VIEW
  // --------------------
  return (
    <Layout>
      <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => setSection("")}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors duration-200 group"
            >
              <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Sections
            </button>
            
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-blue-100 rounded-xl mr-3">
                  <FaClipboardList className="text-blue-600 text-lg" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Attendance - {section}
                </h1>
              </div>
              <div className="flex items-center justify-center text-gray-600">
                <FaCalendarAlt className="mr-2" />
                {dayjs(date).format("dddd, MMMM D, YYYY")}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-4">
                  <FaUsers className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{visible.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-4">
                  <FaCheckCircle className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {visible.filter(s => !existingIdsForDate.has(s._id)).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold text-gray-900">Student Attendance</h3>
                <button 
                  onClick={() => setRows({})} 
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaRedoAlt className="mr-2" />
                  Reset All
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th colSpan="3" className="px-6 py-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">Mark Attendance</div>
                        <div className="text-sm text-gray-600 mt-1">Choose a section to begin recording today's attendance</div>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Index No.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(loading || loadingExisting) && (
                    <tr>
                      <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <p className="mt-2">Loading attendance data...</p>
                      </td>
                    </tr>
                  )}
                  {!loading && !loadingExisting && visible.map((s) => (
                    <AttendanceRow
                      key={s._id}
                      student={s}
                      row={rows[s._id] || { status: "Present" }}
                      onChange={updateRow}
                      disabled={existingIdsForDate.has(s._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {visible.filter(s => existingIdsForDate.has(s._id)).length}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-gray-900">
                    {visible.length}
                  </span>
                  {" "}students marked
                </div>
                <button
                  onClick={submit}
                  disabled={submitting || !section || nothingToSubmit}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:hover:shadow-lg"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Attendance"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};


export default Attendance;