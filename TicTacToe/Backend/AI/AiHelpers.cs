using TicTacToe.Backend.AI.Models;

namespace TicTacToe.Backend.AI;

public static class AiHelpers
{
    private const int Size = 20;
    private const int Win = 5;
    private const int MaxScore = 1_000_000;
    private const int MaxTranspositionSize = 100_000;

    private static readonly Dictionary<string, TranspositionEntry> Transposition = new();
    private static readonly uint[][][] Zobrist = GenerateZobristTable();

    public static Move? FindBestMove(BoardCell[][] board, int maxDepth = 5, int range = 2, int candidateLimit = 15)
    {
        if (IsBoardEmpty(board))
        {
            var center = Size / 2;
            return new Move { Row = center, Col = center };
        }

        // If we can win immediately, do so
        var winningMove = FindImmediateWinningMove(board, "O");
        if (winningMove != null)
        {
            return winningMove;
        }

        // Block any immediate X win
        var blockMove = FindImmediateWinningMove(board, "X");
        if (blockMove != null)
        {
            return blockMove;
        }

        // Try to extend our own open three into an unstoppable four
        var setupWin = FindOpenFourSetupMove(board, "O");
        if (setupWin != null)
        {
            return setupWin;
        }

        // Block open-ended threats (e.g. _XXX_)
        var threatBlock = FindThreatBlockingMove(board, "X");
        if (threatBlock != null)
        {
            return threatBlock;
        }

        var initialHash = ComputeHash(board);
        var candidates = GenerateCandidates(board, range, candidateLimit);
        
        if (candidates.Count == 0)
        {
            return null;
        }

        Move? bestMove = null;
        var bestScore = double.NegativeInfinity;

        foreach (var mv in candidates)
        {
            var moveHash = ApplyMove(board, mv, "O", initialHash);

            // Immediate win shortcut
            if (CheckWinner(board) == "O")
            {
                UndoMove(board, mv);
                return mv;
            }

            var score = AlphaBeta(board, maxDepth - 1, double.NegativeInfinity, double.PositiveInfinity, false, moveHash);
            UndoMove(board, mv);

            if (score > bestScore)
            {
                bestScore = score;
                bestMove = mv;
            }
        }

        return bestMove;
    }

    public static DifficultySettings GetDifficultySettings(int level)
    {
        var clamped = Math.Min(5, Math.Max(1, (int)Math.Round((double)level)));

        return clamped switch
        {
            1 => new DifficultySettings { Depth = 1, Range = 1, CandidateLimit = 6 },
            2 => new DifficultySettings { Depth = 2, Range = 2, CandidateLimit = 10 },
            3 => new DifficultySettings { Depth = 3, Range = 2, CandidateLimit = 15 },
            4 => new DifficultySettings { Depth = 4, Range = 3, CandidateLimit = 20 },
            _ => new DifficultySettings { Depth = 5, Range = 3, CandidateLimit = 25 }
        };
    }

    private static double AlphaBeta(
        BoardCell[][] board,
        int depth,
        double alpha,
        double beta,
        bool maximizing,
        uint hash)
    {
        var cacheKey = $"{hash}:{(maximizing ? 1 : 0)}";
        if (Transposition.TryGetValue(cacheKey, out var cached) && cached.Depth >= depth)
        {
            return cached.Value;
        }

        var winner = CheckWinner(board);
        if (winner == "O")
        {
            return MaxScore + depth;
        }
        if (winner == "X")
        {
            return -MaxScore - depth;
        }
        if (depth == 0)
        {
            return Evaluate(board);
        }

        var moves = GenerateCandidates(board, 2, 15);
        if (moves.Count == 0)
        {
            return 0; // draw
        }

        if (maximizing)
        {
            var value = double.NegativeInfinity;
            foreach (var mv in moves)
            {
                var moveHash = ApplyMove(board, mv, "O", hash);
                value = Math.Max(value, AlphaBeta(board, depth - 1, alpha, beta, false, moveHash));
                UndoMove(board, mv);
                alpha = Math.Max(alpha, value);
                if (alpha >= beta)
                {
                    break;
                }
            }
            StoreTransposition(cacheKey, depth, value);
            return value;
        }
        else
        {
            var value = double.PositiveInfinity;
            foreach (var mv in moves)
            {
                var moveHash = ApplyMove(board, mv, "X", hash);
                value = Math.Min(value, AlphaBeta(board, depth - 1, alpha, beta, true, moveHash));
                UndoMove(board, mv);
                beta = Math.Min(beta, value);
                if (alpha >= beta)
                {
                    break;
                }
            }
            StoreTransposition(cacheKey, depth, value);
            return value;
        }
    }

    private static uint ApplyMove(BoardCell[][] board, Move mv, string mark, uint hash)
    {
        board[mv.Row][mv.Col] = new BoardCell { Mark = mark, Latest = true };
        var index = mark == "X" ? 0 : 1;
        return hash ^ Zobrist[mv.Row][mv.Col][index];
    }

    private static void UndoMove(BoardCell[][] board, Move mv)
    {
        board[mv.Row][mv.Col] = new BoardCell { Mark = null, Latest = false };
    }

    private static List<Move> GenerateCandidates(BoardCell[][] board, int range, int candidateLimit)
    {
        var candidates = new List<(int Row, int Col, double Score)>();

        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                if (board[r][c].Mark != null)
                {
                    continue;
                }

                var hasNeighbor = false;
                double neighborScore = 0;
                
                for (var dr = -range; dr <= range; dr++)
                {
                    for (var dc = -range; dc <= range; dc++)
                    {
                        var nr = r + dr;
                        var nc = c + dc;
                        if (nr < 0 || nr >= Size || nc < 0 || nc >= Size)
                        {
                            continue;
                        }
                        var neighbor = board[nr][nc].Mark;
                        if (neighbor != null)
                        {
                            hasNeighbor = true;
                            
                            // Calculate Chebyshev distance (max of row/col distance)
                            var distance = Math.Max(Math.Abs(dr), Math.Abs(dc));
                            
                            // Distance-based weight: closer cells get exponentially higher scores
                            // Distance 1 = 1.0, Distance 2 = 0.5, Distance 3 = 0.25, etc.
                            var distanceWeight = Math.Pow(0.5, distance - 1);
                            
                            // Base scores with higher priority for opponent marks
                            var baseScore = neighbor == "O" ? 3.0 : 4.0; // Opponent marks worth more
                            
                            // Apply distance weighting
                            neighborScore += baseScore * distanceWeight;
                        }
                    }
                }

                if (hasNeighbor)
                {
                    candidates.Add((r, c, neighborScore));
                }
            }
        }

        return candidates
            .OrderByDescending(x => x.Score)
            .Take(candidateLimit)
            .Select(x => new Move { Row = x.Row, Col = x.Col })
            .ToList();
    }

    private static bool IsBoardEmpty(BoardCell[][] board)
    {
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                if (board[r][c].Mark != null)
                {
                    return false;
                }
            }
        }
        return true;
    }

    private static string? CheckWinner(BoardCell[][] board)
    {
        var dirs = new[] { (0, 1), (1, 0), (1, 1), (1, -1) };

        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                var mark = board[r][c].Mark;
                if (mark == null)
                {
                    continue;
                }

                foreach (var (dr, dc) in dirs)
                {
                    var count = 1;
                    for (var step = 1; step < Win; step++)
                    {
                        var nr = r + dr * step;
                        var nc = c + dc * step;
                        if (nr < 0 || nr >= Size || nc < 0 || nc >= Size)
                        {
                            break;
                        }
                        if (board[nr][nc].Mark == mark)
                        {
                            count++;
                        }
                        else
                        {
                            break;
                        }
                    }
                    if (count >= Win)
                    {
                        return mark;
                    }
                }
            }
        }
        return null;
    }

    private static double Evaluate(BoardCell[][] board)
    {
        double score = 0;
        var directions = new[] { (0, 1), (1, 0), (1, 1), (1, -1) };

        foreach (var (dr, dc) in directions)
        {
            for (var r = 0; r < Size; r++)
            {
                for (var c = 0; c < Size; c++)
                {
                    var cells = new List<string?>();

                    for (var k = 0; k < Win; k++)
                    {
                        var nr = r + dr * k;
                        var nc = c + dc * k;
                        if (nr < 0 || nr >= Size || nc < 0 || nc >= Size)
                        {
                            cells.Add(null);
                        }
                        else
                        {
                            cells.Add(board[nr][nc].Mark);
                        }
                    }

                    var containsX = cells.Any(x => x == "X");
                    var containsO = cells.Any(x => x == "O");
                    if (!containsX && !containsO)
                    {
                        continue;
                    }
                    if (containsX && containsO)
                    {
                        continue; // contested window
                    }

                    var countO = cells.Count(x => x == "O");
                    var countX = cells.Count(x => x == "X");
                    if (countO > 0)
                    {
                        score += Math.Pow(10, countO);
                    }
                    if (countX > 0)
                    {
                        score -= Math.Pow(10, countX);
                    }
                }
            }
        }

        return score;
    }

    private static void StoreTransposition(string key, int depth, double value)
    {
        Transposition[key] = new TranspositionEntry { Depth = depth, Value = value };
        if (Transposition.Count > MaxTranspositionSize)
        {
            Transposition.Clear();
        }
    }

    private static uint ComputeHash(BoardCell[][] board)
    {
        uint hash = 0;
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                var mark = board[r][c].Mark;
                if (mark != null)
                {
                    var index = mark == "X" ? 0 : 1;
                    hash ^= Zobrist[r][c][index];
                }
            }
        }
        return hash;
    }

    private static uint[][][] GenerateZobristTable()
    {
        var table = new uint[Size][][];
        var rng = new Mulberry32(0x9e3779b1);

        for (var r = 0; r < Size; r++)
        {
            table[r] = new uint[Size][];
            for (var c = 0; c < Size; c++)
            {
                table[r][c] = new uint[2];
                table[r][c][0] = rng.NextUInt32();
                table[r][c][1] = rng.NextUInt32();
            }
        }
        return table;
    }

    private static Move? FindImmediateWinningMove(BoardCell[][] board, string mark)
    {
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                if (board[r][c].Mark != null)
                {
                    continue;
                }

                var original = board[r][c];
                board[r][c] = new BoardCell { Mark = mark, Latest = true };
                var isWin = CheckWinner(board) == mark;
                board[r][c] = original;

                if (isWin)
                {
                    return new Move { Row = r, Col = c };
                }
            }
        }
        return null;
    }

    private static Move? FindThreatBlockingMove(BoardCell[][] board, string opponent)
    {
        var directions = new[] { (0, 1), (1, 0), (1, 1), (1, -1) };
        var threats = new List<ThreatCandidate>();

        foreach (var (dr, dc) in directions)
        {
            for (var r = 0; r < Size; r++)
            {
                for (var c = 0; c < Size; c++)
                {
                    var cells = new List<(int R, int C, string? Mark)>();
                    for (var k = 0; k < Win; k++)
                    {
                        var nr = r + dr * k;
                        var nc = c + dc * k;
                        if (nr < 0 || nr >= Size || nc < 0 || nc >= Size)
                        {
                            cells.Clear();
                            break;
                        }
                        cells.Add((nr, nc, board[nr][nc].Mark));
                    }

                    if (cells.Count != Win)
                    {
                        continue;
                    }

                    var hasOurMarks = cells.Any(cell => cell.Mark == "O");
                    if (hasOurMarks)
                    {
                        continue;
                    }

                    var opponentCount = cells.Count(cell => cell.Mark == opponent);
                    if (opponentCount < 3)
                    {
                        continue;
                    }

                    var empties = cells.Where(cell => cell.Mark == null).ToList();
                    if (empties.Count == 0)
                    {
                        continue;
                    }

                    var boundaryEmpties = empties.Where(cell =>
                    {
                        var index = cells.IndexOf(cell);
                        return index == 0 || index == cells.Count - 1;
                    }).ToList();

                    int priority = 0;
                    if (opponentCount == 4)
                    {
                        priority = 3;
                    }
                    else if (opponentCount == 3 && boundaryEmpties.Count == 2)
                    {
                        priority = 2;
                    }
                    else if (opponentCount == 3)
                    {
                        priority = 1;
                    }

                    if (priority == 0)
                    {
                        continue;
                    }

                    var chosen = boundaryEmpties.Count > 0 ? boundaryEmpties[0] : empties[0];
                    threats.Add(new ThreatCandidate
                    {
                        Priority = priority,
                        Move = new Move { Row = chosen.R, Col = chosen.C }
                    });
                }
            }
        }

        return threats.OrderByDescending(t => t.Priority).FirstOrDefault()?.Move;
    }

    private static Move? FindOpenFourSetupMove(BoardCell[][] board, string mark)
    {
        var opponent = mark == "X" ? "O" : "X";
        var directions = new[] { (0, 1), (1, 0), (1, 1), (1, -1) };

        foreach (var (dr, dc) in directions)
        {
            for (var r = 0; r < Size; r++)
            {
                for (var c = 0; c < Size; c++)
                {
                    var cells = new List<(int R, int C, string? Mark)>();
                    for (var k = 0; k < Win; k++)
                    {
                        var nr = r + dr * k;
                        var nc = c + dc * k;
                        if (nr < 0 || nr >= Size || nc < 0 || nc >= Size)
                        {
                            cells.Clear();
                            break;
                        }
                        cells.Add((nr, nc, board[nr][nc].Mark));
                    }

                    if (cells.Count != Win)
                    {
                        continue;
                    }

                    var hasOpponent = cells.Any(cell => cell.Mark == opponent);
                    if (hasOpponent)
                    {
                        continue;
                    }

                    var markCount = cells.Count(cell => cell.Mark == mark);
                    if (markCount != 3)
                    {
                        continue;
                    }

                    var empties = cells.Where(cell => cell.Mark == null).ToList();
                    if (empties.Count != 2)
                    {
                        continue;
                    }

                    var boundaries = empties.Where(cell =>
                    {
                        var index = cells.IndexOf(cell);
                        return index == 0 || index == cells.Count - 1;
                    }).ToList();

                    if (boundaries.Count == 2)
                    {
                        return new Move { Row = boundaries[0].R, Col = boundaries[0].C };
                    }
                }
            }
        }

        return null;
    }

    private class TranspositionEntry
    {
        public int Depth { get; set; }
        public double Value { get; set; }
    }


    private class ThreatCandidate
    {
        public int Priority { get; set; }
        public Move Move { get; set; } = null!;
    }

    private class Mulberry32
    {
        private uint _seed;

        public Mulberry32(uint seed)
        {
            _seed = seed;
        }

        public uint NextUInt32()
        {
            var t = _seed += 0x6d2b79f5;
            t = (((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF);
            t ^= ((t + ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF);
            return (t ^ (t >> 14)) & 0xFFFFFFFF;
        }
    }
}

public class DifficultySettings
{
    public int Depth { get; init; }
    public int Range { get; init; }
    public int CandidateLimit { get; init; }
}