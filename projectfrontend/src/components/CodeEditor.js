// frontend/src/components/CodeEditor.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { useParams } from 'react-router-dom';

const CodeEditor = () => {
  const { id } = useParams(); // Get problem ID from the URL
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [hint, setHint] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [gettingHint, setGettingHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/problems/${id}`);
        setProblem(response.data);
        setCode(response.data.starter_code || ''); // Use starter code if available
      } catch (err) {
        setError(err.response ? err.response.data.error : 'Failed to fetch problem');
      }
    };

    fetchProblem();
  }, [id]);

  const handleRun = async () => {
    setSubmitting(true);
    setResults(null);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3000/api/run',
        { code, problem_id: problem.id }, // Include `problem_id`
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle the response
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setResults(response.data);
      }
    } catch (err) {
      setError(err.response ? err.response.data.error : 'An error occurred while running your code');
      console.error('Error running code:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/submissions',
        { code, problem_id: problem.id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setResults({
        success: true,
        output: `Submission successful! ID: ${response.data.id}`,
        status: response.data.status
      });
    } catch (err) {
      setError(err.response ? err.response.data.error : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadPrevious = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:3000/api/submissions',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Find the most recent submission for this problem
      const submissions = response.data.submissions;
      const latestSubmission = submissions.find(sub => sub.problem_id === parseInt(problem.id));
      
      if (latestSubmission) {
        setCode(latestSubmission.code);
      } else {
        setError('No previous submissions found for this problem');
      }
    } catch (err) {
      setError(err.response ? err.response.data.error : 'Failed to load previous submission');
    } finally {
      setLoading(false);
    }
  };

  const handleGetHint = async () => {
    setGettingHint(true);
    setHint(''); // Clear previous hint
    setError('');
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/hint', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          problem_id: problem.id,
          results: results ? JSON.stringify(results) : null
        }),
      });
  
      if (!response.ok) throw new Error('Failed to get hint');
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedHint = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // Parse each line (Ollama sends JSON objects per line)
        chunk.split('\n').forEach(line => {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                accumulatedHint += data.response;
                setHint(accumulatedHint); // Update UI incrementally
              }
            } catch (e) {
              // Handle potential non-JSON responses
              accumulatedHint += line;
              setHint(accumulatedHint);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error getting hint:', err);
      setError(err.message || 'Failed to get hint from server');
    } finally {
      setGettingHint(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setFeedback(''); // Clear previous feedback
    setError('');
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          problem_id: problem.id,
          results: results ? JSON.stringify(results) : null 
        }),
      });
  
      if (!response.ok) throw new Error('Failed to analyze code');
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedFeedback = '';
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // Parse each line (Ollama sends JSON objects per line)
        chunk.split('\n').forEach(line => {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                accumulatedFeedback += data.response;
                setFeedback(accumulatedFeedback); // Update UI incrementally
              }
            } catch (e) {
              // Handle potential non-JSON responses
              accumulatedFeedback += line;
              setFeedback(accumulatedFeedback);
            }
          }
        });
      }
    } catch (err) {
      console.error('Error analyzing code:', err);
      setError(err.message || 'Failed to get feedback from server');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  if (!problem) {
    return <div>Loading problem...</div>;
  }

  return (
    <div className="problem-view">
      <div className="problem-header">
        <h2>{problem.title}</h2>
        <button 
          className="toggle-description-btn" 
          onClick={toggleDescription}
        >
          {showDescription ? 'Hide Description' : 'Show Description'}
        </button>
      </div>

      <div className={`problem-container ${showDescription ? '' : 'description-hidden'}`}>
        {showDescription && (
          <div className="problem-description">
            <div className="description-content">
              <p>{problem.description}</p>
              
              <div className="example">
                <h3>Example:</h3>
                <div className="example-block">
                  <div>
                    <strong>Input:</strong> <code>{problem.example_input}</code>
                  </div>
                  <div>
                    <strong>Output:</strong> <code>{problem.example_output}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="code-execution">
          <div className="editor-container">
            <h3>Solution</h3>
            <CodeMirror
              value={code}
              height="400px"
              extensions={[python()]}
              onChange={(value) => setCode(value)}
              theme="dark"
              basicSetup={{
                tabSize: 4
              }}
            />
          </div>
          
          <div className="buttons-row">
            <div className="action-buttons">
              <button onClick={handleRun} disabled={submitting} className="run-btn">
                {submitting ? 'Running...' : 'Run Code'}
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="submit-btn">
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </button>
              <button onClick={handleLoadPrevious} disabled={loading} className="load-btn">
                {loading ? 'Loading...' : 'Load Previous'}
              </button>
            </div>
          
            <div className="help-buttons">
              <button onClick={handleGetHint} disabled={gettingHint} className="hint-btn">
                {gettingHint ? 'Getting Hint...' : 'Get Hint'}
              </button>
              <button onClick={handleAnalyze} disabled={analyzing} className="analyze-btn">
                {analyzing ? 'Analyzing...' : 'Get Feedback'}
              </button>
            </div>
          </div>
          
          <div className="output-section">
            {error && (
              <div className="error-output">
                <h3>Error</h3>
                <pre className="error-message">{error}</pre>
              </div>
            )}

            <div className="help-section">
              {hint && (
                <div className="hint-container">
                  <h3>Hint</h3>
                  <div className="hint-message markdown-content">
                    <div dangerouslySetInnerHTML={{ 
                      __html: hint
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code>$1</code>')
                        .replace(/\n/g, '<br />')
                    }} />
                  </div>
                </div>
              )}

              {feedback && (
                <div className="feedback-container">
                  <h3>Feedback</h3>
                  <div className="feedback-message markdown-content">
                    <div dangerouslySetInnerHTML={{ 
                      __html: feedback
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`(.*?)`/g, '<code>$1</code>')
                        .replace(/\n/g, '<br />')
                    }} />
                  </div>
                </div>
              )}
            </div>
            
            {results && (
              <div className="results-container">
                <h3>Results</h3>
                
                <div className="output">
                  <h4>Output:</h4>
                  <pre>{results.output}</pre>
                </div>
                
                {results.testResults && (
                  <div className="test-results">
                    <h4>Test Cases:</h4>
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Test Case</th>
                          <th>Input</th>
                          <th>Expected</th>
                          <th>Actual</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.testResults.map((test, index) => (
                          <tr key={index} className={test.passed === "True" || test.passed === true ? 'passed' : 'failed'}>
                            <td>{test.case}</td>
                            <td><code>{test.input}</code></td>
                            <td><code>{test.expected}</code></td>
                            <td><code>{test.actual}</code></td>
                            <td className={`status ${test.passed === "True" || test.passed === true ? 'passed' : 'failed'}`}>
                              {test.passed === "True" || test.passed === true ? 'Passed' : 'Failed'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {results.executionTime && (
                  <div className="stats">
                    <p>Execution Time: {results.executionTime}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;