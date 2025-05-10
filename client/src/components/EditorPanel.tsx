import React from "react";
import Editor from "@monaco-editor/react";
import styled from "@emotion/styled";

interface EditorPanelProps {
  files: Record<string, string> | undefined;
  activeFile: string;
  onFileChange: (filename: string) => void;
  getPreviewDocument: () => string;
}

const getLanguageFromFilename = (filename: string): string => {
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".js")) return "javascript";
  return "plaintext";
};

export const EditorPanel: React.FC<EditorPanelProps> = ({
  files = {}, // Provide default empty object
  activeFile,
  onFileChange,
  getPreviewDocument,
}) => (
  <Container>
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

    <EditorWrapper>
      <Editor
        height="100%"
        language={getLanguageFromFilename(activeFile)}
        value={files[activeFile]}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
        }}
      />
    </EditorWrapper>

    <PreviewFrame
      title="preview"
      srcDoc={getPreviewDocument()}
      sandbox="allow-scripts"
    />
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  height: 100%;
`;

const TabList = styled.div`
  display: flex;
  gap: 2px;
  background: ${(props) => props.theme.colors.surface};
  padding: 4px;
  border-radius: 4px;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${(props) =>
    props.active ? props.theme.colors.primary : "transparent"};
  color: ${(props) => props.theme.colors.text};
  border: none;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background: ${(props) => !props.active && props.theme.colors.border};
  }
`;

const EditorWrapper = styled.div`
  flex: 1;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
`;

const PreviewFrame = styled.iframe`
  height: 300px;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  background: white;
`;
