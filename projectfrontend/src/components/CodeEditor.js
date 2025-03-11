// frontend/src/components/ProblemEditor.js
import React, { useState } from 'react';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

const CodeEditor = () => {
  // Problem data - this could also come from an API
  const problem = {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    exampleInput: "[2, 7, 11, 15], target = 9",
    exampleOutput: "[0, 1]",
    functionTemplate: `def two_sum(nums, target):
    # Your code here
    # Example solution:
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`
  };

  const [code, setCode] = useState(problem.functionTemplate);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setSubmitting(true);
    setResults(null);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/run',
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
        'http://localhost:5000/api/submissions',
        { code },
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

  return (
    <div className="problem-view">
      <div className="problem-container">
        <div className="problem-description">
          <h2>{problem.title}</h2>
          <div className="description-content">
            <p>{problem.description}</p>
            
            <div className="example">
              <h3>Example:</h3>
              <div className="example-block">
                <div>
                  <strong>Input:</strong> <code>{problem.exampleInput}</code>
                </div>
                <div>
                  <strong>Output:</strong> <code>{problem.exampleOutput}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="code-execution">
          <div className="editor-container">
            <h3>Solution</h3>
            <CodeMirror
              value={code}
              height="400px"
              extensions={[python()]}
              onChange={(value) => setCode(value)}
              theme="dark"
            />
          </div>
          
          <div className="action-buttons">
            <button onClick={handleRun} disabled={submitting} className="run-btn">
              {submitting ? 'Running...' : 'Run Code'}
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="submit-btn">
              {submitting ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>
          
          {error && (
            <div className="error-output">
              <h3>Error</h3>
              <pre className="error-message">{error}</pre>
            </div>
          )}
          
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
  );
};

export default CodeEditor;