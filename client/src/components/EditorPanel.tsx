import React, { useState, useEffect, useCallback, useRef } from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import styled from "@emotion/styled";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface EditorPanelProps {
  files: Record<string, string>;
  activeFile: string;
  onFileChange: (filename: string) => void;
  onCodeChange?: (filename: string, content: string) => void;
  getPreviewDocument: () => string;
  isFullScreen: boolean;
  onToggleFullscreen: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files,
  activeFile,
  onFileChange,
  onCodeChange,
  getPreviewDocument,
  isFullScreen,
  onToggleFullscreen,
}) => {
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  const getLanguageFromFilename = useCallback((filename: string): string => {
    if (filename.endsWith(".html")) return "html";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".js")) return "javascript";
    return "plaintext";
  }, []);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined && onCodeChange) {
        onCodeChange(activeFile, value);
      }
    },
    [activeFile, onCodeChange]
  );

  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();

    // Add all files to the zip
    Object.entries(files).forEach(([filename, content]) => {
      zip.file(filename, content);
    });

    // Generate and download the zip
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "project.zip");

    // Close dropdown after download
    setShowOptions(false);
  }, [files]);

  useEffect(() => {
    if (previewRef.current) {
      const previewContent = getPreviewDocument();
      previewRef.current.srcdoc = previewContent;
    }
  }, [files, getPreviewDocument]);

  return (
    <Container>
      <HeaderContainer>
        <TabList>
          {Object.keys(files).map((filename) => (
            <Tab
              key={filename}
              active={filename === activeFile}
              onClick={() => onFileChange(filename)}
            >
              {filename}
            </Tab>
          ))}
        </TabList>

        <OptionsWrapper>
          <OptionsButton onClick={() => setShowOptions(!showOptions)}>
            Options ▾
          </OptionsButton>

          {showOptions && (
            <OptionsDropdown>
              <OptionItem
                onClick={() => {
                  onToggleFullscreen();
                  setShowOptions(false);
                }}
              >
                {isFullScreen ? "Exit Fullscreen" : "Fullscreen Editor"}
              </OptionItem>
              <OptionItem onClick={handleDownloadZip}>
                Download as ZIP
              </OptionItem>
            </OptionsDropdown>
          )}
        </OptionsWrapper>
      </HeaderContainer>

      <EditorContainer>
        <Editor
          height="60vh"
          language={getLanguageFromFilename(activeFile)}
          value={files[activeFile]}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </EditorContainer>

      <PreviewContainer>
        <PreviewHeader>Preview</PreviewHeader>
        <PreviewFrame
          ref={previewRef}
          title="preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </PreviewContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${(props) => props.theme.colors.background};
  overflow: hidden;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const TabList = styled.div`
  display: flex;
  background: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${(props) =>
    props.active ? props.theme.colors.surface : props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border: none;
  border-right: 1px solid ${(props) => props.theme.colors.border};
  cursor: pointer;
  font-size: 13px;
  position: relative;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${(props) =>
      props.active ? props.theme.colors.primary : "transparent"};
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  min-height: 0;
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const PreviewContainer = styled.div`
  height: 40vh;
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const PreviewHeader = styled.div`
  padding: 4px 8px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  font-size: 12px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: calc(100% - 25px);
  border: none;
  background: white;
`;

const OptionsWrapper = styled.div`
  position: relative;
  margin-right: ${(props) => props.theme.spacing.md};
`;

const OptionsButton = styled.button`
  padding: 8px 16px;
  background: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: ${(props) => props.theme.colors.background};
  }
`;

const OptionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #333;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  min-width: 160px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const OptionItem = styled.button`
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  color: #eee;
  text-align: left;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #444;
  }

  & + & {
    border-top: 1px solid ${(props) => props.theme.colors.border};
  }
`;
