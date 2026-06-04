using System.Diagnostics;
using Gomoku.Backend.AI.Models;

namespace Gomoku.Backend.AI;

public static class AiHelpers
{
    private const int Size = 20;
    private const int Win = 5;
    private const double MaxScore = 1_000_000;

    private static readonly (int dr, int dc)[] Dirs = { (0, 1), (1, 0), (1, 1), (1, -1) };

    // 10^count weights (count 1..5). Index 0 is unused (guarded by count > 0).
    private static readonly double[] LineWeights = { 0, 10, 100, 1_000, 10_000, 100_000 };

    // Immutable — safe to share across threads.
    private static readonly ulong[][][] Zobrist = GenerateZobristTable();
    private static readonly ulong SideToMoveKey = SplitMix64(0xD1B54A32D192ED03UL);

    public static DifficultySettings GetDifficultySettings(int level)
    {
        var clamped = Math.Clamp(level, 1, 5);
        return clamped switch
        {
            1 => new DifficultySettings { Depth = 1, Range = 1, CandidateLimit = 6 },
            2 => new DifficultySettings { Depth = 2, Range = 2, CandidateLimit = 10 },
            3 => new DifficultySettings { Depth = 3, Range = 2, CandidateLimit = 15 },
            4 => new DifficultySettings { Depth = 4, Range = 3, CandidateLimit = 20 },
            _ => new DifficultySettings { Depth = 5, Range = 3, CandidateLimit = 25 }
        };
    }

    // Each call gets its OWN search state -> safe for concurrent SignalR requests.
    // timeBudgetMs caps the iterative deepening: maxDepth bounds the maximum depth, while the
    // budget stops the search in time and returns the best move from the last completed depth.
    public static Move? FindBestMove(BoardCell[][] board, int maxDepth = 5, int range = 2, int candidateLimit = 15, int timeBudgetMs = 2000)
        => new GomokuSearch(range, candidateLimit, timeBudgetMs).FindBestMove(board, maxDepth);

    // ---------- Shared, stateless helpers (thread-safe) ----------

    private static bool IsBoardEmpty(BoardCell[][] board)
    {
        for (var r = 0; r < Size; r++)
            for (var c = 0; c < Size; c++)
                if (board[r][c].Mark != null)
                    return false;
        return true;
    }

    // Checks for a win ONLY through the last placed stone -> O(4*Win) instead of the global O(Size^2*4*Win).
    private static bool IsWinningMove(BoardCell[][] board, int row, int col, string mark)
    {
        foreach (var (dr, dc) in Dirs)
        {
            var count = 1;
            for (var s = 1; s < Win; s++)
            {
                var nr = row + dr * s;
                var nc = col + dc * s;
                if (nr < 0 || nr >= Size || nc < 0 || nc >= Size || board[nr][nc].Mark != mark) break;
                count++;
            }
            for (var s = 1; s < Win; s++)
            {
                var nr = row - dr * s;
                var nc = col - dc * s;
                if (nr < 0 || nr >= Size || nc < 0 || nc >= Size || board[nr][nc].Mark != mark) break;
                count++;
            }
            if (count >= Win) return true;
        }
        return false;
    }

    // Mutates the cell instead of allocating a new BoardCell on every move.
    private static ulong ApplyMove(BoardCell[][] board, Move mv, string mark, ulong hash)
    {
        board[mv.Row][mv.Col].Mark = mark;
        var index = mark == "X" ? 0 : 1;
        return hash ^ Zobrist[mv.Row][mv.Col][index];
    }

    private static void UndoMove(BoardCell[][] board, Move mv)
    {
        board[mv.Row][mv.Col].Mark = null;
    }

    private static double Evaluate(BoardCell[][] board)
    {
        double score = 0;
        foreach (var (dr, dc) in Dirs)
        {
            for (var r = 0; r < Size; r++)
            {
                for (var c = 0; c < Size; c++)
                {
                    // The entire 5-window must fit on the board (a window running off the edge can never be filled).
                    var endR = r + dr * (Win - 1);
                    var endC = c + dc * (Win - 1);
                    if (endR < 0 || endR >= Size || endC < 0 || endC >= Size) continue;

                    int countO = 0, countX = 0;
                    for (var k = 0; k < Win; k++)
                    {
                        var m = board[r + dr * k][c + dc * k].Mark;
                        if (m == "O") countO++;
                        else if (m == "X") countX++;
                    }

                    if (countO > 0 && countX > 0) continue; // contested window
                    if (countO > 0) score += LineWeights[countO];
                    else if (countX > 0) score -= LineWeights[countX];
                }
            }
        }
        return score;
    }

    private static ulong ComputeHash(BoardCell[][] board)
    {
        ulong hash = 0;
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                var mark = board[r][c].Mark;
                if (mark == null) continue;
                var index = mark == "X" ? 0 : 1;
                hash ^= Zobrist[r][c][index];
            }
        }
        return hash;
    }

    private static ulong[][][] GenerateZobristTable()
    {
        var table = new ulong[Size][][];
        var state = 0x9E3779B97F4A7C15UL;
        for (var r = 0; r < Size; r++)
        {
            table[r] = new ulong[Size][];
            for (var c = 0; c < Size; c++)
            {
                table[r][c] = new ulong[2];
                table[r][c][0] = NextRandom(ref state);
                table[r][c][1] = NextRandom(ref state);
            }
        }
        return table;
    }

    // SplitMix64 — 64-bit, with a proper distribution. Replaces the 32-bit Mulberry32.
    private static ulong NextRandom(ref ulong state)
    {
        state += 0x9E3779B97F4A7C15UL;
        var z = state;
        z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL;
        z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL;
        return z ^ (z >> 31);
    }

    private static ulong SplitMix64(ulong seed)
    {
        var s = seed;
        return NextRandom(ref s);
    }

    // ---------- Root-level heuristics (root only, stateless) ----------

    private static Move? FindImmediateWinningMove(BoardCell[][] board, string mark)
    {
        for (var r = 0; r < Size; r++)
        {
            for (var c = 0; c < Size; c++)
            {
                if (board[r][c].Mark != null) continue;
                board[r][c].Mark = mark;
                var isWin = IsWinningMove(board, r, c, mark);
                board[r][c].Mark = null;
                if (isWin) return new Move { Row = r, Col = c };
            }
        }
        return null;
    }

    private static Move? FindThreatBlockingMove(BoardCell[][] board, string opponent)
    {
        var threats = new List<ThreatCandidate>();

        foreach (var (dr, dc) in Dirs)
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

                    if (cells.Count != Win) continue;
                    if (cells.Any(cell => cell.Mark == "O")) continue;

                    var opponentCount = cells.Count(cell => cell.Mark == opponent);
                    if (opponentCount < 3) continue;

                    var empties = cells.Where(cell => cell.Mark == null).ToList();
                    if (empties.Count == 0) continue;

                    var boundaryEmpties = empties.Where(cell =>
                    {
                        var index = cells.IndexOf(cell);
                        return index == 0 || index == cells.Count - 1;
                    }).ToList();

                    int priority = opponentCount == 4 ? 3
                        : opponentCount == 3 && boundaryEmpties.Count == 2 ? 2
                        : opponentCount == 3 ? 1
                        : 0;

                    if (priority == 0) continue;

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

        foreach (var (dr, dc) in Dirs)
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

                    if (cells.Count != Win) continue;
                    if (cells.Any(cell => cell.Mark == opponent)) continue;
                    if (cells.Count(cell => cell.Mark == mark) != 3) continue;

                    var empties = cells.Where(cell => cell.Mark == null).ToList();
                    if (empties.Count != 2) continue;

                    var boundaries = empties.Where(cell =>
                    {
                        var index = cells.IndexOf(cell);
                        return index == 0 || index == cells.Count - 1;
                    }).ToList();

                    if (boundaries.Count == 2)
                        return new Move { Row = boundaries[0].R, Col = boundaries[0].C };
                }
            }
        }

        return null;
    }

    // ---------- Search core: a dedicated instance per call (no shared state) ----------

    private sealed class GomokuSearch
    {
        private const int MaxTranspositionSize = 200_000;

        private readonly int _range;
        private readonly int _candidateLimit;
        private readonly long _budgetMs;
        private readonly Stopwatch _stopwatch = Stopwatch.StartNew();
        private readonly Dictionary<ulong, TtEntry> _tt = new();
        private bool _aborted;

        public GomokuSearch(int range, int candidateLimit, int timeBudgetMs)
        {
            _range = range;
            _candidateLimit = candidateLimit;
            _budgetMs = timeBudgetMs;
        }

        public Move? FindBestMove(BoardCell[][] board, int maxDepth)
        {
            if (IsBoardEmpty(board))
            {
                var center = Size / 2;
                return new Move { Row = center, Col = center };
            }

            // Cheap, high-confidence heuristics first.
            var winningMove = FindImmediateWinningMove(board, "O");
            if (winningMove != null) return winningMove;

            var blockMove = FindImmediateWinningMove(board, "X");
            if (blockMove != null) return blockMove;

            var setupWin = FindOpenFourSetupMove(board, "O");
            if (setupWin != null) return setupWin;

            var threatBlock = FindThreatBlockingMove(board, "X");
            if (threatBlock != null) return threatBlock;

            var hash = ComputeHash(board);
            var candidates = GenerateCandidates(board, _range, _candidateLimit);
            if (candidates.Count == 0) return null;

            // Iterative deepening: grow the depth 1..maxDepth. Each pass reuses the best move
            // the previous one stored in the TT -> more effective pruning. When the time budget
            // is exceeded, the incomplete depth is discarded and the last completed depth's move is returned.
            var bestMove = candidates[0];
            for (var depth = 1; depth <= maxDepth; depth++)
            {
                var (move, score) = SearchRoot(board, depth, hash, candidates);
                if (_aborted) break;

                if (move != null) bestMove = move;
                if (score >= MaxScore) break; // forced win found, deeper search is pointless
            }

            return bestMove;
        }

        private (Move? move, double score) SearchRoot(BoardCell[][] board, int depth, ulong hash, List<Move> candidates)
        {
            // Try the previous iteration's best move first.
            if (_tt.TryGetValue(hash, out var rootEntry) && rootEntry.Best != null)
                OrderTtMoveFirst(candidates, rootEntry.Best);

            Move? best = null;
            var bestScore = double.NegativeInfinity;
            var alpha = double.NegativeInfinity;
            const double beta = double.PositiveInfinity;

            foreach (var mv in candidates)
            {
                var moveHash = ApplyMove(board, mv, "O", hash);
                var score = IsWinningMove(board, mv.Row, mv.Col, "O")
                    ? MaxScore + depth
                    : AlphaBeta(board, depth - 1, alpha, beta, maximizing: false, moveHash);
                UndoMove(board, mv);

                if (_aborted) break;

                if (best == null || score > bestScore)
                {
                    bestScore = score;
                    best = mv;
                }
                alpha = Math.Max(alpha, bestScore);
            }

            // Store the root's best move for the next iteration (full window -> Exact).
            if (!_aborted && best != null)
                Store(hash, depth, bestScore, Bound.Exact, best);

            return (best, bestScore);
        }

        // Time budget check: once exceeded, _aborted stays set and the search unwinds quickly.
        private bool TimedOut()
        {
            if (_aborted) return true;
            if (_stopwatch.ElapsedMilliseconds >= _budgetMs)
            {
                _aborted = true;
                return true;
            }
            return false;
        }

        private double AlphaBeta(BoardCell[][] board, int depth, double alpha, double beta, bool maximizing, ulong hash)
        {
            // Time budget exceeded -> unwind quickly. The return value is discarded at the root
            // (the incomplete depth is ignored), so 0 is safe.
            if (TimedOut()) return 0;

            // Fold the side to move into the key (no more string interpolation).
            var key = maximizing ? hash : hash ^ SideToMoveKey;
            var alphaOrig = alpha;
            var betaOrig = beta;

            Move? ttMove = null;
            if (_tt.TryGetValue(key, out var entry) && entry.Depth >= depth)
            {
                switch (entry.Flag)
                {
                    case Bound.Exact: return entry.Value;
                    case Bound.Lower: alpha = Math.Max(alpha, entry.Value); break;
                    case Bound.Upper: beta = Math.Min(beta, entry.Value); break;
                }
                if (alpha >= beta) return entry.Value;
                ttMove = entry.Best;
            }

            if (depth == 0) return Evaluate(board);

            var moves = GenerateCandidates(board, _range, _candidateLimit);
            if (moves.Count == 0) return 0; // draw / no reasonable move

            if (ttMove != null) OrderTtMoveFirst(moves, ttMove);

            var mark = maximizing ? "O" : "X";
            Move? localBest = null;
            double value;

            if (maximizing)
            {
                value = double.NegativeInfinity;
                foreach (var mv in moves)
                {
                    var moveHash = ApplyMove(board, mv, mark, hash);
                    var child = IsWinningMove(board, mv.Row, mv.Col, mark)
                        ? MaxScore + depth
                        : AlphaBeta(board, depth - 1, alpha, beta, false, moveHash);
                    UndoMove(board, mv);

                    if (_aborted) break;

                    if (child > value)
                    {
                        value = child;
                        localBest = mv;
                    }
                    alpha = Math.Max(alpha, value);
                    if (alpha >= beta) break;
                }
            }
            else
            {
                value = double.PositiveInfinity;
                foreach (var mv in moves)
                {
                    var moveHash = ApplyMove(board, mv, mark, hash);
                    var child = IsWinningMove(board, mv.Row, mv.Col, mark)
                        ? -MaxScore - depth
                        : AlphaBeta(board, depth - 1, alpha, beta, true, moveHash);
                    UndoMove(board, mv);

                    if (_aborted) break;

                    if (child < value)
                    {
                        value = child;
                        localBest = mv;
                    }
                    beta = Math.Min(beta, value);
                    if (alpha >= beta) break;
                }
            }

            // Don't pollute the TT with the value of an aborted (unreliable) branch.
            if (_aborted) return value;

            // Store with the correct bound flag (fail-soft) — THIS fixes the alpha-beta + TT bug.
            var flag = value <= alphaOrig ? Bound.Upper
                : value >= betaOrig ? Bound.Lower
                : Bound.Exact;
            Store(key, depth, value, flag, localBest);
            return value;
        }

        private static List<Move> GenerateCandidates(BoardCell[][] board, int range, int candidateLimit)
        {
            var scored = new List<(int Row, int Col, double Score)>();

            for (var r = 0; r < Size; r++)
            {
                for (var c = 0; c < Size; c++)
                {
                    if (board[r][c].Mark != null) continue;

                    var hasNeighbor = false;
                    double neighborScore = 0;

                    for (var dr = -range; dr <= range; dr++)
                    {
                        for (var dc = -range; dc <= range; dc++)
                        {
                            if (dr == 0 && dc == 0) continue;
                            var nr = r + dr;
                            var nc = c + dc;
                            if (nr < 0 || nr >= Size || nc < 0 || nc >= Size) continue;

                            var neighbor = board[nr][nc].Mark;
                            if (neighbor == null) continue;

                            hasNeighbor = true;
                            var distance = Math.Max(Math.Abs(dr), Math.Abs(dc));
                            var distanceWeight = Math.Pow(0.5, distance - 1);
                            var baseScore = neighbor == "O" ? 3.0 : 4.0;
                            neighborScore += baseScore * distanceWeight;
                        }
                    }

                    if (hasNeighbor) scored.Add((r, c, neighborScore));
                }
            }

            scored.Sort((a, b) => b.Score.CompareTo(a.Score)); // in-place, no LINQ allocations
            var count = Math.Min(candidateLimit, scored.Count);
            var result = new List<Move>(count);
            for (var i = 0; i < count; i++)
                result.Add(new Move { Row = scored[i].Row, Col = scored[i].Col });
            return result;
        }

        private static void OrderTtMoveFirst(List<Move> moves, Move ttMove)
        {
            for (var i = 0; i < moves.Count; i++)
            {
                if (moves[i].Row == ttMove.Row && moves[i].Col == ttMove.Col)
                {
                    if (i != 0) (moves[0], moves[i]) = (moves[i], moves[0]);
                    return;
                }
            }
        }

        private void Store(ulong key, int depth, double value, Bound flag, Move? best)
        {
            if (_tt.Count > MaxTranspositionSize) _tt.Clear();
            _tt[key] = new TtEntry { Depth = depth, Value = value, Flag = flag, Best = best };
        }

        private enum Bound { Exact, Lower, Upper }

        private struct TtEntry
        {
            public int Depth;
            public double Value;
            public Bound Flag;
            public Move? Best;
        }
    }

    private sealed class ThreatCandidate
    {
        public int Priority { get; init; }
        public Move Move { get; init; } = null!;
    }
}

public class DifficultySettings
{
    public int Depth { get; init; }
    public int Range { get; init; }
    public int CandidateLimit { get; init; }
}
