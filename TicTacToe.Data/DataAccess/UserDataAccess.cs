using TicTacToe.Data.Models;

namespace TicTacToe.Data.DataAccess;

public class UserDataAccess(TicTacToeDbContext database)
{
    private readonly TicTacToeDbContext database = database;

    public User? GetUser(string username)
    {
        return this.database.Users.FirstOrDefault(x => x.Username == username);
    }

    public bool CreateUser(User user)
    {
        this.database.Users.Add(user);

        try
        {
            this.database.SaveChanges();
        }
        catch (Exception)
        {
            return false;
        }
        
        return true;
    }
}