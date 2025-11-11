// file: `TicTacToe/scripts/src/Views/OnlineLobby/OnlineLobbyView.tsx`
import React, {useEffect, useRef, useState} from 'react';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogTitle,
    List,
    ListItem,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {useNavigate} from 'react-router';
import {Authorization} from "../../Helpers/Authorization";
import {GameViewProps} from "../GameView/GameView";
import {GameMode} from "../../Data/GameMode";

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
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [gameRequest, setGameRequest] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<string>('');

    const navigate = useNavigate();

    Authorization.checkAuthentication(setCurrentUser);

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl('/gameHub')
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

    useEffect(() => {
        if (connection) {
            connection.on('GameRequested', (requestingPlayer: string) => {
                setGameRequest(requestingPlayer);
            });

            connection.on('GameAccepted', (acceptingPlayer: string) => {
                const gameViewProps: GameViewProps = {
                    gameMode: GameMode.OnlineMultiplayer,
                    opponentUsername: acceptingPlayer,
                    iAmX: true,
                };
                
                navigate('/app/game', {
                    state: gameViewProps
                });
            });

            connection.on('GameStarted', (player1: string, player2: string) => {
                setMessages(prev => [...prev, {
                    user: 'System',
                    message: `${player1} started a game with ${player2}`,
                    timestamp: new Date()
                }]);
            });

            connection.on('GameRejected', (requestingPlayer: string, rejectingPlayer: string) => {
                setMessages(prev => [...prev, {
                    user: 'System',
                    message: `${rejectingPlayer} rejected a game with ${requestingPlayer}`,
                    timestamp: new Date()
                }]);
            });
        }
    }, [connection, navigate]);

    // Add these handlers
    const handlePlayerSelect = (username: string) => {
        if (username !== currentUser) {
            setSelectedPlayer(username);
        }
    };

    const handlePlayRequest = async () => {
        if (connection && selectedPlayer) {
            await connection.invoke('RequestGame', selectedPlayer);
        }
    };

    const handleAcceptGame = async () => {
        if (connection && gameRequest) {
            await connection.invoke('AcceptGameRequest', gameRequest);
            setGameRequest(null);

            const gameViewProps: GameViewProps = {
                gameMode: GameMode.OnlineMultiplayer,
                opponentUsername: gameRequest,
                iAmX: false,
            };
            
            navigate('/app/game', {
                state: gameViewProps
            });
        }
    };

    const handleRejectGame = async () => {
        if (connection && gameRequest) {
            await connection.invoke('RejectGameRequest', gameRequest);
            setGameRequest(null);
        }
    };
    
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

    const handleQuit = () => {
        if (connection) {
            connection.stop();
        }
        navigate('/app');
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box display="flex" gap={2} height="600px">
                <Paper sx={{ width: '25%', p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6">Online Users</Typography>
                    <List sx={{ flexGrow: 1 }}>
                        {connectedUsers.map((user, index) => (
                            <ListItem
                                key={index}
                                onClick={() => handlePlayerSelect(user)}
                                sx={{
                                    cursor: user !== currentUser ? 'pointer' : 'default',
                                    bgcolor: selectedPlayer === user ? 'action.selected' : 'inherit',
                                    '&:hover': {
                                        bgcolor: user !== currentUser ? 'action.hover' : 'inherit'
                                    }
                                }}
                            >
                                {user} {user === currentUser && '(you)'}
                            </ListItem>
                        ))}
                    </List>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePlayRequest}
                        disabled={!selectedPlayer}
                        sx={{ mt: 2, mb: 1 }}
                    >
                        Play Online
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleQuit}
                        sx={{ mt: 2 }}
                    >
                        Quit to Main Menu
                    </Button>
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

            <Dialog open={!!gameRequest} onClose={handleRejectGame}>
                <DialogTitle>
                    {gameRequest ? `${gameRequest} wants to play with you` : ''}
                </DialogTitle>
                <DialogActions>
                    <Button onClick={handleRejectGame} color="error">
                        Reject
                    </Button>
                    <Button onClick={handleAcceptGame} color="primary" variant="contained">
                        Accept
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}