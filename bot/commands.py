"""
Bot commands — will be registered as cogs or plain commands.
Stub file for future command implementations.
"""

import aiohttp
from discord.ext import commands


BACKEND_URL = "http://localhost:8000"


async def fetch_health():
    """Check backend health."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BACKEND_URL}/health") as resp:
            return await resp.json()


# ── Example command group (to be wired up later) ──

class DeviceCommands(commands.Cog):
    """Commands for interacting with IoT devices via the backend."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    async def health(self, ctx: commands.Context):
        """Check if the backend is alive."""
        data = await fetch_health()
        await ctx.send(f"Backend status: **{data.get('status', 'unknown')}**")


def setup(bot: commands.Bot):
    """Register command cogs with the bot."""
    bot.add_cog(DeviceCommands(bot))
