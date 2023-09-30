FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["myForum/myForum.csproj", "myForum/"]
RUN dotnet restore "myForum/myForum.csproj"
COPY . .
WORKDIR "/src/myForum"
RUN dotnet build "myForum.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "myForum.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "myForum.dll"]
