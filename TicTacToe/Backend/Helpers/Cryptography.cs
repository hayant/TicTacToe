using System.Security.Cryptography;
using System.Text;

namespace TicTacToe.Backend.Helpers;

public static class Cryptography
{
    public static (string Hash, string Salt) HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16); // 128-bit salt
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32); // 256-bit hash

        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public static bool VerifyPassword(string password, string storedHash, string storedSalt)
    {
        byte[] salt = Convert.FromBase64String(storedSalt);
        byte[] expectedHash = Convert.FromBase64String(storedHash);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);

        // Constant-time comparison -> does not leak information through timing (timing attack).
        return CryptographicOperations.FixedTimeEquals(hash, expectedHash);
    }
}