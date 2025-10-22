using System.ComponentModel.DataAnnotations;

namespace TicTacToe.Data.Models;

public class User
{
    public int Id { get; init; }
    
    [MaxLength(255)]
    public string Username { get; init; } = string.Empty;
    
    [MaxLength(255)]
    public string Email { get; init; } = string.Empty;
    
    [MaxLength(255)]
    public string PasswordHash { get; init; } = string.Empty;

    [MaxLength(255)]
    public string PasswordSalt { get; init; } = string.Empty;
    
    public DateTimeOffset CreatedAt { get; init; }
    
    public DateTimeOffset UpdatedAt { get; init; }
}