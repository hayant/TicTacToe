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

        // Store game ID for both connections and by username pair
        lock (Locker)
        {
            ConnectionToGameId[Context.ConnectionId] = gameId;
            ConnectionToGameId[requestingConn] = gameId;
            
            // Store by username pair (alphabetically sorted for consistent key)
            var userPairKey = string.Compare(requestingPlayer, acceptingPlayer, StringComparison.OrdinalIgnoreCase) < 0
                ? $"{requestingPlayer}|{acceptingPlayer}"
                : $"{acceptingPlayer}|{requestingPlayer}";
            UserPairToGameId[userPairKey] = gameId;
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

    // -------------------- GAME MOVES --------------------

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
        var move = AiHelpers.FindBestMove(request.Board, settings.Depth, settings.Range, settings.CandidateLimit);
        
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

        // Store game ID for this connection
        lock (Locker)
        {
            ConnectionToGameId[Context.ConnectionId] = gameId;
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
}
