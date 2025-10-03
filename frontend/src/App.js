import React, { useState } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import ShuttleManagement from './components/ShuttleManagement';
import StudentManagement from './components/StudentManagement';
import RealTimeTracking from './components/RealTimeTracking';

function App() {
  const [activeTab, setActiveTab] = useState('shuttles');

  return (
    <div className="App">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>
        {activeTab === 'shuttles' && <ShuttleManagement />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'tracking' && <RealTimeTracking />}
      </main>
    </div>
  );
}

export default App;