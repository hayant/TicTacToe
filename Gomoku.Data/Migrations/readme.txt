1. Install EF migration tools:
    dotnet tool install --global dotnet-ef
    
2. Generate migration files in solution folder:
    dotnet ef migrations add AddGameAndGameTurnTables \
      --project Gomoku.Data \
      --startup-project Gomoku \
      --context Gomoku.Data.GomokuDbContext
      
3. Database will be migrated during the startup process.
