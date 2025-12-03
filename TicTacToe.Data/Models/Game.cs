using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TicTacToe.Data.Models;

public class Game
{
    // Id
    public int Id { get; init; }

    [ForeignKey(nameof(User))]
    public int UserId { get; init; }
    
    // User
    [Required]
    public required User User { get; init; }
    
    // User2Id
    [ForeignKey(nameof(User2))]
    public int? User2Id { get; init; }
    
    // User2
    public User? User2 { get; init; }
    
    // Difficulty
    public int? Difficulty { get; init; }
    
    // GridSizeX
    public int GridSizeX { get; init; }
    
    // GridSizeY
    public int GridSizeY { get; init; }
    
    // Type (see GameType enum: 1 = SinglePlayer, 2 = TwoPlayerLocal, 3 = TwoPlayerOnline)
    public int Type { get; init; }
    
    // StartTime
    public DateTimeOffset StartTime { get; init; }
    
    // EndTime
    public DateTimeOffset? EndTime { get; set; }
}