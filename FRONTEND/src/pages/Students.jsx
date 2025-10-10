import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import StudentForm from "../components/StudentForm";
import Select from "../components/Select";
import { addStudent, deleteStudent, getStudents, updateStudent } from "../api/client";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", std_index: "", section: "", parentName: "", parentPhoneNum: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getStudents();
      setStudents(data.students || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sections = useMemo(() => {
    const set = new Set(students.map((s) => s.section));
    return Array.from(set).sort().map((s) => ({ value: s, label: s }));
  }, [students]);

  const filtered = students.filter((s) => !section || s.section === section);

  const handleAdd = async (payload, reset) => {
    setAdding(true);
    try {
      await addStudent(payload);
      await load();
      reset();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (idOrIndex) => {
    if (!window.confirm("Delete this student?")) return;
    await deleteStudent(idOrIndex);
    await load();
  };

  const startEdit = (student) => {
    setEditingId(student._id);
    setEditForm({
      name: student.name || "",
      std_index: student.std_index || "",
      section: student.section || "",
      parentName: student.parentName || "",
      parentPhoneNum: student.parentPhoneNum || ""
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", std_index: "", section: "", parentName: "", parentPhoneNum: "" });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      await updateStudent(id, editForm);
      await load();
      cancelEdit();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Layout>
      <div className="header">
        <h1>Students</h1>
        <Select label="" value={section} onChange={setSection} options={[{ value: "", label: "All Sections" }, ...sections]} />
      </div>

      <StudentForm onSubmit={handleAdd} submitting={adding} />

      <div className="panel" style={{ marginTop: 16 }}>
        {loading ? "Loading..." : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Index</th>
                <th>Section</th>
                <th>Parent</th>
                <th>Phone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.name} onChange={setField("name")} />
                      : s.name}
                  </td>
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.std_index} onChange={setField("std_index")} />
                      : <span className="badge">{s.std_index}</span>}
                  </td>
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.section} onChange={setField("section")} />
                      : s.section}
                  </td>
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.parentName} onChange={setField("parentName")} />
                      : s.parentName}
                  </td>
                  <td>
                    {editingId === s._id
                      ? <input value={editForm.parentPhoneNum} onChange={setField("parentPhoneNum")} />
                      : s.parentPhoneNum}
                  </td>
                  <td style={{ textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    {editingId === s._id ? (
                      <>
                        <button className="success" onClick={() => saveEdit(s._id)} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button className="ghost" onClick={cancelEdit} disabled={saving}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)}>Edit</button>
                        <button className="danger" onClick={() => remove(s._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
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

export default Students;
