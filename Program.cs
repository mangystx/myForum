using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using myForum.Dal.Structures;
using Microsoft.AspNetCore.Authentication.Cookies;
using myForum.Dal.Models;

var dbContext = new MyForumDbContextFactory().CreateDbContext(args);
const string adminRole = "admin";
const string userRole = "user";

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/accessdenied";
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapPost("/signUp", async (HttpContext context) =>
{
    Console.WriteLine("in sighUp");
    var form = context.Request.Form;
    if (!form.ContainsKey("userName") || !form.ContainsKey("password"))
    {
        Console.WriteLine("in no contais");
        string message = String.Empty;
        if (!form.ContainsKey("userName") && !form.ContainsKey("password"))
        {
            message = "User name and password are not set";
        }
        else if (!form.ContainsKey("userName")) message = "User name are not set";
        else message = "Password are not set";

        return Results.BadRequest(message);
    }

    string userName = form["userName"];
    string password = form["password"];
    Console.WriteLine("after no contains");
    if (dbContext.Users.Any(u => u.Name == userName)) return Results.BadRequest("User already exists");
    User user = new User { Name = userName, Role = userRole, Password = password };
    dbContext.Users.Add(user);
    dbContext.SaveChanges();
    
    var claims = new List<Claim>
    {
        new (ClaimTypes.Name, userName),
        new (ClaimTypes.Role, user.Role)
    };

    await context.SignInAsync(
        new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
    Console.WriteLine("after signIn");
    return Results.Redirect("/");
});

app.MapPost("/login", async (string? returnUrl, HttpContext context) =>
{
    var form = context.Request.Form;
    if (!form.ContainsKey("userName") || !form.ContainsKey("password"))
    {
        string message = String.Empty;
        if (!form.ContainsKey("userName") && !form.ContainsKey("password"))
        {
            message = "User name and password are not set";
        }
        else if (!form.ContainsKey("userName")) message = "User name are not set";
        else message = "Password are not set";

        return Results.BadRequest(message);
    }

    string userName = form["userName"];
    string password = form["password"];
    if (userName == "Admin") return Results.Redirect("/accessdenied");
    User? user = dbContext.Users.FirstOrDefault(u => u.Name == userName && u.Password == password);
    if (user is null) return Results.Unauthorized();
    
    var claims = new List<Claim>
    {
        new (ClaimTypes.Name, userName),
        new (ClaimTypes.Role, user.Role)
    };

    await context.SignInAsync(
        new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
    return Results.Redirect(returnUrl ?? "/");
});

app.MapGet("/accessdenied", async (HttpContext context) =>
{
    context.Response.ContentType = "text/html";
    await context.Response.WriteAsync("<h1>Access Denied</h1>");
});

app.MapGet("/logout", async context =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
});

app.Run();