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
    public User? User2 { get; init; }
    
    // Difficulty
    public int Difficulty { get; init; }
    
    // Status (1 = InProgress, 2 = Finished)
    public int Status { get; init; }
    
    // GridSizeX
    public int GridSizeX { get; init; }
    
    // GridSizeY
    public int GridSizeY { get; init; }
    
    // Type (1 = SingleLocal, 2 = TwoPlayerLocal, 3 = TwoPlayerOnline)
    public int Type { get; init; }
    
    // StartTime
    public DateTimeOffset StartTime { get; init; }
    
    // EndTime
    public DateTimeOffset EndTime { get; init; }
}