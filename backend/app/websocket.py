from fastapi import WebSocket
from typing import Dict, List
from asyncio import Lock

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.lock = Lock()

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        async with self.lock:
            if client_id not in self.active_connections:
                self.active_connections[client_id] = []
            self.active_connections[client_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, client_id: str):
        async with self.lock:
            if client_id in self.active_connections:
                if websocket in self.active_connections[client_id]:
                    self.active_connections[client_id].remove(websocket)
                if not self.active_connections[client_id]:
                    del self.active_connections[client_id]

    async def broadcast(self, client_id: str, message: str):
        async with self.lock:
            if client_id in self.active_connections:
                for connection in self.active_connections[client_id]:
                    await connection.send_text(message)

# Create a global instance of the connection manager
manager = ConnectionManager()
