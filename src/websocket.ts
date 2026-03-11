import http from "http";
import { WebSocketServer } from "ws";
import { addClient, removeClient, UserId } from "./client";

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    const token = url.searchParams.get("token");

    if (process.env.WS_SECRET && token !== process.env.WS_SECRET) {
        ws.close(1008, "Unauthorized");
        return;
    }

    let userId: UserId | undefined;

    const initTimer = setTimeout(() => {
        ws.close(1008, "Initoal timeout");
    }, 30000);

    //accepting one msg (userId) from client
    ws.once("message", (message) => {
        try {
        clearTimeout(initTimer);
        const data = JSON.parse(message.toString());
        if (!data?.userId || typeof data.userId !== "string") {
            ws.close(1008, "Missing userId");
            return;
        }
        const connectedUserId: UserId = data.userId;
        userId = connectedUserId;
        addClient(userId, ws);
        console.log(`User ${userId} connected`);
        
        ws.on("close", () => {
            if (userId) {
            removeClient(userId, ws);
            console.log(`User ${userId} disconnected`);
            }
        });
        } catch (error) {
          clearTimeout(initTimer);
          console.error("Invalid message format", error);
          ws.close(1003, "Invalid message format");
        }
    });
});

const PORT = Number(process.env.PORT) || 8080;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});