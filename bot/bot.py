"""
Discord bot — entry point.
Connects to Discord and logs "ready" on startup.
Talks to the FastAPI backend over REST / WebSocket.
"""

import os
import discord
from discord.ext import commands
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    print(f"✅  Bot is ready — logged in as {bot.user} (ID: {bot.user.id})")
    print(f"   Backend URL: {BACKEND_URL}")
    print(f"   Guilds: {len(bot.guilds)}")


# ── Load command cogs / extensions ──
# from commands import setup as setup_commands
# setup_commands(bot)


@bot.command()
async def ping(ctx: commands.Context):
    """Simple health check."""
    await ctx.send("🏓 Pong!")


if __name__ == "__main__":
    if not TOKEN:
        print("❌  DISCORD_BOT_TOKEN not set. Check your .env file.")
        exit(1)
    bot.run(TOKEN)
