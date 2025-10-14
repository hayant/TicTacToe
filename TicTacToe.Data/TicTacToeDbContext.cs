
using Microsoft.EntityFrameworkCore;
using TicTacToe.Data.Models;

namespace TicTacToe.Data;

public class TicTacToeDbContext(DbContextOptions<TicTacToeDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
}