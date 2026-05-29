using TicTacToe.Backend.AI;
using TicTacToe.Backend.AI.Models;

namespace TicTacToe.Tests;

public class AiHelpersTests
{
    private const int Size = 20;

    private static BoardCell[][] EmptyBoard()
    {
        var board = new BoardCell[Size][];
        for (var r = 0; r < Size; r++)
        {
            board[r] = new BoardCell[Size];
            for (var c = 0; c < Size; c++)
            {
                board[r][c] = new BoardCell { Mark = null, Latest = false };
            }
        }
        return board;
    }

    private static void Place(BoardCell[][] board, int row, string mark, params int[] cols)
    {
        foreach (var col in cols)
        {
            board[row][col].Mark = mark;
        }
    }

    [Fact]
    public void FindBestMove_TakesImmediateWin_WhenFourInARow()
    {
        // AI is "O". Four O's in a row (cols 5..8) -> O wins by playing col 4 or col 9.
        var board = EmptyBoard();
        Place(board, 10, "O", 5, 6, 7, 8);

        var move = AiHelpers.FindBestMove(board, maxDepth: 3, range: 2, candidateLimit: 15);

        Assert.NotNull(move);
        Assert.Equal(10, move!.Row);
        Assert.True(move.Col is 4 or 9, $"Expected winning move at col 4 or 9, got col {move.Col}.");
    }

    [Fact]
    public void FindBestMove_BlocksOpponentImmediateWin()
    {
        // Opponent "X": _XXXX_ (cols 5..8) -> O is forced to block at col 4 or col 9.
        var board = EmptyBoard();
        Place(board, 10, "X", 5, 6, 7, 8);

        var move = AiHelpers.FindBestMove(board, maxDepth: 3, range: 2, candidateLimit: 15);

        Assert.NotNull(move);
        Assert.Equal(10, move!.Row);
        Assert.True(move.Col is 4 or 9, $"Expected blocking move at col 4 or 9, got col {move.Col}.");
    }

    [Fact]
    public void FindBestMove_DoesNotMutateInputBoard()
    {
        // Observable invariant of Apply/Undo symmetry (and thus Zobrist hash stability):
        // after the search the board must be unchanged, bit for bit.
        var board = EmptyBoard();
        Place(board, 9, "O", 9, 10);
        Place(board, 10, "X", 9, 10, 11);
        Place(board, 11, "O", 10);

        var before = Snapshot(board);

        AiHelpers.FindBestMove(board, maxDepth: 4, range: 2, candidateLimit: 15);

        var after = Snapshot(board);
        Assert.Equal(before, after);
    }

    [Fact]
    public void FindBestMove_IsDeterministic_AcrossRepeatedCalls()
    {
        // No shared mutable state -> the same board yields the same move on two consecutive calls.
        var board1 = EmptyBoard();
        Place(board1, 9, "O", 9, 10);
        Place(board1, 10, "X", 9, 10, 11);
        Place(board1, 11, "O", 10);

        var board2 = EmptyBoard();
        Place(board2, 9, "O", 9, 10);
        Place(board2, 10, "X", 9, 10, 11);
        Place(board2, 11, "O", 10);

        var first = AiHelpers.FindBestMove(board1, maxDepth: 3, range: 2, candidateLimit: 15);
        var second = AiHelpers.FindBestMove(board2, maxDepth: 3, range: 2, candidateLimit: 15);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first!.Row, second!.Row);
        Assert.Equal(first.Col, second.Col);
    }

    [Fact]
    public void FindBestMove_ReturnsLegalMove_UnderTinyTimeBudget()
    {
        // A very small time budget: iterative deepening only reaches a shallow depth at most,
        // but still returns a legal (empty, on-board) move.
        var board = EmptyBoard();
        Place(board, 9, "O", 9, 10);
        Place(board, 10, "X", 9, 10, 11);
        Place(board, 11, "O", 10);

        var move = AiHelpers.FindBestMove(board, maxDepth: 5, range: 3, candidateLimit: 25, timeBudgetMs: 1);

        Assert.NotNull(move);
        Assert.InRange(move!.Row, 0, Size - 1);
        Assert.InRange(move.Col, 0, Size - 1);
        Assert.Null(board[move.Row][move.Col].Mark); // the cell was empty
    }

    private static string Snapshot(BoardCell[][] board)
    {
        var sb = new System.Text.StringBuilder();
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                sb.Append(board[r][c].Mark ?? ".");
                sb.Append(board[r][c].Latest ? '!' : '_');
            }
        }
        return sb.ToString();
    }
}
