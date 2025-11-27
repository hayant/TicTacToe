namespace TicTacToe.Backend.AI.Models;

public class AIMoveRequest
{
    public BoardCell[][] Board { get; set; } = Array.Empty<BoardCell[]>();
    public int Difficulty { get; set; } = 3;
}

