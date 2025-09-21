import './App.css';
import { Routes, Route, Link } from 'react-router-dom';
import Login from '../src/Components/Login/Login';
import Home from './Components/Home/Home';

function App() {
  return (
    <div className="App">
      <Login />
    </div>
  );
}

export default App;
