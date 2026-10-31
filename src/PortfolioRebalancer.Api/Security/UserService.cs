using System.Security.Cryptography;
using System.Text.Json;

namespace PortfolioRebalancer.Api.Security;

public sealed record UserAccount(
    string Username,
    string PasswordHash, // PBKDF2 hash
    string Salt,
    string Role,
    string FullName,
    DateTime CreatedAt,
    List<string> AllowedPortfolioIds
);

public interface IUserService
{
    UserAccount? ValidateUser(string username, string password);
    UserAccount? GetByUsername(string username);
    bool ChangePassword(string username, string currentPassword, string newPassword);
}

public sealed class UserService : IUserService
{
    private readonly string _storagePath;
    private readonly List<UserAccount> _users = [];
    private readonly object _lock = new();

    public UserService(IConfiguration configuration)
    {
        var dataDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
        if (Directory.Exists(@"D:\PortfolioRebalancer\data"))
        {
            dataDir = @"D:\PortfolioRebalancer\data";
        }
        Directory.CreateDirectory(dataDir);
        _storagePath = Path.Combine(dataDir, "users.json");

        LoadOrCreateDefaultUsers();
    }

    private void LoadOrCreateDefaultUsers()
    {
        lock (_lock)
        {
            if (File.Exists(_storagePath))
            {
                try
                {
                    var json = File.ReadAllText(_storagePath);
                    var loaded = JsonSerializer.Deserialize<List<UserAccount>>(json);
                    if (loaded != null && loaded.Count > 0)
                    {
                        _users.Clear();
                        _users.AddRange(loaded);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WARN] Could not load users.json: {ex.Message}");
                }
            }

            // Ensure Dattatreya account exists with secure password Paisa@8888
            var existingDattatreya = _users.FirstOrDefault(u => u.Username.Equals("Dattatreya", StringComparison.OrdinalIgnoreCase));
            if (existingDattatreya == null)
            {
                var saltBytes = RandomNumberGenerator.GetBytes(16);
                var salt = Convert.ToBase64String(saltBytes);
                var hash = HashPassword("Paisa@8888", saltBytes);

                var dattatreya = new UserAccount(
                    Username: "Dattatreya",
                    PasswordHash: hash,
                    Salt: salt,
                    Role: "PortfolioOwner",
                    FullName: "Dattatreya",
                    CreatedAt: DateTime.UtcNow,
                    AllowedPortfolioIds: ["c2a566a2-3948-4441-9a9c-c0089136eacb", "52b4b25a-d67a-41f7-b590-0ad8b512dff1", "bd248722-3e09-4fab-84c3-e18e1d51fa68"]
                );

                _users.Add(dattatreya);
                SaveUsersToFile();
            }
        }
    }

    public UserAccount? ValidateUser(string username, string password)
    {
        lock (_lock)
        {
            var user = _users.FirstOrDefault(u => u.Username.Equals(username.Trim(), StringComparison.OrdinalIgnoreCase));
            if (user == null) return null;

            var saltBytes = Convert.FromBase64String(user.Salt);
            var computedHash = HashPassword(password, saltBytes);

            // Constant-time comparison to prevent timing attacks
            if (CryptographicOperations.FixedTimeEquals(
                Convert.FromBase64String(computedHash),
                Convert.FromBase64String(user.PasswordHash)))
            {
                return user;
            }

            return null;
        }
    }

    public UserAccount? GetByUsername(string username)
    {
        lock (_lock)
        {
            return _users.FirstOrDefault(u => u.Username.Equals(username.Trim(), StringComparison.OrdinalIgnoreCase));
        }
    }

    public bool ChangePassword(string username, string currentPassword, string newPassword)
    {
        lock (_lock)
        {
            var user = ValidateUser(username, currentPassword);
            if (user == null) return false;

            var newSaltBytes = RandomNumberGenerator.GetBytes(16);
            var newSalt = Convert.ToBase64String(newSaltBytes);
            var newHash = HashPassword(newPassword, newSaltBytes);

            _users.Remove(user);
            var updated = user with { PasswordHash = newHash, Salt = newSalt };
            _users.Add(updated);
            SaveUsersToFile();
            return true;
        }
    }

    private static string HashPassword(string password, byte[] salt)
    {
        // 100,000 iterations PBKDF2 with SHA-256 (NIST recommended)
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password: password,
            salt: salt,
            iterations: 100_000,
            hashAlgorithm: HashAlgorithmName.SHA256,
            outputLength: 32);

        return Convert.ToBase64String(hash);
    }

    private void SaveUsersToFile()
    {
        try
        {
            var json = JsonSerializer.Serialize(_users, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_storagePath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Failed to save users to file: {ex.Message}");
        }
    }
}
