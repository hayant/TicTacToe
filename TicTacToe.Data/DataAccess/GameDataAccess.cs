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
}

