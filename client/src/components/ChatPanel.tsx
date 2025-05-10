import React from "react";
import styled from "@emotion/styled";

interface ChatPanelProps {
  analysis?: string;
  plan?: string;
  feedback?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  analysis,
  plan,
  feedback,
}) => (
  <Container>
    {analysis && <Message>{analysis}</Message>}
    {plan && <Message>{plan}</Message>}
    {feedback && <Message>{feedback}</Message>}
  </Container>
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.surface};
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
`;

const Message = styled.div`
  padding: ${(props) => props.theme.spacing.md};
  background: ${(props) => props.theme.colors.background};
  border-radius: 4px;
  color: ${(props) => props.theme.colors.text};
  white-space: pre-wrap;
`;
