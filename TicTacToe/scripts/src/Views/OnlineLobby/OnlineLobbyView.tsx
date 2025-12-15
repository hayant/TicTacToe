import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    Paper,
    TextField,
    Typography
} from '@mui/material';

import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { useNavigate } from 'react-router';
import { Authorization } from "../../Helpers/Authorization";
import { GameMode } from "../../Data/GameMode";
import { GameViewProps } from "../GameView/GameView";
import { HttpHelpers } from "../../Helpers/HttpHelpers";

interface ChatMessage {
    user: string;
    message: string;
    timestamp: Date;
}

export default function OnlineLobbyView() {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [gameRequest, setGameRequest] = useState<string | null>(null);
    const [gameRequestGameId, setGameRequestGameId] = useState<number | null>(null);
    const [currentUser, setCurrentUser] = useState<string>('');
    const [error, setError] = useState('');
    const [continueDialogOpen, setContinueDialogOpen] = useState(false);
    const [unfinishedGameId, setUnfinishedGameId] = useState<number | null>(null);
    const [pendingTargetPlayer, setPendingTargetPlayer] = useState<string | null>(null);

    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    Authorization.checkAuthentication(setCurrentUser);

    //
    // Create + start the SignalR connection once
    //
    useEffect(() => {
        const conn = new HubConnectionBuilder()
            .withUrl('/gameHub')
            .withAutomaticReconnect()
            .build();

        setConnection(conn);

        conn.start().catch(err => {
            console.error("SignalR connection error:", err);
            setError("Connection failed.");
        });

        return () => {
            conn.stop();
        };
    }, []);

    //
    // Register event listeners once the connection exists
    //
    useEffect(() => {
        if (!connection) return;

        // --- Event handlers ---
        const handleReceive = (user: string, message: string) => {
            setMessages(prev => [...prev, { user, message, timestamp: new Date() }]);
        };

        const handleUserConnected = (username: string) => {
            setConnectedUsers(prev =>
                prev.includes(username) ? prev : [...prev, username]
            );
        };

        const handleUserDisconnected = (username: string) => {
            setConnectedUsers(prev => prev.filter(u => u !== username));
        };

        const handleGetUsers = (users: string[]) => {
            setConnectedUsers([...users]);
        };

        const handleGameRequested = (requestingPlayer: string, continueGameId?: number) => {
            setGameRequest(requestingPlayer);
            setGameRequestGameId(continueGameId || null);
        };

        const handleGameAccepted = (acceptingPlayer: string, gameId?: number, isContinuing?: boolean) => {
            const props: GameViewProps = {
                gameMode: GameMode.OnlineMultiplayer,
                opponentUsername: acceptingPlayer,
                iAmX: true,
                gameId: gameId,
                isContinuing: isContinuing
            };
            navigate('/app/game', { state: props });
        };

        const handleGameStarted = (player1: string, player2: string) => {
            setMessages(prev => [
                ...prev,
                {
                    user: "System",
                    message: `${player1} started a game with ${player2}`,
                    timestamp: new Date()
                }
            ]);
        };

        const handleGameRejected = (requestingPlayer: string, rejectingPlayer: string) => {
            setMessages(prev => [
                ...prev,
                {
                    user: "System",
                    message: `${rejectingPlayer} rejected a game with ${requestingPlayer}`,
                    timestamp: new Date()
                }
            ]);
        };

        // --- Register handlers ---
        connection.on("ReceiveMessage", handleReceive);
        connection.on("UserConnected", handleUserConnected);
        connection.on("UserDisconnected", handleUserDisconnected);
        connection.on("GetConnectedUsers", handleGetUsers);
        connection.on("GameRequested", handleGameRequested);
        connection.on("GameAccepted", handleGameAccepted);
        connection.on("GameStarted", handleGameStarted);
        connection.on("GameRejected", handleGameRejected);

        return () => {
            connection.off("ReceiveMessage", handleReceive);
            connection.off("UserConnected", handleUserConnected);
            connection.off("UserDisconnected", handleUserDisconnected);
            connection.off("GetConnectedUsers", handleGetUsers);
            connection.off("GameRequested", handleGameRequested);
            connection.off("GameAccepted", handleGameAccepted);
            connection.off("GameStarted", handleGameStarted);
            connection.off("GameRejected", handleGameRejected);
        };

    }, [connection, navigate]);

    //
    // Auto scroll chat messages
    //
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // ------------- ACTION HANDLERS -----------------

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (connection && messageInput.trim()) {
            try {
                await connection.invoke("SendMessage", messageInput.trim());
                setMessageInput("");
            } catch (err) {
                setError("Failed to send message.");
            }
        }
    };

    const handlePlayerSelect = (username: string) => {
        if (username !== currentUser) setSelectedPlayer(username);
    };

    const handlePlayRequest = async () => {
        if (connection && selectedPlayer) {
            // Check for unfinished game
            try {
                const result = await HttpHelpers.makeRequest<{gameId: number} | null>(
                    `/api/Game/CheckUnfinishedMultiplayerGame?targetPlayer=${encodeURIComponent(selectedPlayer)}`,
                    "GET"
                );
                
                if (result) {
                    // Unfinished game exists, show dialog
                    setUnfinishedGameId(result.gameId);
                    setPendingTargetPlayer(selectedPlayer);
                    setContinueDialogOpen(true);
                } else {
                    // No unfinished game, proceed with normal request
                    await connection.invoke("RequestGame", selectedPlayer, null);
                }
            } catch (error) {
                console.error("Failed to check for unfinished game:", error);
                // On error, proceed with normal request
                await connection.invoke("RequestGame", selectedPlayer, null);
            }
        }
    };

    const handleStartNewGame = async () => {
        if (connection && pendingTargetPlayer) {
            setContinueDialogOpen(false);
            setUnfinishedGameId(null);
            try {
                await connection.invoke("RequestGame", pendingTargetPlayer, null);
            } catch (error) {
                console.error("Failed to send game request:", error);
                setError("Failed to send game request. Please try again.");
            }
            setPendingTargetPlayer(null);
        }
    };

    const handleContinueExistingGame = async () => {
        if (connection && pendingTargetPlayer && unfinishedGameId) {
            setContinueDialogOpen(false);
            try {
                // Pass the gameId as the second parameter
                await connection.invoke("RequestGame", pendingTargetPlayer, unfinishedGameId);
            } catch (error) {
                console.error("Failed to send game request:", error);
                setError("Failed to send game request. Please try again.");
            }
            setUnfinishedGameId(null);
            setPendingTargetPlayer(null);
        }
    };

    const handleAcceptGame = async () => {
        if (connection && gameRequest) {
            const gameId = gameRequestGameId;
            await connection.invoke("AcceptGameRequest", gameRequest, gameId);

            const props: GameViewProps = {
                gameMode: GameMode.OnlineMultiplayer,
                opponentUsername: gameRequest,
                iAmX: false,
                gameId: gameId || undefined,
                isContinuing: gameId !== null
            };

            setGameRequest(null);
            setGameRequestGameId(null);
            navigate("/app/game", { state: props });
        }
    };

    const handleRejectGame = async () => {
        if (connection && gameRequest) {
            await connection.invoke("RejectGameRequest", gameRequest);
            setGameRequest(null);
        }
    };

    const handleQuit = () => {
        connection?.stop();
        navigate("/app");
    };

    // ------------------------------------------------

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box display="flex" gap={2} height="600px">
                {/* USERS LIST */}
                <Paper sx={{ width: '25%', p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6">Online Users</Typography>

                    <List sx={{ flexGrow: 1 }}>
                        {connectedUsers.map((user) => (
                            <ListItem
                                key={user}
                                onClick={() => handlePlayerSelect(user)}
                                sx={{
                                    cursor: user !== currentUser ? "pointer" : "default",
                                    bgcolor: selectedPlayer === user ? "action.selected" : "inherit",
                                    "&:hover": {
                                        bgcolor: user !== currentUser ? "action.hover" : "inherit"
                                    }
                                }}
                            >
                                {user} {user === currentUser && "(you)"}
                            </ListItem>
                        ))}
                    </List>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePlayRequest}
                        disabled={!selectedPlayer}
                        sx={{ mt: 2 }}
                    >
                        Play Online
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleQuit}
                        sx={{ mt: 2 }}
                    >
                        Quit to Main Menu
                    </Button>
                </Paper>

                {/* CHAT PANEL */}
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

                    <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
                        <TextField
                            fullWidth
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
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

            {/* GAME REQUEST DIALOG */}
            <Dialog open={!!gameRequest} onClose={handleRejectGame}>
                <DialogTitle>
                    {gameRequest ? `${gameRequest} wants to play with you` : ""}
                </DialogTitle>
                <DialogActions>
                    <Button onClick={handleRejectGame} color="error">Reject</Button>
                    <Button onClick={handleAcceptGame} variant="contained">Accept</Button>
                </DialogActions>
            </Dialog>

            {/* CONTINUE GAME DIALOG */}
            <Dialog open={continueDialogOpen} onClose={() => setContinueDialogOpen(false)}>
                <DialogTitle>Continue Game?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Start a new game or continue the existing game?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleStartNewGame}>Start new</Button>
                    <Button onClick={handleContinueExistingGame} variant="contained">Continue existing</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
