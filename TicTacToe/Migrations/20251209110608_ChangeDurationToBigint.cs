using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicTacToe.Migrations
{
    /// <inheritdoc />
    public partial class ChangeDurationToBigint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn("Duration", "GameTurns");
            
            migrationBuilder.AddColumn<long>("Duration", "GameTurns", "bigint", nullable: false, defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn("Duration", "GameTurns");

            migrationBuilder.AddColumn<long>("Duration", "GameTurns", "datetimeoffset", nullable: false);
        }
    }
}
