import { useState, useEffect, useRef } from 'react'
import './App.css'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

function App() {
  const [status, setStatus] = useState('Disconnected')
  const [messages, setMessages] = useState([])
  const ws = useRef(null)

  useEffect(() => {
    // Attempt WebSocket connection on mount
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => setStatus('Connected')
      ws.current.onclose = () => setStatus('Disconnected')
      ws.current.onerror = () => setStatus('Error')
      ws.current.onmessage = (event) => {
        setMessages((prev) => [...prev.slice(-49), event.data])
      }
    } catch {
      setStatus('Failed to connect')
    }

    return () => ws.current?.close()
  }, [])

  return (
    <div className="app">
      <h1>🏠 IoT Dashboard</h1>
      <p className="greeting">Hello from the Dashboard!</p>
      <div className="status-badge" data-status={status.toLowerCase()}>
        WebSocket: <strong>{status}</strong>
      </div>

      {messages.length > 0 && (
        <div className="messages">
          <h3>Messages</h3>
          <ul>
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
