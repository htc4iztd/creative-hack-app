# app/websocket_manager.py
from fastapi import WebSocket
from typing import Dict, List
from asyncio import Lock
import json

class ConnectionManager:
    def __init__(self):
        # キーをユーザーID (int) に変更
        self.active_connections: Dict[int, List[WebSocket]] = {} # {user_id: [WebSocket, ...]}
        self.lock = Lock()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        async with self.lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected via WebSocket.")

    async def disconnect(self, websocket: WebSocket, user_id: int): # ★business_plan_id を user_id に変更し、async def に変更★
        async with self.lock:
            if user_id in self.active_connections:
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
        print(f"User {user_id} disconnected from WebSocket.")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except RuntimeError as e:
            print(f"Error sending personal message to WebSocket: {e}")

    async def send_notification_to_user(self, target_user_id: int, message_payload: Dict):
        connections_to_send: List[WebSocket] = []
        async with self.lock:
            if target_user_id in self.active_connections:
                connections_to_send = list(self.active_connections[target_user_id]) # コピーを作成
            else:
                print(f"User {target_user_id} is not currently online via WebSocket.")
                return

        json_message = json.dumps(message_payload)
        for connection in connections_to_send:
            try:
                await connection.send_text(json_message)
                print(f"Sent notification to user {target_user_id}'s WebSocket: {message_payload.get('title', 'No Title')}")
            except RuntimeError as e:
                print(f"Error sending notification to user {target_user_id}'s WebSocket: {e}")
                pass

    async def broadcast(self, message: str):
        connections_to_send: List[WebSocket] = []
        async with self.lock:
            for user_id_key in self.active_connections:
                connections_to_send.extend(self.active_connections[user_id_key])

        for connection in connections_to_send:
            try:
                await connection.send_text(message)
            except RuntimeError as e:
                print(f"Error sending broadcast message: {e}")
                pass

manager = ConnectionManager()