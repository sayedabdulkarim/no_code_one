import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import { darkTheme } from "./theme";
import { RequirementForm } from "./components/RequirementForm";
import axios from "axios";
import "./App.css";
import { EditorPanel } from "./components/EditorPanel";
import { Layout, ToggleButton, WorkspaceLayout } from "./components/Layout";
import { PRDPanel } from "./components/PRDPanel";
import { ChatPanel } from "./components/ChatPanel";

interface GenerateResponse {
  files: {
    "index.html": string;
    "style.css": string;
    "script.js": string;
  };
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeFile, setActiveFile] = useState("index.html");

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
          <style>${response.files["style.css"]}</style>
        </head>
        <body>
          ${response.files["index.html"]}
          <script>${response.files["script.js"]}</script>
        </body>
      </html>
    `;
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Layout>
        {!response && !prd ? (
          <RequirementForm
            requirement={requirement}
            setRequirement={setRequirement}
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : prd ? (
          <PRDPanel
            prd={prd}
            loading={loading}
            onApprove={() => handlePRDApproval(true)}
            onReject={() => handlePRDApproval(false)}
          />
        ) : (
          <WorkspaceLayout isFullScreen={isFullScreen}>
            <ToggleButton onClick={() => setIsFullScreen(!isFullScreen)}>
              {isFullScreen ? "Show Chat" : "Full Screen"}
            </ToggleButton>

            {!isFullScreen && (
              <ChatPanel
                analysis={response?.analysis}
                plan={response?.plan}
                feedback={response?.feedback}
              />
            )}

            <EditorPanel
              files={response?.files}
              activeFile={activeFile}
              onFileChange={setActiveFile}
              getPreviewDocument={getPreviewDocument}
            />
          </WorkspaceLayout>
        )}
      </Layout>
    </ThemeProvider>
  );
}

export default App;
