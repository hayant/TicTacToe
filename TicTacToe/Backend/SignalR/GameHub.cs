// file: TicTacToe/Backend/SignalR/GameHub.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace TicTacToe.Backend.SignalR;

[Authorize]
public class GameHub : Hub
{
    // username -> set of their active connectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> ConnectedUsers
        = new(StringComparer.OrdinalIgnoreCase);

    private static readonly Lock Locker = new();

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
        if (username == null) return;

        string? opponent = ConnectedUsers.Keys
            .FirstOrDefault(name => !name.Equals(username, StringComparison.OrdinalIgnoreCase));

        if (opponent == null) return;

        var opponentConn = GetAnyConnectionForUser(opponent);
        if (opponentConn == null) return;

        await Clients.Client(opponentConn).SendAsync("OpponentQuit");
    }
}
