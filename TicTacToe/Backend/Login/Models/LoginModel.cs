using System.ComponentModel.DataAnnotations;

namespace TicTacToe.Backend.Login.Models;

public class LoginModel
{
    public string Username { get; set; } = string.Empty;
    
    public string Password { get; set; } = string.Empty;
};