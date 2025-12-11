using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TicTacToe.Data.DataAccess;

namespace TicTacToe.Backend.Game;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GameController(GameDataAccess gameDataAccess, UserDataAccess userDataAccess) : ControllerBase
{
    private readonly GameDataAccess gameDataAccess = gameDataAccess;
    private readonly UserDataAccess userDataAccess = userDataAccess;

    /// <summary>
    /// Checks if there is an unfinished single player game for the current user.
    /// Returns game info (gameId, difficulty) if found, null otherwise.
    /// </summary>
    [HttpGet("CheckUnfinishedGame")]
    public IActionResult CheckUnfinishedGame()
    {
        var username = User?.Identity?.Name;
        if (username == null)
        {
            return Unauthorized();
        }

        var user = userDataAccess.GetUser(username);
        if (user == null)
        {
            return Unauthorized();
        }

        var game = gameDataAccess.GetUnfinishedSinglePlayerGame(user.Id);
        if (game == null)
        {
            return Ok(null);
        }

        return Ok(new
        {
            gameId = game.Id,
            difficulty = game.Difficulty ?? 3
        });
    }
}
