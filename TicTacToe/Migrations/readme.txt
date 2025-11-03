1. Install EF migration tools:
    dotnet tool install --global dotnet-ef
    
2. Generate migration files in solution folder:
    dotnet ef migrations add AddGameAndGameTurnTables \
      --project TicTacToe \
      --startup-project TicTacToe \
      --context TicTacToe.Data.TicTacToeDbContext
      
3. Database will be migrated during the startup process.
