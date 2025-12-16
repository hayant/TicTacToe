# SignalR Data Transfer Objects (DTOs)

This directory contains models used for data transmission between the frontend (TypeScript) and backend (C#) via SignalR.

## Type Mappings

### AI Move Request/Response

**Frontend → Backend:**
- **TypeScript:** `{ board: BoardForBackend, difficulty: number }`
- **C#:** `AIMoveRequest`
  - `Board: BoardCell[][]`
  - `Difficulty: int`

**Backend → Frontend:**
- **C#:** `Move?` (nullable)
- **TypeScript:** `AIMoveResponse = { row: number, col: number } | null`

### Board Cell

**Frontend:**
```typescript
type BoardForBackend = Array<Array<{
    mark: "X" | "O" | null;
    latest: boolean;
}>>
```

**Backend:**
```csharp
BoardCell[][]  // where BoardCell has:
// - Mark: string? ("X", "O", or null)
// - Latest: bool
```

### Game Turn Data

**Backend → Frontend:**
- **C#:** `List<TurnData>`
- **TypeScript:** `TurnData[]`

**TurnData Structure:**
- `TurnNumber: int` → `turnNumber: number`
- `PosX: int` → `posX: number`
- `PosY: int` → `posY: number`
- `IsAI: bool` → `isAI: boolean`
- `Mark: string` → `mark: string` ("X" or "O")
- `UserId: int?` → `userId?: number | null` (optional, only in multiplayer)

## Usage

### RequestAIMove
```csharp
// Backend
public async Task<Move?> RequestAIMove(AIMoveRequest request)
```

```typescript
// Frontend
const move = await connection.invoke<AIMoveResponse>('RequestAIMove', {
    board: boardForBackend,
    difficulty: difficultyLevel
});
```

### LoadGameState
```csharp
// Backend
public async Task<List<TurnData>> LoadGameState(int gameId)
```

```typescript
// Frontend
const turns = await connection.invoke<TurnData[]>('LoadGameState', gameId);
```
