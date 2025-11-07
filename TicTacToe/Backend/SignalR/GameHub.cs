// file: `TicTacToe/Backend/SignalR/GameHub.cs`
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TicTacToe.Backend.SignalR;

[Authorize]
public class GameHub : Hub
{
    private static readonly Dictionary<string, string> _connectedUsers = new();

    public override async Task OnConnectedAsync()
    {
        var username = Context.User?.Identity?.Name;
        if (username != null)
        {
            _connectedUsers[Context.ConnectionId] = username;
            await Clients.All.SendAsync("UserConnected", username);
            await Clients.Caller.SendAsync("GetConnectedUsers", _connectedUsers.Values.ToList());
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectedUsers.TryGetValue(Context.ConnectionId, out var username))
        {
            _connectedUsers.Remove(Context.ConnectionId);
            await Clients.All.SendAsync("UserDisconnected", username);
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(string message)
    {
        var username = Context.User?.Identity?.Name ?? throw new InvalidOperationException("User is not authenticated");
        await Clients.All.SendAsync("ReceiveMessage", username, message);
    }
}