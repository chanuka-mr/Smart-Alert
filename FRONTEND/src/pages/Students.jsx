

import React, { useEffect, useMemo, useState } from "react";  // React hooks for state management
import Layout from "../components/Layout";                    // Layout wrapper component
import StudentForm from "../components/StudentForm";          // Form for adding new students
import Select from "../components/Select";                    // Dropdown select component
import { addStudent, deleteStudent, getStudents, updateStudent } from "../api/client";  // API functions


const Students = () => {
  
  // Array of all students from the database
  const [students, setStudents] = useState([]);
  
  // Currently selected section for filtering
  const [section, setSection] = useState("");
  
  // Loading state for initial data fetch
  const [loading, setLoading] = useState(true);
  
  // Loading state for adding new student
  const [adding, setAdding] = useState(false);

  // ID of student currently being edited
  const [editingId, setEditingId] = useState(null);
  
  // Form data for editing student
  const [editForm, setEditForm] = useState({ 
    name: "", 
    std_index: "", 
    section: "", 
    parentName: "", 
    parentPhoneNum: "" 
  });
  
  // Loading state for saving edits
  const [saving, setSaving] = useState(false);

  
  const load = async () => {
    setLoading(true);  // Show loading indicator
    try {
      // Fetch students from API
      const { data } = await getStudents();
      // Update students state with fetched data
      setStudents(data.students || []);
    } finally {
      setLoading(false);  // Hide loading indicator
    }
  };

  // Load students when component mounts
  useEffect(() => { load(); }, []);

  
  // Generate list of unique sections for filtering dropdown
  const sections = useMemo(() => {
    // Get unique sections from students array
    const set = new Set(students.map((s) => s.section));
    // Convert to array and sort alphabetically
    return Array.from(set).sort().map((s) => ({ value: s, label: s }));
  }, [students]);

  // Filter students based on selected section
  const filtered = students.filter((s) => !section || s.section === section);

  
  // Handle adding a new student
  const handleAdd = async (payload, reset) => {
    setAdding(true);  // Show adding indicator
    try {
      // Send new student data to API
      await addStudent(payload);
      // Reload students list to show new student
      await load();
      // Reset the form
      reset();
    } catch (e) {
      // Show error message if add fails
      alert(e?.response?.data?.message || "Failed to add");
    } finally {
      setAdding(false);  // Hide adding indicator
    }
  };

  // Handle deleting a student
  const remove = async (idOrIndex) => {
    // Confirm deletion with user
    if (!window.confirm("Delete this student?")) return;
    // Delete student from database
    await deleteStudent(idOrIndex);
    // Reload students list
    await load();
  };

  // Start editing a student (switch to edit mode)
  const startEdit = (student) => {
    // Set the student ID being edited
    setEditingId(student._id);
    // Populate edit form with student data
    setEditForm({
      name: student.name || "",
      std_index: student.std_index || "",
      section: student.section || "",
      parentName: student.parentName || "",
      parentPhoneNum: student.parentPhoneNum || ""
    });
  };

  // Cancel editing (exit edit mode)
  const cancelEdit = () => {
    // Clear editing state
    setEditingId(null);
    // Reset edit form
    setEditForm({ name: "", std_index: "", section: "", parentName: "", parentPhoneNum: "" });
  };

  // Save edited student data
  const saveEdit = async (id) => {
    setSaving(true);  // Show saving indicator
    try {
      // Send updated data to API
      await updateStudent(id, editForm);
      // Reload students list
      await load();
      // Exit edit mode
      cancelEdit();
    } catch (e) {
      // Show error message if update fails
      alert(e?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);  // Hide saving indicator
    }
  };

  // Helper function to update edit form fields
  const setField = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));


  
  return (
    <Layout>
      {/* Page header with title and section filter */}
      <div className="header">
        <h1>Students</h1>
        {/* Section filter dropdown */}
        <Select 
          label="" 
          value={section} 
          onChange={setSection} 
          options={[{ value: "", label: "All Sections" }, ...sections]} 
        />
      </div>

      {/* Form for adding new students */}
      <StudentForm onSubmit={handleAdd} submitting={adding} />

      {/* Students table panel */}
      <div className="panel" style={{ marginTop: 16 }}>
        {loading ? "Loading..." : (
          <table className="table">
            {/* Table header */}
            <thead>
              <tr>
                <th>Name</th>
                <th>Index</th>
                <th>Section</th>
                <th>Parent</th>
                <th>Phone</th>
                <th></th>  {/* Actions column */}
              </tr>
            </thead>
            {/* Table body with student data */}
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  {/* Student name - editable when in edit mode */}
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.name} onChange={setField("name")} />
                      : s.name}
                  </td>
                  {/* Student index - editable when in edit mode */}
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.std_index} onChange={setField("std_index")} />
                      : <span className="badge">{s.std_index}</span>}
                  </td>
                  {/* Student section - editable when in edit mode */}
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.section} onChange={setField("section")} />
                      : s.section}
                  </td>
                  {/* Parent name - editable when in edit mode */}
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.parentName} onChange={setField("parentName")} />
                      : s.parentName}
                  </td>
                  {/* Parent phone - editable when in edit mode */}
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.parentPhoneNum} onChange={setField("parentPhoneNum")} />
                      : s.parentPhoneNum}
                  </td>
                  {/* Action buttons */}
                  <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {editingId === s._id ? (
                      /* Edit mode buttons */
                      <>
                        <button className="success" onClick={() => saveEdit(s._id)} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </>
                    ) : (
                      /* View mode buttons */
                      <>
                        <button onClick={() => startEdit(s)}>Edit</button>
                        <button className="danger" onClick={() => remove(s._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {/* Show message when no students found */}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ color: "#aaa" }}>No students</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

// ===========================================
// EXPORT COMPONENT
// ===========================================
// Export the Students component as the default export
export default Students;
