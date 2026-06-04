
using Microsoft.EntityFrameworkCore;
using Gomoku.Data.Models;

namespace Gomoku.Data;

public class GomokuDbContext(DbContextOptions<GomokuDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<GameTurn>  GameTurns { get; set; }
}