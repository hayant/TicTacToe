using TicTacToe.Data.Models;

namespace TicTacToe.Data.DataAccess;

public class GameDataAccess(TicTacToeDbContext database)
{
    private readonly TicTacToeDbContext database = database;

    public int CreateGame(int userId, int? user2Id, int? difficulty, int gridSizeX, int gridSizeY, GameType type)
    {
        // Load users to satisfy required navigation property
        var user = database.Users.First(u => u.Id == userId);
        var user2 = user2Id.HasValue ? database.Users.FirstOrDefault(u => u.Id == user2Id.Value) : null;

        var game = new Game
        {
            UserId = userId,
            User2Id = user2Id,
            Difficulty = difficulty,
            GridSizeX = gridSizeX,
            GridSizeY = gridSizeY,
            Type = (int)type,
            StartTime = DateTimeOffset.UtcNow,
            EndTime = null,
            User = user,
            User2 = user2
        };

        database.Games.Add(game);
        database.SaveChanges();

        return game.Id;
    }

    public bool UpdateGameEndTime(int gameId, DateTimeOffset endTime)
    {
        var game = database.Games.FirstOrDefault(g => g.Id == gameId);
        if (game == null)
        {
            return false;
        }

        game.EndTime = endTime;
        
        try
        {
            database.SaveChanges();
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    public Game? GetGame(int gameId)
    {
        return database.Games.FirstOrDefault(g => g.Id == gameId);
    }

    public void CreateGameTurn(int gameId, int turnNumber, int? userId, long duration, int posX, int posY)
    {
        var game = database.Games.FirstOrDefault(g => g.Id == gameId);
        if (game == null)
        {
            throw new InvalidOperationException($"Game with ID {gameId} not found");
        }

        User? user = null;
        if (userId.HasValue)
        {
            user = database.Users.FirstOrDefault(u => u.Id == userId.Value);
        }

        var gameTurn = new GameTurn
        {
            GameId = gameId,
            TurnNumber = turnNumber,
            UserId = userId,
            Duration = duration,
            PosX = posX,
            PosY = posY,
            Game = game,
            User = user
        };

        database.GameTurns.Add(gameTurn);
        database.SaveChanges();
    }

    /// <summary>
    /// Gets the latest unfinished single player game for a user.
    /// Returns null if no such game exists.
    /// </summary>
    public Game? GetUnfinishedSinglePlayerGame(int userId)
    {
        return database.Games
            .Where(g => g.UserId == userId 
                && g.Type == (int)GameType.SinglePlayer 
                && g.EndTime == null)
            .OrderByDescending(g => g.StartTime)
            .FirstOrDefault();
    }

    /// <summary>
    /// Gets all game turns for a specific game, ordered by turn number.
    /// </summary>
    public List<GameTurn> GetGameTurns(int gameId)
    {
        return database.GameTurns
            .Where(gt => gt.GameId == gameId)
            .OrderBy(gt => gt.TurnNumber)
            .ToList();
    }

    /// <summary>
    /// Gets the latest unfinished multiplayer game between two users where the inviter and invitee match.
    /// Returns null if no such game exists.
    /// Only matches games where inviterUserId is UserId and inviteeUserId is User2Id (not reversed).
    /// This ensures that if roles are reversed (A invites B vs B invites A), it's treated as a new game.
    /// </summary>
    public Game? GetUnfinishedMultiplayerGame(int inviterUserId, int inviteeUserId)
    {
        return database.Games
            .Where(g => g.Type == (int)GameType.TwoPlayerOnline
                && g.EndTime == null
                && g.UserId == inviterUserId
                && g.User2Id == inviteeUserId)
            .OrderByDescending(g => g.StartTime)
            .FirstOrDefault();
    }
}

