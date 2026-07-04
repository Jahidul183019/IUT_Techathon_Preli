"""
Discord bot — entry point.
Connects to Discord and logs "ready" on startup.
Talks to the FastAPI backend over REST using httpx.
Includes a background task to poll alerts and post them to a designated channel.
"""

import os
import asyncio
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
import httpx
import discord
from discord.ext import commands, tasks
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def run_health_server():
    class HealthHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed_path = urlparse(self.path).path
            if parsed_path in ("/", "/health"):
                body = b"Bot is online and healthy"
                self.send_response(200)
                self.send_header("Content-type", "text/plain")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            elif parsed_path == "/check-llm":
                import json
                keys_status = {
                    "GEMINI_API_KEY": bool(os.getenv("GEMINI_API_KEY")),
                    "GROQ_API_KEY_1": bool(os.getenv("GROQ_API_KEY_1")),
                    "GROQ_API_KEY_2": bool(os.getenv("GROQ_API_KEY_2")),
                    "GROQ_API_KEY_3": bool(os.getenv("GROQ_API_KEY_3")),
                }
                body = json.dumps(keys_status).encode('utf-8')
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self.send_response(404)
                self.end_headers()
                
        def do_HEAD(self):
            parsed_path = urlparse(self.path).path
            if parsed_path in ("/", "/health"):
                self.send_response(200)
                self.send_header("Content-type", "text/plain")
                self.send_header("Content-Length", str(len(b"Bot is online and healthy")))
                self.end_headers()
            elif parsed_path == "/check-llm":
                import json
                keys_status = {
                    "GEMINI_API_KEY": bool(os.getenv("GEMINI_API_KEY")),
                    "GROQ_API_KEY_1": bool(os.getenv("GROQ_API_KEY_1")),
                    "GROQ_API_KEY_2": bool(os.getenv("GROQ_API_KEY_2")),
                    "GROQ_API_KEY_3": bool(os.getenv("GROQ_API_KEY_3")),
                }
                body = json.dumps(keys_status).encode('utf-8')
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()

    port = int(os.getenv("PORT", 8080))
    server = ThreadingHTTPServer(("0.0.0.0", port), HealthHandler)
    print(f"🏥 Health check server running on port {port}")
    server.serve_forever()

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000").rstrip("/")
# Use a specific channel ID if provided, otherwise the bot will try to use the first available channel
ALERT_CHANNEL_ID = os.getenv("DISCORD_ALERT_CHANNEL_ID", "")

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# Track seen alert IDs to prevent reposting
seen_alerts = set()

@bot.event
async def on_ready():
    print(f"✅  Bot is ready — logged in as {bot.user} (ID: {bot.user.id})")
    print(f"   Backend URL: {BACKEND_URL}")
    print(f"   Guilds: {len(bot.guilds)}")
    
    # Start the background task
    if not poll_alerts.is_running():
        poll_alerts.start()

@bot.event
async def setup_hook():
    # Load commands cog
    await bot.load_extension("commands")


@tasks.loop(minutes=1.0)
async def poll_alerts():
    """Poll the backend for new alerts every minute and post them to Discord."""
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(f"{BACKEND_URL}/api/devices/stats/alerts")
            if resp.status_code != 200:
                return
            
            data = resp.json()
            alerts = data.get("alerts", [])
            
            # Alerts are returned newest first, but we want to process them in chronological order
            # so we'll reverse the list to see oldest first, avoiding missing out if a bunch trigger
            new_alerts = [a for a in reversed(alerts) if a["id"] not in seen_alerts]
            
            if not new_alerts:
                return
            
            # Find a channel to post to
            channel = None
            if ALERT_CHANNEL_ID:
                try:
                    channel = bot.get_channel(int(ALERT_CHANNEL_ID))
                except ValueError:
                    pass
            
            # Fallback to the first text channel the bot can write to
            if not channel:
                for guild in bot.guilds:
                    if guild.system_channel and guild.system_channel.permissions_for(guild.me).send_messages:
                        channel = guild.system_channel
                        break
                    for text_channel in guild.text_channels:
                        if text_channel.permissions_for(guild.me).send_messages:
                            channel = text_channel
                            break
                    if channel:
                        break
            
            if channel:
                for alert in new_alerts:
                    # Mark as seen
                    seen_alerts.add(alert["id"])
                    
                    # Prevent memory leak over time
                    if len(seen_alerts) > 1000:
                        # simple clear, realistically we'd do something smarter but this is fine for a demo
                        seen_alerts.clear()
                        
                    msg = alert.get("message", "Unknown Alert")
                    severity = alert.get("severity", "warning")
                    
                    if severity == "critical":
                        prefix = "🚨 **CRITICAL ALERT** 🚨"
                    elif severity == "warning":
                        prefix = "⚠️ **Warning**"
                    else:
                        prefix = "ℹ️ **Info**"
                        
                    friendly_message = f"{prefix}\nHey everyone! I just got a notification from the Smart Home system:\n> {msg}"
                    
                    await channel.send(friendly_message)
    except Exception as e:
        print(f"Error polling alerts: {e}")

@poll_alerts.before_loop
async def before_poll_alerts():
    await bot.wait_until_ready()

if __name__ == "__main__":
    if not TOKEN:
        print("❌  DISCORD_BOT_TOKEN not set. Check your .env file.")
        exit(1)
    
    # Start the health check server in a background thread for Render Option A (Web Service)
    threading.Thread(target=run_health_server, daemon=True).start()
    
    # Run the bot
    bot.run(TOKEN)
