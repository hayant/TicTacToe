/* Brief: new minimax with alpha‑beta, depth limit and move-generation constrained to nearby cells.
   Uses sliding 5-cell window heuristic to score lines. Exports findBestMove that returns the best
   { row, col } for player "O".*/

// typescript
// file: `TicTacToe/scripts/src/Helpers/AIHelpers.ts`

import { CellValue } from "../Data/CellValue";

const SIZE = 20;
const WIN = 5;
const MAX_SCORE = 1_000_000;
const MAX_DEPTH = 5;
const MAX_TRANSPOSITION_SIZE = 100_000;

type Board = CellValue[][];

export type Move = { row: number; col: number } | null;

type TranspositionEntry = {
    depth: number;
    value: number;
};

type ZobristCell = {
    X: number;
    O: number;
};

type ZobristTable = ZobristCell[][];

export type DifficultySettings = {
    depth: number;
    range: number;
    candidateLimit: number;
};

let currentCandidateRange = 2;
let currentCandidateLimit = 15;

/**
 * Find best move for "O".
 * - maxDepth default 3 (tune for performance)
 * - considers only empty cells within `range` of existing marks to reduce branching
 */
export function findBestMove(board: Board, maxDepth = MAX_DEPTH, range = 2, candidateLimit = 15): Move {
    currentCandidateRange = range;
    currentCandidateLimit = candidateLimit;

    // If board empty, pick center
    if (isBoardEmpty(board)) {
        const center = Math.floor(SIZE / 2);
        return { row: center, col: center };
    }

    // If we can win immediately, do so
    const winningMove = findImmediateWinningMove(board, "O");
    if (winningMove) {
        return winningMove;
    }

    // Otherwise block any immediate X win before diving into search
    const blockMove = findImmediateWinningMove(board, "X");
    if (blockMove) {
        return blockMove;
    }

    // Try to extend our own open three into an unstoppable four before blocking lesser threats
    const setupWin = findOpenFourSetupMove(board, "O");
    if (setupWin) {
        return setupWin;
    }

    // Block open-ended threats (e.g. _XXX_) before searching
    const threatBlock = findThreatBlockingMove(board, "X");
    if (threatBlock) {
        return threatBlock;
    }

    const initialHash = computeHash(board);

    const candidates = generateCandidates(board);
    if (candidates.length === 0) return null;

    let bestMove: Move = null;
    let bestScore = -Infinity;

    for (const mv of candidates) {
        const moveHash = applyMove(board, mv, "O", initialHash);

        // Immediate win shortcut dramatically reduces search depth for obvious plays
        if (checkWinner(board) === "O") {
            undoMove(board, mv);
            return mv;
        }

        const score = alphabeta(board, maxDepth - 1, -Infinity, Infinity, false, moveHash);
        undoMove(board, mv);

        if (score > bestScore) {
            bestScore = score;
            bestMove = mv;
        }
        // For debugging...
        console.log(`Move (${mv.row}, ${mv.col}) has score ${score}`);
    }

    return bestMove;
}

/* ---------- Core minimax + helpers ---------- */
const transposition = new Map<string, TranspositionEntry>();
const zobrist = generateZobristTable();

function computeHash(board: Board): number {
    let hash = 0;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const mark = board[r][c].mark;
            if (mark && zobrist[r][c]) {
                hash ^= zobrist[r][c][mark];
            }
        }
    }
    return hash >>> 0;
}

function alphabeta(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean,
    hash: number
): number {
    const cacheKey = `${hash}:${maximizing ? 1 : 0}`;
    const cached = transposition.get(cacheKey);
    if (cached && cached.depth >= depth) {
        return cached.value;
    }

    const winner = checkWinner(board);
    if (winner === "O") return MAX_SCORE + depth;
    if (winner === "X") return -MAX_SCORE - depth;
    if (depth === 0) return evaluate(board);

    const moves = generateCandidates(board);
    if (moves.length === 0) return 0; // draw

    if (maximizing) {
        let value = -Infinity;
        for (const mv of moves) {
            const moveHash = applyMove(board, mv, "O", hash);
            value = Math.max(value, alphabeta(board, depth - 1, alpha, beta, false, moveHash));
            undoMove(board, mv);
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        storeTransposition(cacheKey, depth, value);
        return value;
    } else {
        let value = Infinity;
        for (const mv of moves) {
            const moveHash = applyMove(board, mv, "X", hash);
            value = Math.min(value, alphabeta(board, depth - 1, alpha, beta, true, moveHash));
            undoMove(board, mv);
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        storeTransposition(cacheKey, depth, value);
        return value;
    }
}

function applyMove(board: Board, mv: { row: number; col: number }, mark: "X" | "O", hash: number): number {
    board[mv.row][mv.col] = { mark, latest: true };
    return (hash ^ zobrist[mv.row][mv.col][mark]) >>> 0;
}

function undoMove(board: Board, mv: { row: number; col: number }) {
    board[mv.row][mv.col] = { mark: null, latest: false };
}

/* ---------- Candidate generation ---------- */
function generateCandidates(board: Board): { row: number; col: number }[] {
    const candidates: { row: number; col: number; score: number }[] = [];
    const used = new Set<string>();

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c].mark !== null) continue;

            let hasNeighbor = false;
            let neighborScore = 0;
            for (let dr = -currentCandidateRange; dr <= currentCandidateRange; dr++) {
                for (let dc = -currentCandidateRange; dc <= currentCandidateRange; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
                    const neighbor = board[nr][nc].mark;
                    if (neighbor) {
                        hasNeighbor = true;
                        neighborScore += neighbor === "O" ? 3 : 2; // prioritize our threats
                    }
                }
            }

            if (hasNeighbor) {
                candidates.push({ row: r, col: c, score: neighborScore });
                used.add(`${r},${c}`);
            }
        }
    }

    return candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, currentCandidateLimit) // 🔥 keep only top N promising moves
        .map(({ row, col }) => ({ row, col }));
}

function isBoardEmpty(board: Board): boolean {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c].mark !== null) return false;
        }
    }
    return true;
}

/* ---------- Terminal check (winner) ---------- */

function checkWinner(board: Board): "X" | "O" | null {
    const dirs = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
    ];

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const mark = board[r][c].mark;
            if (!mark) continue;
            for (const { dr, dc } of dirs) {
                let count = 1;
                for (let step = 1; step < WIN; step++) {
                    const nr = r + dr * step, nc = c + dc * step;
                    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
                    if (board[nr][nc].mark === mark) count++; else break;
                }
                if (count >= WIN) return mark;
            }
        }
    }
    return null;
}

/* ---------- Heuristic evaluation ----------
   Sliding windows of length WIN. For each window:
   - if contains only O and empty: add 10^countO
   - if contains only X and empty: subtract 10^countX
*/
function evaluate(board: Board): number {
    let score = 0;
    // horizontal, vertical, diag \, diag /
    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
    ];

    for (const { dr, dc } of directions) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cells: (string | null)[] = [];

                for (let k = 0; k < WIN; k++) {
                    const nr = r + dr * k, nc = c + dc * k;
                    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
                        cells.push(null);
                    } else {
                        cells.push(board[nr][nc].mark);
                    }
                }
                const containsX = cells.some(x => x === "X");
                const containsO = cells.some(x => x === "O");
                if (!containsX && !containsO) continue;
                if (containsX && containsO) continue; // contested window
                // only O or only X
                const countO = cells.filter(x => x === "O").length;
                const countX = cells.filter(x => x === "X").length;
                if (countO > 0) {
                    score += Math.pow(10, countO);
                }
                if (countX > 0) {
                    score -= Math.pow(10, countX);
                }
            }
        }
    }

    return score;
}

function storeTransposition(key: string, depth: number, value: number) {
    transposition.set(key, { depth, value });
    if (transposition.size > MAX_TRANSPOSITION_SIZE) {
        transposition.clear();
    }
}

function generateZobristTable(): ZobristTable {
    const table: ZobristTable = [];
    const rng = mulberry32(0x9e3779b1);

    for (let r = 0; r < SIZE; r++) {
        const row: ZobristCell[] = [];
        for (let c = 0; c < SIZE; c++) {
            row.push({
                X: randomUInt32(rng),
                O: randomUInt32(rng),
            });
        }
        table.push(row);
    }
    return table;
}

function mulberry32(seed: number) {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function randomUInt32(random: () => number): number {
    return Math.floor(random() * 0xffffffff) >>> 0;
}

function findImmediateWinningMove(board: Board, mark: "X" | "O"): Move {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c].mark !== null) continue;

            const original = board[r][c];
            board[r][c] = { mark, latest: true };
            const isWin = checkWinner(board) === mark;
            board[r][c] = original;

            if (isWin) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

type ThreatCandidate = {
    priority: number;
    move: Move;
};

function findThreatBlockingMove(board: Board, opponent: "X" | "O"): Move {
    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
    ];

    const threats: ThreatCandidate[] = [];

    for (const { dr, dc } of directions) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cells: { r: number; c: number; mark: string | null }[] = [];
                for (let k = 0; k < WIN; k++) {
                    const nr = r + dr * k;
                    const nc = c + dc * k;
                    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
                        cells.length = 0;
                        break;
                    }
                    cells.push({ r: nr, c: nc, mark: board[nr][nc].mark });
                }
                if (cells.length !== WIN) continue;

                const hasOurMarks = cells.some(cell => cell.mark === "O");
                if (hasOurMarks) continue; // not an immediate opponent-only threat

                const opponentCount = cells.filter(cell => cell.mark === opponent).length;
                if (opponentCount < 3) continue; // ignore small patterns

                const empties = cells.filter(cell => cell.mark === null);
                if (empties.length === 0) continue;

                const boundaryEmpties = empties.filter(cell => {
                    const index = cells.indexOf(cell);
                    return index === 0 || index === cells.length - 1;
                });

                let priority = 0;
                if (opponentCount === 4) {
                    priority = 3; // must block now
                }
                else if (opponentCount === 3 && boundaryEmpties.length === 2) {
                    priority = 2; // open three (_XXX_)
                }
                else if (opponentCount === 3) {
                    priority = 1; // closed three
                }

                if (priority === 0) continue;

                const chosen = (boundaryEmpties[0] ?? empties[0]);
                threats.push({
                    priority,
                    move: { row: chosen.r, col: chosen.c },
                });
            }
        }
    }

    threats.sort((a, b) => b.priority - a.priority);
    return threats[0]?.move ?? null;
}

function findOpenFourSetupMove(board: Board, mark: "X" | "O"): Move {
    const opponent = mark === "X" ? "O" : "X";
    const directions = [
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 1, dc: 1 },
        { dr: 1, dc: -1 },
    ];

    for (const { dr, dc } of directions) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const cells: { r: number; c: number; mark: string | null }[] = [];
                for (let k = 0; k < WIN; k++) {
                    const nr = r + dr * k;
                    const nc = c + dc * k;
                    if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) {
                        cells.length = 0;
                        break;
                    }
                    cells.push({ r: nr, c: nc, mark: board[nr][nc].mark });
                }
                if (cells.length !== WIN) continue;

                const hasOpponent = cells.some(cell => cell.mark === opponent);
                if (hasOpponent) continue;

                const markCount = cells.filter(cell => cell.mark === mark).length;
                if (markCount !== 3) continue;

                const empties = cells.filter(cell => cell.mark === null);
                if (empties.length !== 2) continue;

                const boundaries = empties.filter(cell => {
                    const index = cells.indexOf(cell);
                    return index === 0 || index === cells.length - 1;
                });

                if (boundaries.length === 2) {
                    // playing either boundary makes an open four which is nearly unstoppable
                    return { row: boundaries[0].r, col: boundaries[0].c };
                }
            }
        }
    }

    return null;
}

export function getDifficultySettings(level: number): DifficultySettings {
    const clamped = Math.min(5, Math.max(1, Math.round(level)));

    switch (clamped) {
        case 1:
            return { depth: 1, range: 1, candidateLimit: 6 };
        case 2:
            return { depth: 2, range: 2, candidateLimit: 10 };
        case 3:
            return { depth: 3, range: 2, candidateLimit: 15 };
        case 4:
            return { depth: 4, range: 3, candidateLimit: 20 };
        case 5:
        default:
            return { depth: 5, range: 3, candidateLimit: 25 };
    }
}
