import React, { useEffect, useRef } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';

export interface ChatMessage {
    user: string;
    message: string;
    timestamp: Date;
}

type ChatPanelProps = {
    messages: ChatMessage[];
    messageInput: string;
    onMessageInputChange: (value: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    sx?: object;
};

export default function ChatPanel({
    messages,
    messageInput,
    onMessageInputChange,
    onSendMessage,
    sx
}: ChatPanelProps) {
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto scroll chat messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', ...sx }}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2 }}>
                {messages.map((msg, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                            {msg.timestamp.toLocaleTimeString()}
                        </Typography>
                        <Typography>
                            <strong>{msg.user}:</strong> {msg.message}
                        </Typography>
                    </Box>
                ))}
                <div ref={messagesEndRef} />
            </Box>

            <form onSubmit={onSendMessage} style={{ display: "flex", gap: 8 }}>
                <TextField
                    fullWidth
                    value={messageInput}
                    onChange={(e) => onMessageInputChange(e.target.value)}
                    placeholder="Type a message..."
                    size="small"
                />
                <Button type="submit" variant="contained">Send</Button>
            </form>
        </Paper>
    );
}
