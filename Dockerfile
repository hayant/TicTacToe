# syntax=docker/dockerfile:1

# ---- Stage 1: build the React / TypeScript frontend ----
FROM node:20-alpine AS frontend
WORKDIR /src/Gomoku/scripts
# Build identity baked into the bundle (CI passes the run number + commit sha).
ARG BUILD_NUMBER=dev
ARG GIT_SHA=local
ENV BUILD_NUMBER=$BUILD_NUMBER
ENV GIT_SHA=$GIT_SHA
# Install dependencies first for better layer caching
COPY Gomoku/scripts/package.json Gomoku/scripts/package-lock.json ./
RUN npm ci
COPY Gomoku/scripts/ ./
# Webpack emits the bundle into /src/Gomoku/wwwroot (see output path in webpack.config.js)
RUN npm run build

# ---- Stage 2: restore, build and publish the .NET app ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copy csproj files first and restore (cached unless project files change)
COPY Gomoku/Gomoku.csproj Gomoku/
COPY Gomoku.Data/Gomoku.Data.csproj Gomoku.Data/
RUN dotnet restore Gomoku/Gomoku.csproj
# Copy the rest of the backend source
COPY Gomoku/ Gomoku/
COPY Gomoku.Data/ Gomoku.Data/
# Bring in the compiled frontend assets from stage 1
COPY --from=frontend /src/Gomoku/wwwroot Gomoku/wwwroot
RUN dotnet publish Gomoku/Gomoku.csproj -c Release -o /app/publish --no-restore

# ---- Stage 3: lightweight ASP.NET runtime image ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./
# The aspnet image listens on port 8080 by default (ASPNETCORE_HTTP_PORTS=8080)
EXPOSE 8080
ENTRYPOINT ["dotnet", "Gomoku.dll"]
