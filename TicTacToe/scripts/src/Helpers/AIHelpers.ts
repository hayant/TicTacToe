/* Brief: new minimax with alpha‑beta, depth limit and move-generation constrained to nearby cells.
   Uses sliding 5-cell window heuristic to score lines. Exports findBestMove that returns the best
   { row, col } for player "O".*/

// typescript
// file: `TicTacToe/scripts/src/Helpers/AIHelpers.ts`

import { CellValue } from "../Data/CellValue";

const SIZE = 20;
const WIN = 5;
const MAX_SCORE = 1_000_000;

type Board = CellValue[][];
export type Move = { row: number; col: number } | null;

/**
 * Find best move for "O".
 * - maxDepth default 3 (tune for performance)
 * - considers only empty cells within `range` of existing marks to reduce branching
 */
export function findBestMove(board: Board, maxDepth = 3, range = 2): Move {
    // If board empty, pick center
    if (isBoardEmpty(board)) {
        const center = Math.floor(SIZE / 2);
        return { row: center, col: center };
    }

    const candidates = generateCandidates(board, range);
    if (candidates.length === 0) return null;

    let bestMove: Move = null;
    let bestScore = -Infinity;

    for (const mv of candidates) {
        applyMove(board, mv, "O");
        const score = alphabeta(board, maxDepth - 1, -Infinity, Infinity, false);
        undoMove(board, mv);
        if (score > bestScore) {
            bestScore = score;
            bestMove = mv;
        }
    }

    return bestMove;
}

/* ---------- Core minimax + helpers ---------- */
const transposition = new Map<string, number>();

function boardHash(board: Board): string {
    return board.flatMap(r => r.map(c => c.mark ?? "_")).join("");
}

// function alphabeta(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
//     const hash = boardHash(board);
//     const cached = transposition.get(hash);
//     if (cached !== undefined) return cached;
//
//     const winner = checkWinner(board);
//     if (winner === "O") return MAX_SCORE;
//     if (winner === "X") return -MAX_SCORE;
//     if (depth === 0) return evaluate(board);
//
//     const moves = generateCandidates(board, 2);
//     if (moves.length === 0) return 0; // draw
//
//     if (maximizing) {
//         let value = -Infinity;
//         for (const mv of moves) {
//             applyMove(board, mv, "O");
//             value = Math.max(value, alphabeta(board, depth - 1, alpha, beta, false));
//             undoMove(board, mv);
//             alpha = Math.max(alpha, value);
//             if (alpha >= beta) break;
//         }
//         transposition.set(hash, value);
//         return value;
//     } else {
//         let value = Infinity;
//         for (const mv of moves) {
//             applyMove(board, mv, "X");
//             value = Math.min(value, alphabeta(board, depth - 1, alpha, beta, true));
//             undoMove(board, mv);
//             beta = Math.min(beta, value);
//             if (alpha >= beta) break;
//         }
//         transposition.set(hash, value);
//         return value;
//     }
//    
//     // transposition.set(hash, value);
//     // return value;
// }

function alphabeta(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
    const winner = checkWinner(board);
    if (winner === "O") return MAX_SCORE;
    if (winner === "X") return -MAX_SCORE;
    if (depth === 0) return evaluate(board);

    const moves = generateCandidates(board, 2);
    if (moves.length === 0) return 0; // draw

    if (maximizing) {
        let value = -Infinity;
        for (const mv of moves) {
            applyMove(board, mv, "O");
            value = Math.max(value, alphabeta(board, depth - 1, alpha, beta, false));
            undoMove(board, mv);
            alpha = Math.max(alpha, value);
            if (alpha >= beta) break;
        }
        return value;
    } else {
        let value = Infinity;
        for (const mv of moves) {
            applyMove(board, mv, "X");
            value = Math.min(value, alphabeta(board, depth - 1, alpha, beta, true));
            undoMove(board, mv);
            beta = Math.min(beta, value);
            if (alpha >= beta) break;
        }
        return value;
    }
}

function applyMove(board: Board, mv: { row: number; col: number }, mark: "X" | "O") {
    board[mv.row][mv.col] = { mark, latest: true };
}

function undoMove(board: Board, mv: { row: number; col: number }) {
    board[mv.row][mv.col] = { mark: null, latest: false };
}

/* ---------- Candidate generation ---------- */
// function generateCandidates(board: Board, range = 2): { row: number; col: number }[] {
//     const candidates: { row: number; col: number; score: number }[] = [];
//     const used = new Set<string>();
//
//     for (let r = 0; r < SIZE; r++) {
//         for (let c = 0; c < SIZE; c++) {
//             if (board[r][c].mark !== null) continue;
//
//             let hasNeighbor = false;
//             let neighborScore = 0;
//             for (let dr = -range; dr <= range; dr++) {
//                 for (let dc = -range; dc <= range; dc++) {
//                     const nr = r + dr, nc = c + dc;
//                     if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
//                     const neighbor = board[nr][nc].mark;
//                     if (neighbor) {
//                         hasNeighbor = true;
//                         neighborScore += neighbor === "O" ? 3 : 2; // prioritize our threats
//                     }
//                 }
//             }
//
//             if (hasNeighbor) {
//                 candidates.push({ row: r, col: c, score: neighborScore });
//                 used.add(`${r},${c}`);
//             }
//         }
//     }
//
//     return candidates
//         .sort((a, b) => b.score - a.score)
//         .slice(0, 15) // 🔥 keep only top 10–15 promising moves
//         .map(({ row, col }) => ({ row, col }));
// }

function generateCandidates(board: Board, range = 2): { row: number; col: number }[] {
    const used = new Set<string>();
    const occupied: { r: number; c: number }[] = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c].mark !== null) occupied.push({ r, c });
        }
    }
    if (occupied.length === 0) {
        return [{ row: Math.floor(SIZE / 2), col: Math.floor(SIZE / 2) }];
    }
    for (const { r, c } of occupied) {
        for (let dr = -range; dr <= range; dr++) {
            for (let dc = -range; dc <= range; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue;
                if (board[nr][nc].mark === null) used.add(`${nr},${nc}`);
            }
        }
    }
    return Array.from(used).map(s => {
        const [row, col] = s.split(",").map(Number);
        return { row, col };
    });
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
                if (countO > 0) score += Math.pow(10, countO);
                if (countX > 0) score -= Math.pow(10, countX);
            }
        }
    }

    return score;
}
