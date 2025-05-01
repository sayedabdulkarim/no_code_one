import React, { useState } from "react";
import axios from "axios";
import "./App.css";

interface GenerateResponse {
  html: string;
  css: string;
  javascript: string;
  analysis?: string;
  plan?: string;
  feedback?: string;
}

function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim()) {
      setError("Please enter a requirement");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.post<GenerateResponse>(
        "http://localhost:8000/generate",
        { requirement }
      );
      setResponse(result.data);
    } catch (err) {
      console.error("Error generating UI:", err);
      setError("Failed to generate UI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to create safe HTML for the preview
  const getPreviewDocument = () => {
    if (!response) return "";
    
    return `
      <html>
        <head>
          <style>${response.css}</style>
        </head>
        <body>
          ${response.html}
          <script>${response.javascript}</script>
        </body>
      </html>
    `;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>No-Code UI Generator</h1>
        <p>Describe what you want to create and get instant code</p>
      </header>

      <main className="App-main">
        <form onSubmit={handleSubmit} className="requirement-form">
          <textarea
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            placeholder="Describe the UI you want to create... (e.g., Create a login form with username and password fields)"
            rows={5}
            className="requirement-input"
          />
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate UI"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {response && (
          <div className="results-container">
            <div className="code-container">
              <div className="code-section">
                <h3>HTML</h3>
                <pre className="code-display">{response.html}</pre>
              </div>
              <div className="code-section">
                <h3>CSS</h3>
                <pre className="code-display">{response.css}</pre>
              </div>
              <div className="code-section">
                <h3>JavaScript</h3>
                <pre className="code-display">{response.javascript}</pre>
              </div>
            </div>
            
            <div className="preview-container">
              <h3>Preview</h3>
              <iframe
                title="preview"
                className="preview-frame"
                srcDoc={getPreviewDocument()}
                sandbox="allow-scripts"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
