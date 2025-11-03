namespace TicTacToe.Backend.Login.Models;

public class AuthenticationResponseModel
{
    public bool IsAuthenticated { get; set; }
    
    public string? Username { get; set; }
}