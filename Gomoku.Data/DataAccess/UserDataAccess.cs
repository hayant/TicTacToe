using Gomoku.Data.Models;

namespace Gomoku.Data.DataAccess;

public class UserDataAccess(GomokuDbContext database)
{
    private readonly GomokuDbContext database = database;

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