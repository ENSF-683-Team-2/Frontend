// frontend/src/components/ProblemsList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProblemsList = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/problems', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProblems(response.data);
      } catch (err) {
        setError(err.response ? err.response.data.error : 'Failed to fetch problems');
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const getDifficulty = (current) => {
    const difficultyMap = {
      "low": "Easy",
      "medium": "Medium",
      "high": "Hard"  
    };
    return difficultyMap[current] || "Unknown";
  };

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading problems...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="problem-list">
      <h2>Coding Challenges</h2>
      <div className="problem-grid">
        {problems.map((problem) => (
          <div key={problem.id} className="problem-card">
            <h3>{problem.title}</h3>
            <div className="problem-difficulty">
              Difficulty: <span className={`difficulty ${problem.level}`}>{getDifficulty(problem.level)}</span>
            </div>
            <p>{problem.description}</p>
            <Link to={`/problem/${problem.id}`} className="problem-link">
              Solve Challenge
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemsList;