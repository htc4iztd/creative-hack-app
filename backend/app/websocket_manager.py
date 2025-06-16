# app/websocket_manager.py
from fastapi import WebSocket
from typing import Dict, List
from asyncio import Lock
import json # JSONメッセージを扱うために追加

class ConnectionManager:
    def __init__(self):
        # キーをユーザーID (int) に変更します
        self.active_connections: Dict[int, List[WebSocket]] = {} # {user_id: [WebSocket, ...]}
        self.lock = Lock()

    async def connect(self, websocket: WebSocket, user_id: int): # business_plan_id を user_id に変更
        await websocket.accept()
        async with self.lock: # ロックの取得
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected via WebSocket.") # 接続ログを追加

    async def disconnect(self, websocket: WebSocket, user_id: int): # business_plan_id を user_id に変更し、async def に変更
        async with self.lock: # ロックの取得
            if user_id in self.active_connections:
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
        print(f"User {user_id} disconnected from WebSocket.") # 切断ログを追加

    async def send_personal_message(self, message: str, websocket: WebSocket):
        # このメソッドは特定のWebSocketオブジェクトに対して直接メッセージを送るため、
        # 通常はConnectionManagerの内部でのみ使用されるか、特殊なケースで利用
        try:
            await websocket.send_text(message)
        except RuntimeError as e:
            # クライアントが既に切断されている場合などに発生
            print(f"Error sending personal message to WebSocket: {e}")

    async def send_notification_to_user(self, target_user_id: int, message_payload: Dict):
        """
        特定のユーザーIDに紐づく全てのWebSocket接続に通知メッセージを送信する。
        message_payload は辞書形式で、JSONに変換して送信される。
        オフラインのユーザーには送信されず、ログに表示される。
        """
        connections_to_send: List[WebSocket] = []
        async with self.lock: # ロックの取得
            if target_user_id in self.active_connections:
                # 接続リストのコピーを作成し、ループ中にリストが変更されるのを防ぐ
                connections_to_send = list(self.active_connections[target_user_id])
            else:
                print(f"User {target_user_id} is not currently online via WebSocket.")
                return # 接続がない場合は処理を終了

        json_message = json.dumps(message_payload) # メッセージをJSON文字列に変換
        for connection in connections_to_send:
            try:
                await connection.send_text(json_message)
                print(f"Sent notification to user {target_user_id}'s WebSocket: {message_payload.get('title', 'No Title')}")
            except RuntimeError as e:
                # 送信中にエラーが発生した場合（例：接続が突然切断された）
                print(f"Error sending notification to user {target_user_id}'s WebSocket: {e}")
                # ここで自動的にactive_connectionsからこの接続を削除するロジックを追加することも可能だが、
                # 通常はdisconnectメソッドがWebSocketDisconnect例外で呼び出されるのが一般的
                pass

    # broadcast メソッドは、現在の要件では直接使用しない可能性がありますが、
    # 特定のビジネスプランの変更をそのプランに接続している全員に送るような場合は利用可能です。
    # ただし、active_connectionsがuser_idベースになったため、このメソッドのロジックは調整が必要です。
    # 例: 全てのオンラインユーザーにブロードキャストしたい場合など
    async def broadcast(self, message: str): # グループIDではなく、全ての接続に送る例
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