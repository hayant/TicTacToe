// file: `TicTacToe/Backend/SignalR/GameHub.cs`
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TicTacToe.Backend.SignalR;

[Authorize]
public class GameHub : Hub
{
    private static readonly Dictionary<string, string> ConnectedUsers = new();

    public override async Task OnConnectedAsync()
    {
        var username = Context.User?.Identity?.Name;
        if (username != null)
        {
            ConnectedUsers[Context.ConnectionId] = username;
            await Clients.All.SendAsync("UserConnected", username);
            await Clients.Caller.SendAsync("GetConnectedUsers", ConnectedUsers.Values.ToList());
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectedUsers.Remove(Context.ConnectionId, out var username))
        {
            await Clients.All.SendAsync("UserDisconnected", username);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string message)
    {
        var username = Context.User?.Identity?.Name ?? throw new InvalidOperationException("User is not authenticated");
        await Clients.All.SendAsync("ReceiveMessage", username, message);
    }
    
    public async Task RequestGame(string targetPlayer)
    {
        var requestingPlayer = Context.User?.Identity?.Name;
        var targetConnection = ConnectedUsers.FirstOrDefault(x => x.Value == targetPlayer).Key;
        
        if (targetConnection != null && requestingPlayer != null)
        {
            await Clients.Client(targetConnection).SendAsync("GameRequested", requestingPlayer);
        }
    }

    public async Task AcceptGameRequest(string requestingPlayer)
    {
        var acceptingPlayer = Context.User?.Identity?.Name;
        var requestingConnection = ConnectedUsers.FirstOrDefault(x => x.Value == requestingPlayer).Key;
        
        if (requestingConnection != null && acceptingPlayer != null)
        {
            await Clients.All.SendAsync("GameStarted", requestingPlayer, acceptingPlayer);
            await Clients.Client(requestingConnection).SendAsync("GameAccepted", acceptingPlayer);
        }
    }

    public async Task RejectGameRequest(string requestingPlayer)
    {
        var rejectingPlayer = Context.User?.Identity?.Name;
        await Clients.All.SendAsync("GameRejected", requestingPlayer, rejectingPlayer);
    }
    
    public async Task MakeMove(int row, int col)
    {
        var targetPlayer = ConnectedUsers.FirstOrDefault(x => x.Value != Context.User?.Identity?.Name).Key;
        if (targetPlayer != null)
        {
            await Clients.Client(targetPlayer).SendAsync("OpponentMove", row, col);
        }
    }

    public async Task OpponentQuit()
    {
        var targetPlayer = ConnectedUsers.FirstOrDefault(x => x.Value != Context.User?.Identity?.Name).Key;
        if (targetPlayer != null)
        {
            await Clients.Client(targetPlayer).SendAsync("OpponentQuit");
        }
    }
}