using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using myForum.Dal.Structures;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using myForum.Dal.Models;
using myForum.Dal.View;

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
builder.Services.AddDbContext<MyForumDbContext>(options =>
{
    var connectionString = "Server=localhost;Database=myForumDb;User=root;Password=xyvstc44pnb2;";
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
}, ServiceLifetime.Singleton);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapPost("/signUp", async (MyForumDbContext dbContext, HttpContext context) =>
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
    return Results.Redirect("/");
});

app.MapPost("/login", async (MyForumDbContext dbContext, string? returnUrl, HttpContext context) =>
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

app.MapGet("/GetArticles", (MyForumDbContext dbContext) =>
{
    var articles = dbContext.Articles.Include(article => article.User).ToList();
    var articlePreviews = articles.Select(article => new
    {
        id = article.Id,
        title = article.Title,
        description = article.Description,
        user = new
        {
            name = article.User?.Name
        }
    });

    return Results.Json(articlePreviews);
});

app.MapGet("/articles/{articleId:int}",  async (int articleId, MyForumDbContext dbContext, HttpContext context,
    IWebHostEnvironment env) =>
{
    var article = dbContext.Articles.Include(article => article.User)
        .FirstOrDefault(a => a.Id == articleId);
    if (article == null) return Results.NotFound();
    var user = dbContext.Users.FirstOrDefault(u => context.User.Identity != null 
                                                   && u.Name == context.User.Identity.Name);
    bool canEdit = !(user == null || article?.User.Name != user.Name);
    var filePath = Path.Combine(env.WebRootPath, "html", "article.html");
    var articleHtml = await File.ReadAllTextAsync(filePath);
    var articleDataScript = $@"
        <script id='articleData'>
            var articleData = {{
                ArticleId: {article.Id},
                CanEdit: {canEdit.ToString().ToLower()}
            }};
        </script>
    ";
    articleHtml = articleHtml.Replace("{{title}}", article.Title)
        .Replace("{{main-text}}", article.Text.Replace("@@@", "<br>"))
        .Replace("</head>", $"{articleDataScript}</head>");

    return Results.Content(articleHtml, "text/html");
});

app.MapDelete("/article-delete/{articleId:int}", (int articleId, MyForumDbContext dbContext) =>
{
    var article = dbContext.Articles.FirstOrDefault(a => a.Id == articleId);
    if (article != null)
    {
        dbContext.Articles.Remove(article);
        dbContext.SaveChanges();
    }
});

app.MapPut("/article-save/{articleId:int}",  async (int articleId, MyForumDbContext dbContext, HttpContext context) =>
{
    using (StreamReader reader = new StreamReader(context.Request.Body, Encoding.UTF8))
    {
        var requestBody = await reader.ReadToEndAsync();
        var requestData = JsonSerializer.Deserialize<Article>(requestBody);
        var article = dbContext.Articles.FirstOrDefault(a => a.Id == articleId);
        if (article != null)
        {
            article.Title = requestData.Title;
            article.Text = requestData.Text;
            article.Description = GetDescription(requestData.Text);
            dbContext.SaveChanges();
        }
        return Results.Ok();
    }
});

app.MapPost("/create-article", async (MyForumDbContext dbContext, HttpContext context) =>
{
    string requestBody;
    using (var reader = new StreamReader(context.Request.Body))
    {
        requestBody = await reader.ReadToEndAsync();
    }

    var data = JsonSerializer.Deserialize<ArticleView>(requestBody);
    User? user = dbContext.Users.FirstOrDefault(u =>
        context.User.Identity != null && u.Name == context.User.Identity.Name);
    if (user == null || data == null) return Results.BadRequest();
    
    var newArticle = new Article
    {
        Title = data.Title,
        Text = data.MainText,
        Description = GetDescription(data.MainText),
        User = user
    };

    dbContext.Articles.Add(newArticle);
    await dbContext.SaveChangesAsync();

    return Results.Ok();
});

app.MapGet("/new-article", [Authorize] async (HttpContext context, IWebHostEnvironment env) =>
{
    await context.Response.SendFileAsync(Path.Combine(env.WebRootPath, "html", "createArticle.html"));
});

app.MapGet("/isAuthorized", async context =>
{
    if (context.User.Identity != null && context.User.Identity.IsAuthenticated)
    {
        await context.Response.WriteAsJsonAsync(new { Authorized = true });
    }
    else
    {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsJsonAsync("Unauthorized");
    }
});

app.Run();

string GetDescription(string text)
{
    int index = 0, words = 25;
    for (int i = 0; i < text.Length; i++)
    {
        if (char.IsWhiteSpace(text[i]))
        {
            if (--words == 0)
            {
                index = i;
                break;
            }
        }

        index = i;
    }

    return text[..index];
}