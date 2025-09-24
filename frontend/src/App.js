import './App.css';
import './theme.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home/Home';
import CreateNoticeAdmin from './Components/CreateNotices/Admin/CreateNoticeAdmin';
import CreateNoticeTeacher from './Components/CreateNotices/Teachers/CreateNoticeTeacher';
import DirectMessages from './Components/DirectMessages/DirectMessages';
import DisplayNotices from './Components/DisplayNotices/DisplayNotices';
import UpdateNoticeAdmin from './Components/UpdateNotices/Admin/UpdateNoticeAdmin';
import UpdateNoticeTeacher from './Components/UpdateNotices/Teachers/UpdateNoticeTeacher';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-create-notice" element={<CreateNoticeAdmin />} />
          <Route path="/teacher-create-notice" element={<CreateNoticeTeacher />} />
          <Route path="/direct-message-teacher" element={<DirectMessages userType="teacher" />} />
          <Route path="/direct-message-parent" element={<DirectMessages userType="parent" />} />
          <Route path="/display-notices" element={<DisplayNotices />} />
          <Route path="/update-admin-notices" element={<UpdateNoticeAdmin />} />
          <Route path="/update-teacher-notices" element={<UpdateNoticeTeacher />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
