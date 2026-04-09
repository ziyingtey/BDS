using System.ComponentModel.DataAnnotations;

namespace bds_backend.Dtos;

public class RegisterRequest
{
    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(72)]
    public string Password { get; set; } = string.Empty;

    [Required, RegularExpression("Customer|Staff")]
    public string Role { get; set; } = "Customer";
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class DeleteAccountRequest
{
    [Required]
    public string Password { get; set; } = string.Empty;
}
