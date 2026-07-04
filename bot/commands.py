"""
Bot commands cog for IoT Smart Office.
Implements !status, !room, and !usage with conversational responses.
"""

import os
import json
import httpx
from discord.ext import commands
from groq import AsyncGroq
import google.generativeai as genai

BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000").rstrip("/")
GROQ_API_KEY_1 = os.getenv("GROQ_API_KEY_1", "")
GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2", "")
GROQ_API_KEY_3 = os.getenv("GROQ_API_KEY_3", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Initialize Groq clients if keys are provided
groq_clients = []
for key in [GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3]:
    if key:
        groq_clients.append(AsyncGroq(api_key=key))

# Configure Gemini if key is provided
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def generate_response(data: dict, command: str, fallback: str) -> str:
    """
    Calls the Groq API (with 3 key fallback) or Gemini API to rewrite raw data into a friendly response.
    Falls back to the provided formatted string if all APIs fail or are not configured.
    """
    system_prompt = (
        "You are a friendly office assistant helping a busy boss monitor office devices. "
        "Keep responses under 3 sentences, conversational, and helpful. "
        "Never mention raw JSON or technical terms."
    )
    
    user_prompt = f"Here is the current office status data: {json.dumps(data)}. Summarize this for the boss in response to the command: {command}"
    
    # Try Gemini API first
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=system_prompt
            )
            response = await model.generate_content_async(user_prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")

    # Try Groq clients if Gemini fails or is not configured
    for client in groq_clients:
        try:
            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama3-8b-8192",
                temperature=0.7,
                max_tokens=150,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Groq API error with a client: {e}")
            continue

    # If everything fails, use fallback
    return fallback

class DeviceCommands(commands.Cog):
    """Commands for interacting with the Smart Office system."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        
    def _format_room_summary(self, room_data: dict) -> str:
        """Helper to format a conversational summary for a single room."""
        room_name = room_data.get("room_name", "Unknown Room")
        devices = room_data.get("devices", [])
        
        fans_on = sum(1 for d in devices if d["type"] == "fan" and d["status"])
        lights_on = sum(1 for d in devices if d["type"] == "light" and d["status"])
        
        if fans_on == 0 and lights_on == 0:
            return f"{room_name}: all off."
            
        parts = []
        if fans_on > 0:
            parts.append(f"{fans_on} fan{'s' if fans_on > 1 else ''} ON")
        if lights_on > 0:
            parts.append(f"{lights_on} light{'s' if lights_on > 1 else ''} ON")
            
        return f"{room_name}: {' and '.join(parts)}."

    @commands.command()
    async def status(self, ctx: commands.Context):
        """Summarizes the status of all rooms in the smart office."""
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                resp = await client.get(f"{BACKEND_URL}/api/devices")
                if resp.status_code != 200:
                    await ctx.send("Oops! I couldn't reach the smart office backend right now. 😥")
                    return
                
                devices = resp.json().get("devices", [])
                
                # Group by room
                rooms = {}
                for d in devices:
                    r_slug = d["room"]
                    if r_slug not in rooms:
                        rooms[r_slug] = {"room_name": d["room"].replace("_", " ").title(), "devices": []}
                        if r_slug == "drawing_room": rooms[r_slug]["room_name"] = "Drawing Room"
                        elif r_slug == "work_room_1": rooms[r_slug]["room_name"] = "Work Room 1"
                        elif r_slug == "work_room_2": rooms[r_slug]["room_name"] = "Work Room 2"
                    rooms[r_slug]["devices"].append(d)
                
                summaries = [self._format_room_summary(data) for data in rooms.values()]
                
                fallback_message = "Here is the current status of the house:\n\n"
                fallback_message += "\n".join(f"• {s}" for s in summaries)
                
                # Generate LLM response
                final_message = await generate_response(rooms, "!status", fallback_message)
                
                await ctx.send(final_message)
                
            except httpx.RequestError:
                await ctx.send("I'm having trouble connecting to the backend! Please check if it's running. 🔌")


    @commands.command(aliases=["r"])
    async def room(self, ctx: commands.Context, *, name: str = ""):
        """Get the status of a specific room (e.g. !room work1)."""
        if not name:
            await ctx.send("Please tell me which room you want to check! Try `!room drawing` or `!room work1`.")
            return
            
        # Map common aliases to the actual slug
        name_lower = name.lower().replace(" ", "").replace("_", "")
        
        slug = None
        if name_lower in ["drawing", "drawingroom", "dr"]:
            slug = "drawing_room"
        elif name_lower in ["work1", "workroom1", "1", "wr1"]:
            slug = "work_room_1"
        elif name_lower in ["work2", "workroom2", "2", "wr2"]:
            slug = "work_room_2"
            
        if not slug:
            await ctx.send(f"I couldn't figure out which room '{name}' is! My mapped rooms are: Drawing Room, Work Room 1, and Work Room 2.")
            return

        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                resp = await client.get(f"{BACKEND_URL}/api/devices/{slug}")
                if resp.status_code == 404:
                    await ctx.send("Hmm, the backend didn't recognize that room.")
                    return
                elif resp.status_code != 200:
                    await ctx.send("Oops, something went wrong fetching the room data.")
                    return
                    
                room_data = resp.json()
                summary = self._format_room_summary(room_data)
                
                fallback_message = f"Sure thing! Checking the {room_data.get('room_name', 'room')}... 🔍\n> **{summary}**"
                
                # Generate LLM response
                final_message = await generate_response(room_data, f"!room {name}", fallback_message)
                
                await ctx.send(final_message)
                
            except httpx.RequestError:
                await ctx.send("I'm having trouble connecting to the backend! Please check if it's running. 🔌")


    @commands.command(aliases=["power"])
    async def usage(self, ctx: commands.Context):
        """Check the current power consumption and daily estimate."""
        async with httpx.AsyncClient(follow_redirects=True) as client:
            try:
                resp = await client.get(f"{BACKEND_URL}/api/devices/stats/usage")
                if resp.status_code != 200:
                    await ctx.send("Oops! I couldn't get the usage stats right now.")
                    return
                    
                data = resp.json()
                watts = data.get("total_watts", 0)
                kwh = data.get("estimated_kwh_today", 0)
                
                fallback_message = (
                    f"⚡ **Total power right now:** {watts}W.\n"
                    f"📊 **Today's estimated usage:** {kwh} kWh."
                )
                
                if watts > 300:
                    fallback_message += "\nWow, we're drawing quite a bit of power! Might want to turn some things off. 💸"
                elif watts == 0:
                    fallback_message += "\nEverything is off. Good job saving energy! 🌍"
                
                # Generate LLM response
                final_message = await generate_response(data, "!usage", fallback_message)
                
                await ctx.send(final_message)
                
            except httpx.RequestError:
                await ctx.send("I'm having trouble connecting to the backend! Please check if it's running. 🔌")


async def setup(bot: commands.Bot):
    """Register command cog with the bot."""
    await bot.add_cog(DeviceCommands(bot))
