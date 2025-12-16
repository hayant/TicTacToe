namespace TicTacToe.Backend.AI.Models;

/// <summary>
/// Request model for AI move calculation.
/// Corresponds to frontend type: { board: BoardForBackend, difficulty: number }
/// where BoardForBackend is Array&lt;Array&lt;{mark: "X" | "O" | null, latest: boolean}&gt;&gt;
/// </summary>
public class AIMoveRequest
{
    /// <summary>
    /// The game board state. Corresponds to frontend BoardForBackend type.
    /// </summary>
    public BoardCell[][] Board { get; set; } = Array.Empty<BoardCell[]>();
    
    /// <summary>
    /// Difficulty level (1-5, default 3).
    /// </summary>
    public int Difficulty { get; set; } = 3;
}

