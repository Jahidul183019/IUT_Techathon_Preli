# Smart Home IoT Dashboard

A modern, responsive, and real-time frontend dashboard for monitoring and managing smart home IoT devices. Built for the IUT Techathon project.

## Features
- **Real-time Monitoring:** Connects to a FastAPI WebSocket to show live device states (ON/OFF).
- **Interactive Floorplan:** Visual mapping of office/home layout allowing direct device interaction.
- **Power Usage Analytics:** Tracks power consumption, active devices, and estimates daily kWh load.
- **Alerts System:** Live notifications for high-load or out-of-hours device activity.
- **Responsive Design:** Premium dark mode UI built with Tailwind CSS, Lucide icons, and Framer Motion.

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Animations:** Motion (Framer Motion)
- **Charts:** Recharts

## Environment Variables

To connect to a custom backend, configure the following environment variables in your deployment platform (e.g., Render, Vercel) or in a local `.env` file:

```env
VITE_API_URL=https://iot-smart-home-backend-8au0.onrender.com
VITE_WS_URL=wss://iot-smart-home-backend-8au0.onrender.com/ws
```
*(If unset, it will default to the Render backend shown above, or to `http://localhost:8000` if run via the provided `shell.sh` script).*

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

*Alternatively, use the root `./shell.sh` script to run both the frontend and the FastAPI backend concurrently.*
