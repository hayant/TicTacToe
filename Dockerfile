# syntax=docker/dockerfile:1

# ---- Stage 1: build the React / TypeScript frontend ----
FROM node:20-alpine AS frontend
WORKDIR /src/TicTacToe/scripts
# Install dependencies first for better layer caching
COPY TicTacToe/scripts/package.json TicTacToe/scripts/package-lock.json ./
RUN npm ci
COPY TicTacToe/scripts/ ./
# Webpack emits the bundle into /src/TicTacToe/wwwroot (see output path in webpack.config.js)
RUN npm run build

# ---- Stage 2: restore, build and publish the .NET app ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copy csproj files first and restore (cached unless project files change)
COPY TicTacToe/TicTacToe.csproj TicTacToe/
COPY TicTacToe.Data/TicTacToe.Data.csproj TicTacToe.Data/
RUN dotnet restore TicTacToe/TicTacToe.csproj
# Copy the rest of the backend source
COPY TicTacToe/ TicTacToe/
COPY TicTacToe.Data/ TicTacToe.Data/
# Bring in the compiled frontend assets from stage 1
COPY --from=frontend /src/TicTacToe/wwwroot TicTacToe/wwwroot
RUN dotnet publish TicTacToe/TicTacToe.csproj -c Release -o /app/publish --no-restore

# ---- Stage 3: lightweight ASP.NET runtime image ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./
# The aspnet image listens on port 8080 by default (ASPNETCORE_HTTP_PORTS=8080)
EXPOSE 8080
ENTRYPOINT ["dotnet", "TicTacToe.dll"]
