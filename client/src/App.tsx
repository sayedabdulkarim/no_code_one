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

interface PRDResponse {
  prd: string;
}

function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [prd, setPRD] = useState<string | null>(null);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState("chat");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim()) {
      setError("Please enter a requirement");
      return;
    }

    setLoading(true);
    setError(null);
    setPRD(null);
    setResponse(null);

    try {
      // First, generate the PRD
      const prdResult = await axios.post<PRDResponse>(
        "http://localhost:8000/generate-prd",
        { requirement }
      );
      setPRD(prdResult.data.prd);
    } catch (err) {
      console.error("Error generating PRD:", err);
      setError("Failed to generate PRD. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePRDApproval = async (approved: boolean) => {
    if (!approved || !prd || !requirement) {
      setPRD(null);
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post<GenerateResponse>(
        "http://localhost:8000/approve-prd",
        { requirement, prd, approved }
      );
      setResponse(result.data);
      setPRD(null); // Clear PRD after approval
      setCopyStatus({});
    } catch (err) {
      console.error("Error generating UI:", err);
      setError("Failed to generate UI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ ...copyStatus, [type]: true });

      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [type]: false });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Generating..." : "Generate UI"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {prd && (
          <div className="prd-container">
            <h3>Product Requirements</h3>
            <div className="prd-content">
              <pre>{prd}</pre>
            </div>
            <div className="prd-actions">
              <button
                className="approve-button"
                onClick={() => handlePRDApproval(true)}
                disabled={loading}
              >
                {loading ? "Generating..." : "Approve & Generate Code"}
              </button>
              <button
                className="reject-button"
                onClick={() => handlePRDApproval(false)}
              >
                Reject & Start Over
              </button>
            </div>
          </div>
        )}

        {response && !prd && (
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                className={activeTab === "chat" ? "active-tab" : ""}
                onClick={() => setActiveTab("chat")}
              >
                Chat
              </button>
              <button
                className={activeTab === "html" ? "active-tab" : ""}
                onClick={() => setActiveTab("html")}
              >
                HTML
              </button>
              <button
                className={activeTab === "css" ? "active-tab" : ""}
                onClick={() => setActiveTab("css")}
              >
                CSS
              </button>
              <button
                className={activeTab === "javascript" ? "active-tab" : ""}
                onClick={() => setActiveTab("javascript")}
              >
                JavaScript
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === "chat" && (
                <div className="chat-container">
                  <div className="chat-box">
                    <div className="chat-message agent">
                      {response.analysis || "No analysis available."}
                    </div>
                    <div className="chat-message agent">
                      {response.plan || "No plan available."}
                    </div>
                    {response.feedback && (
                      <div className="chat-message agent">
                        {response.feedback}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "html" && (
                <div className="code-container">
                  <h3>HTML</h3>
                  <pre className="code-display">{response.html}</pre>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(response.html, "html")}
                  >
                    {copyStatus["html"] ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              )}

              {activeTab === "css" && (
                <div className="code-container">
                  <h3>CSS</h3>
                  <pre className="code-display">{response.css}</pre>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(response.css, "css")}
                  >
                    {copyStatus["css"] ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              )}

              {activeTab === "javascript" && (
                <div className="code-container">
                  <h3>JavaScript</h3>
                  <pre className="code-display">{response.javascript}</pre>
                  <button
                    className="copy-button"
                    onClick={() =>
                      copyToClipboard(response.javascript, "javascript")
                    }
                  >
                    {copyStatus["javascript"] ? "Copied!" : "Copy Code"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {response && !prd && (
          <div className="preview-container">
            <h3>Preview</h3>
            <iframe
              title="preview"
              className="preview-frame"
              srcDoc={getPreviewDocument()}
              sandbox="allow-scripts"
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
