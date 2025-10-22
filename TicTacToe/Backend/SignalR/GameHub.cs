using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TicTacToe.Backend.SignalR;

[Authorize]
public class GameHub : Hub
{
    public async Task SendData(string data)
    {
        var username = Context.User?.Identity?.Name ?? throw new InvalidOperationException("User is not authenticated");
        
        await Clients.User(username).SendAsync("ReceiveData", data);
    }
}