// file: TicTacToe/Backend/SignalR/GameHub.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using TicTacToe.Backend.AI;
using TicTacToe.Backend.AI.Models;
using TicTacToe.Data.DataAccess;
using TicTacToe.Data.Models;

namespace TicTacToe.Backend.SignalR;

[Authorize]
public class GameHub : Hub
{
    // username -> set of their active connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> ConnectedUsers
        = new(StringComparer.OrdinalIgnoreCase);

    // connectionId -> gameId
    private static readonly ConcurrentDictionary<string, int> ConnectionToGameId
        = new();

    // username pair key -> gameId (key format: "user1|user2" where user1 < user2 alphabetically)
    private static readonly ConcurrentDictionary<string, int> UserPairToGameId
        = new(StringComparer.OrdinalIgnoreCase);

    // gameId -> turn state (turn number, current mark, turn start time)
    private class TurnState
    {
        public int TurnNumber { get; set; } = 1;
        public string CurrentMark { get; set; } = "X";
        public DateTimeOffset TurnStartTime { get; set; } = DateTimeOffset.UtcNow;
    }

    private static readonly ConcurrentDictionary<int, TurnState> GameTurnStates = new();

    private static readonly Lock Locker = new();

    private readonly GameDataAccess gameDataAccess;
    private readonly UserDataAccess userDataAccess;

    public GameHub(GameDataAccess gameDataAccess, UserDataAccess userDataAccess)
    {
        this.gameDataAccess = gameDataAccess;
        this.userDataAccess = userDataAccess;
    }

    public override async Task OnConnectedAsync()
    {
        var username = Context.User?.Identity?.Name;

        if (username != null)
        {
            lock (Locker)
            {
                if (!ConnectedUsers.ContainsKey(username))
                {
                    ConnectedUsers[username] = [];
                }

                ConnectedUsers[username].Add(Context.ConnectionId);
            }

            await Clients.All.SendAsync("UserConnected", username);

            var allUsers = ConnectedUsers.Keys.ToList();
            await Clients.Caller.SendAsync("GetConnectedUsers", allUsers);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var username = Context.User?.Identity?.Name;

        if (username != null)
        {
            bool userFullyDisconnected = false;

            lock (Locker)
            {
                if (ConnectedUsers.TryGetValue(username, out var set))
                {
                    set.Remove(Context.ConnectionId);

                    if (set.Count == 0)
                    {
                        ConnectedUsers.TryRemove(username, out _);
                        userFullyDisconnected = true;
                    }
                }

                // Remove game mapping for this connection
                ConnectionToGameId.TryRemove(Context.ConnectionId, out _);
            }

            if (userFullyDisconnected)
            {
                await Clients.All.SendAsync("UserDisconnected", username);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    // -------------------- CHAT --------------------

    public async Task SendMessage(string message)
    {
        var username = Context.User?.Identity?.Name
                       ?? throw new InvalidOperationException("User not authenticated");

        await Clients.All.SendAsync("ReceiveMessage", username, message);
    }

    // -------------------- GAME REQUESTS --------------------

    private string? GetAnyConnectionForUser(string username)
    {
        lock (Locker)
        {
            if (ConnectedUsers.TryGetValue(username, out var set))
            {
                return set.FirstOrDefault();
            }
        }

        return null;
    }

    public async Task RequestGame(string targetPlayer)
    {
        var requestingPlayer = Context.User?.Identity?.Name;
        if (requestingPlayer == null)
        {
            return;
        }

        var targetConnection = GetAnyConnectionForUser(targetPlayer);

        if (targetConnection != null)
        {
            await Clients.Client(targetConnection)
                .SendAsync("GameRequested", requestingPlayer);
        }
    }

    public async Task AcceptGameRequest(string requestingPlayer)
    {
        var acceptingPlayer = Context.User?.Identity?.Name;
        if (acceptingPlayer == null) return;

        var requestingConn = GetAnyConnectionForUser(requestingPlayer);
        if (requestingConn == null) return;

        // Get user IDs
        var requestingUser = userDataAccess.GetUser(requestingPlayer);
        var acceptingUser = userDataAccess.GetUser(acceptingPlayer);

        if (requestingUser == null || acceptingUser == null) return;

        // Create game in database
        const int gridSizeX = 20;
        const int gridSizeY = 20;

        var gameId = gameDataAccess.CreateGame(
            userId: requestingUser.Id,
            user2Id: acceptingUser.Id,
            difficulty: null, // Multiplayer games don't have difficulty
            gridSizeX: gridSizeX,
            gridSizeY: gridSizeY,
            type: GameType.TwoPlayerOnline
        );

        // Store game ID for both connections and by username pair, and initialize turn state
        lock (Locker)
        {
            ConnectionToGameId[Context.ConnectionId] = gameId;
            ConnectionToGameId[requestingConn] = gameId;
            
            // Store by username pair (alphabetically sorted for consistent key)
            var userPairKey = string.Compare(requestingPlayer, acceptingPlayer, StringComparison.OrdinalIgnoreCase) < 0
                ? $"{requestingPlayer}|{acceptingPlayer}"
                : $"{acceptingPlayer}|{requestingPlayer}";
            UserPairToGameId[userPairKey] = gameId;
            
            // Initialize turn state for the game
            GameTurnStates.TryAdd(gameId, new TurnState
            {
                TurnNumber = 1,
                CurrentMark = "X",
                TurnStartTime = DateTimeOffset.UtcNow
            });
        }

        // Notify all clients
        await Clients.All.SendAsync("GameStarted", requestingPlayer, acceptingPlayer);

        await Clients.Client(requestingConn)
            .SendAsync("GameAccepted", acceptingPlayer);
    }

    public async Task RejectGameRequest(string requestingPlayer)
    {
        var rejectingPlayer = Context.User?.Identity?.Name;
        if (rejectingPlayer == null) return;

        await Clients.All.SendAsync("GameRejected", requestingPlayer, rejectingPlayer);
    }

    // -------------------- TURN TRACKING HELPERS --------------------

    private TurnState GetOrInitializeTurnState(int gameId)
    {
        return GameTurnStates.GetOrAdd(gameId, _ => new TurnState
        {
            TurnNumber = 1,
            CurrentMark = "X",
            TurnStartTime = DateTimeOffset.UtcNow
        });
    }

    private int? GetGameIdForConnection()
    {
        lock (Locker)
        {
            if (ConnectionToGameId.TryGetValue(Context.ConnectionId, out var gameId))
            {
                return gameId;
            }

            // Try to find by username pair for online multiplayer
            var username = Context.User?.Identity?.Name;
            if (username != null)
            {
                var opponent = ConnectedUsers.Keys
                    .FirstOrDefault(name => !name.Equals(username, StringComparison.OrdinalIgnoreCase));

                if (opponent != null)
                {
                    var userPairKey = string.Compare(username, opponent, StringComparison.OrdinalIgnoreCase) < 0
                        ? $"{username}|{opponent}"
                        : $"{opponent}|{username}";

                    if (UserPairToGameId.TryGetValue(userPairKey, out var pairGameId))
                    {
                        // Also store for this connection for future calls
                        ConnectionToGameId[Context.ConnectionId] = pairGameId;
                        return pairGameId;
                    }
                }
            }

            return null;
        }
    }

    private void SaveGameTurn(int gameId, int posX, int posY, int? userId)
    {
        var turnState = GetOrInitializeTurnState(gameId);
        var now = DateTimeOffset.UtcNow;
        DateTimeOffset turnStartTime;
        int turnNumber;
        string currentMark;

        // Read turn state values under lock
        lock (Locker)
        {
            turnStartTime = turnState.TurnStartTime;
            turnNumber = turnState.TurnNumber;
            currentMark = turnState.CurrentMark;
        }

        // Calculate duration in milliseconds
        var durationTimeSpan = now - turnStartTime;
        var durationMilliseconds = (long)durationTimeSpan.TotalMilliseconds;

        // Save the turn
        gameDataAccess.CreateGameTurn(
            gameId: gameId,
            turnNumber: turnNumber,
            userId: userId,
            duration: durationMilliseconds,
            posX: posX,
            posY: posY
        );

        // Update turn state for next move (thread-safe)
        lock (Locker)
        {
            if (currentMark == "O")
            {
                // Turn number increments when returning from O to X
                turnState.TurnNumber++;
                turnState.CurrentMark = "X";
            }
            else
            {
                // X moves, next is O (don't increment turn number yet)
                turnState.CurrentMark = "O";
            }

            turnState.TurnStartTime = now;
        }
    }

    // -------------------- GAME MOVES --------------------

    /// <summary>
    /// Saves a human player move in single player mode.
    /// </summary>
    public async Task MakeSinglePlayerMove(int row, int col)
    {
        var username = Context.User?.Identity?.Name;
        if (username == null) return;

        var gameId = GetGameIdForConnection();
        if (!gameId.HasValue) return;

        var user = userDataAccess.GetUser(username);
        if (user == null) return;

        var turnState = GetOrInitializeTurnState(gameId.Value);
        // In single player, human is always X
        lock (Locker)
        {
            if (turnState.CurrentMark == "X")
            {
                SaveGameTurn(gameId.Value, col, row, user.Id);
            }
        }
    }

    public async Task MakeMove(int row, int col)
    {
        var username = Context.User?.Identity?.Name;
        if (username == null) return;

        // Find opponent = any user except me
        string? opponent = ConnectedUsers.Keys
            .FirstOrDefault(name => !name.Equals(username, StringComparison.OrdinalIgnoreCase));

        if (opponent == null) return;

        var opponentConn = GetAnyConnectionForUser(opponent);
        if (opponentConn == null) return;

        // Get game ID and save turn
        var gameId = GetGameIdForConnection();
        if (gameId.HasValue)
        {
            var user = userDataAccess.GetUser(username);
            if (user != null)
            {
                SaveGameTurn(gameId.Value, col, row, user.Id);
            }
        }

        await Clients.Client(opponentConn).SendAsync("OpponentMove", row, col);
    }

    public async Task OpponentQuit()
    {
        var username = Context.User?.Identity?.Name;
        if (username == null)
        {
            return;
        }

        string? opponent = ConnectedUsers.Keys
            .FirstOrDefault(name => !name.Equals(username, StringComparison.OrdinalIgnoreCase));

        if (opponent == null)
        {
            return;
        }

        var opponentConn = GetAnyConnectionForUser(opponent);
        if (opponentConn == null)
        {
            return;
        }

        await Clients.Client(opponentConn).SendAsync("OpponentQuit");
    }

    // -------------------- AI PLAYER --------------------

    public async Task<Move?> RequestAIMove(AIMoveRequest request)
    {
        if (request.Board.Length == 0)
        {
            return null;
        }
    
        var settings = AiHelpers.GetDifficultySettings(request.Difficulty);
        
        var gameId = GetGameIdForConnection();
        var move = AiHelpers.FindBestMove(request.Board, settings.Depth, settings.Range, settings.CandidateLimit);
        
        // Save AI turn after move is calculated
        if (move != null && gameId.HasValue)
        {
            // AI is always O in single player mode
            SaveGameTurn(gameId.Value, move.Col, move.Row, null);
        }
        
        return move;
    }

    // -------------------- GAME MANAGEMENT --------------------

    /// <summary>
    /// Creates a new single player game. Called when single player game starts.
    /// </summary>
    public async Task<int> StartSinglePlayerGame(int difficulty)
    {
        var username = Context.User?.Identity?.Name;
        if (username == null)
        {
            throw new InvalidOperationException("User not authenticated");
        }

        var user = userDataAccess.GetUser(username);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        const int gridSizeX = 20;
        const int gridSizeY = 20;

        var gameId = gameDataAccess.CreateGame(
            userId: user.Id,
            user2Id: null, // Single player has no second user
            difficulty: difficulty,
            gridSizeX: gridSizeX,
            gridSizeY: gridSizeY,
            type: GameType.SinglePlayer
        );

        // Store game ID for this connection and initialize turn state
        lock (Locker)
        {
            ConnectionToGameId[Context.ConnectionId] = gameId;
            // Initialize turn state for the game
            GameTurnStates.TryAdd(gameId, new TurnState
            {
                TurnNumber = 1,
                CurrentMark = "X",
                TurnStartTime = DateTimeOffset.UtcNow
            });
        }

        return gameId;
    }

    /// <summary>
    /// Updates the game end time when a player wins. Called when game ends with a winner.
    /// </summary>
    public async Task<bool> EndGameWithWinner()
    {
        var username = Context.User?.Identity?.Name;
        if (username == null)
        {
            return false;
        }

        int? gameId = null;

        lock (Locker)
        {
            // First try to get game ID by connection
            if (ConnectionToGameId.TryGetValue(Context.ConnectionId, out var connGameId))
            {
                gameId = connGameId;
            }
            else
            {
                // If not found by connection, try to find by username pair
                // Find opponent username
                var opponent = ConnectedUsers.Keys
                    .FirstOrDefault(name => !name.Equals(username, StringComparison.OrdinalIgnoreCase));

                if (opponent != null)
                {
                    var userPairKey = string.Compare(username, opponent, StringComparison.OrdinalIgnoreCase) < 0
                        ? $"{username}|{opponent}"
                        : $"{opponent}|{username}";
                    
                    if (UserPairToGameId.TryGetValue(userPairKey, out var pairGameId))
                    {
                        gameId = pairGameId;
                        // Also store for this connection for future calls
                        ConnectionToGameId[Context.ConnectionId] = pairGameId;
                    }
                }
            }
        }

        if (gameId.HasValue)
        {
            return gameDataAccess.UpdateGameEndTime(gameId.Value, DateTimeOffset.UtcNow);
        }

        return false;
    }

    // -------------------- CONTINUE GAME --------------------


    /// <summary>
    /// Loads game state (turns) for a specific game.
    /// Returns list of turns with position and mark information.
    /// </summary>
    public async Task<List<object>> LoadGameState(int gameId)
    {
        var username = Context.User?.Identity?.Name;
        if (username == null)
        {
            return new List<object>();
        }

        var game = gameDataAccess.GetGame(gameId);
        if (game == null)
        {
            return new List<object>();
        }

        // Verify the game belongs to the current user
        var user = userDataAccess.GetUser(username);
        if (user == null || game.UserId != user.Id)
        {
            return new List<object>();
        }

        var turns = gameDataAccess.GetGameTurns(gameId);
        
        return turns.Select(turn => new
        {
            turnNumber = turn.TurnNumber,
            posX = turn.PosX,
            posY = turn.PosY,
            isAI = turn.UserId == null, // null userId means AI move
            mark = turn.UserId == null ? "O" : "X" // AI is O, human is X
        }).Cast<object>().ToList();
    }

    /// <summary>
    /// Continues an existing game by setting up the connection and restoring turn state.
    /// </summary>
    public async Task<bool> ContinueGame(int gameId)
    {
        var username = Context.User?.Identity?.Name;
        if (username == null)
        {
            return false;
        }

        var game = gameDataAccess.GetGame(gameId);
        if (game == null)
        {
            return false;
        }

        // Verify the game belongs to the current user and is unfinished
        var user = userDataAccess.GetUser(username);
        if (user == null || game.UserId != user.Id || game.EndTime != null)
        {
            return false;
        }

        // Load turns to determine current game state
        var turns = gameDataAccess.GetGameTurns(gameId);
        
        // Determine current turn state from the last turn
        int currentTurnNumber = 1;
        string currentMark = "X";
        
        if (turns.Count > 0)
        {
            var lastTurn = turns.Last();
            currentTurnNumber = lastTurn.TurnNumber;
            
            // If last turn was AI (O), next is X (human), turn number stays same
            // If last turn was human (X), next is O (AI), turn number increments
            if (lastTurn.UserId == null) // AI move
            {
                currentMark = "X";
                // Turn number stays the same for next human move
            }
            else // Human move
            {
                currentMark = "O";
                // Turn number increments for next AI move
                currentTurnNumber++;
            }
        }

        // Store game ID for this connection and restore turn state
        lock (Locker)
        {
            ConnectionToGameId[Context.ConnectionId] = gameId;
            
            // Restore or initialize turn state for the game
            GameTurnStates.AddOrUpdate(gameId, 
                new TurnState
                {
                    TurnNumber = currentTurnNumber,
                    CurrentMark = currentMark,
                    TurnStartTime = DateTimeOffset.UtcNow
                },
                (key, existing) => new TurnState
                {
                    TurnNumber = currentTurnNumber,
                    CurrentMark = currentMark,
                    TurnStartTime = DateTimeOffset.UtcNow
                });
        }

        return true;
    }
}
