namespace TicTacToe.Backend.AI.Models;

/// <summary>
/// Represents an AI move response.
/// Corresponds to frontend type: AIMoveResponse = { row: number, col: number } | null
/// </summary>
public class Move
{
    /// <summary>
    /// Row position of the move (0-based).
    /// </summary>
    public int Row { get; set; }
    
    /// <summary>
    /// Column position of the move (0-based).
    /// </summary>
    public int Col { get; set; }
}

