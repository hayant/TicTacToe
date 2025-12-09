using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TicTacToe.Data.Models;

public class GameTurn
{
    // Id
    public int Id { get; init; }
    
    // GameId
    [ForeignKey(nameof(Game))]
    public int GameId { get; init; }
    
    [Required]
    public required Game Game { get; init; }
    
    // TurnNumber
    public int TurnNumber { get; init; }
    
    // UserId (NULL = AI)
    [ForeignKey(nameof(User))]
    public int? UserId { get; init; }
    
    public User? User { get; init; }
    
    // Duration
    public DateTimeOffset Duration { get; init; }
    
    // PosX
    public int PosX { get; init; }
    
    // PosY
    public int PosY { get; init; }
}