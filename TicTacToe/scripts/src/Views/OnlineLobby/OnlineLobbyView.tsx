// file: `TicTacToe/scripts/src/Views/OnlineLobby/OnlineLobbyView.tsx`
import React, { useEffect, useState, useRef } from 'react';
import { Container, Paper, TextField, Button, List, ListItem, Typography, Box } from '@mui/material';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

interface ChatMessage {
    user: string;
    message: string;
    timestamp: Date;
}

export default function OnlineLobbyView() {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl('/hubs/game')
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    connection.on('ReceiveMessage', (user: string, message: string) => {
                        setMessages(prev => [...prev, {
                            user,
                            message,
                            timestamp: new Date()
                        }]);
                    });

                    connection.on('UserConnected', (username: string) => {
                        setConnectedUsers(prev => [...prev, username]);
                    });

                    connection.on('UserDisconnected', (username: string) => {
                        setConnectedUsers(prev => prev.filter(u => u !== username));
                    });

                    connection.on('GetConnectedUsers', (users: string[]) => {
                        setConnectedUsers(users);
                    });
                })
                .catch(err => setError('Connection failed: ' + err));
        }
    }, [connection]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (connection && messageInput.trim()) {
            try {
                await connection.invoke('SendMessage', messageInput.trim());
                setMessageInput('');
            } catch (err) {
                setError('Failed to send message');
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box display="flex" gap={2} height="600px">
                <Paper sx={{ width: '25%', p: 2 }}>
                    <Typography variant="h6">Online Users</Typography>
                    <List>
                        {connectedUsers.map((user, index) => (
                            <ListItem key={index}>{user}</ListItem>
                        ))}
                    </List>
                </Paper>

                <Paper sx={{ width: '75%', p: 2, display: 'flex', flexDirection: 'column' }}>
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

                    <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
                        <TextField
                            fullWidth
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            variant="outlined"
                            size="small"
                        />
                        <Button type="submit" variant="contained">Send</Button>
                    </form>
                </Paper>
            </Box>

            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Container>
    );
}