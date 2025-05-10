import styled from "@emotion/styled";

export const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
`;

export const WorkspaceLayout = styled.div<{ isFullScreen: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => (props.isFullScreen ? "1fr" : "40% 60%")};
  gap: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.md};
  height: calc(100vh - 60px);
`;

export const ToggleButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${(props) => props.theme.colors.surface};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
`;
