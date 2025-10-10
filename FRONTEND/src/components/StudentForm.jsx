import React, { useState } from "react";

const initial = {
  name: "",
  std_index: "",
  section: "",
  parentName: "",
  parentPhoneNum: ""
};

const StudentForm = ({ onSubmit, submitting }) => {
  const [form, setForm] = useState(initial);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form, () => setForm(initial));
  };

  return (
    <form className="panel" onSubmit={submit}>
      <div className="row">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={set("name")} required placeholder="John Doe" />
        </div>
        <div className="field">
          <label>Index No</label>
          <input value={form.std_index} onChange={set("std_index")} required placeholder="S1234" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>Class / Section</label>
          <input value={form.section} onChange={set("section")} required placeholder="10-A" />
        </div>
        <div className="field">
          <label>Parent Name</label>
          <input value={form.parentName} onChange={set("parentName")} required placeholder="Jane Doe" />
        </div>
      </div>
      <div className="row">
        <div className="field">
          <label>Parent Phone</label>
          <input value={form.parentPhoneNum} onChange={set("parentPhoneNum")} required placeholder="+94 XXX XXX XXX" />
        </div>
        <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
          <button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Student"}</button>
        </div>
      </div>
    </form>
  );
};

export default StudentForm;
