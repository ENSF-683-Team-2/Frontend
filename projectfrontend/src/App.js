// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import CodeEditor from './components/CodeEditor';
import ProblemsList from './components/ProblemsList';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} logout={logout} />
        <div className="container">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  <Navigate to="/problems" />
                ) : (
                  <Login setIsAuthenticated={setIsAuthenticated} />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? (
                  <Navigate to="/problems" />
                ) : (
                  <Register setIsAuthenticated={setIsAuthenticated} />
                )
              } 
            />
            <Route 
              path="/problems" 
              element={
                isAuthenticated ? (
                  <ProblemsList />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/problem/:id" 
              element={
                isAuthenticated ? (
                  <CodeEditor />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/problems" />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;