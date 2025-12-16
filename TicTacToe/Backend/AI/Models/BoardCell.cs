namespace TicTacToe.Backend.AI.Models;

/// <summary>
/// Represents a single cell on the game board.
/// Corresponds to frontend type: { mark: "X" | "O" | null, latest: boolean }
/// Used in BoardForBackend type: Array&lt;Array&lt;BoardCell&gt;&gt;
/// </summary>
public class BoardCell
{
    /// <summary>
    /// The mark in the cell ("X", "O", or null for empty).
    /// </summary>
    public string? Mark { get; set; }
    
    /// <summary>
    /// Whether this cell is the latest move (for highlighting).
    /// </summary>
    public bool Latest { get; set; }
}

