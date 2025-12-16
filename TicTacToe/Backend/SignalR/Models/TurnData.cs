namespace TicTacToe.Backend.SignalR.Models;

/// <summary>
/// Represents a game turn data structure for transmitting turn information between frontend and backend.
/// Used in LoadGameState SignalR method.
/// </summary>
public class TurnData
{
    public int TurnNumber { get; set; }
    public int PosX { get; set; }
    public int PosY { get; set; }
    public bool IsAI { get; set; }
    public string Mark { get; set; } = string.Empty;
    public int? UserId { get; set; }
}
