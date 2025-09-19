import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import Login from './Components/Login/Login';
import Home from './Components/Home/Home';

function App() {
  return (
    <div className="App">
      <nav style={{ padding: '0.5rem 1rem' }}>
        <Link to="/">Home</Link> | <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;
