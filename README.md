# Realtime WS Notifier

A lightweight WebSocket server using Redis Pub/Sub to deliver real-time events to connected users, based on their `userId`.

## 📦 Tech Stack

- TypeScript
- Node.js
- WebSocket (ws)
- Redis (Pub/Sub)

## 🧠 How It Works

1. **Client Connects**: A browser (or any WebSocket client) connects and sends their `userId` as the first message.
2. **WebSocket Server**: The server stores the client connection mapped by `userId`.
3. **Redis Pub/Sub**: 
    - Redis subscribes to a `user-event` channel.
    - Any service (like an Express app or another backend process) can publish to that channel with a payload like:
      ```json
      {
        "userId": "123",
        "event": "NEW_MESSAGE",
        "data": {
          "message": "Hello from Redis!"
        }
      }
      ```
    - The WebSocket server listens for Redis messages and sends them to the correct user if they are connected.

## ⚠️ Important Note: Redis & WebSocket Must Share Memory

For **basic local testing**, the WebSocket server (`websocket.ts`) and Redis subscriber (`redis.ts`) must run in the **same Node.js process**, because the WebSocket connections are stored in memory (RAM). If you run them in different terminals, Redis will not be able to access the sockets.


## 🚀 How to Run 

### 1. Start Redis Server

Make sure Redis server is running on your system.

### 2. Start the WebSocket Server

```bash
ts-node src/websocket.ts