import WebSocket from "ws";

const MAX_RATE = Number(process.env.MAX_RATE) || 20;
const MAX_QUEUE = Number(process.env.MAX_QUEUE) || 100;

type QueuedMessage = {
    socket: WebSocket;
    message: string;
};

const sendCounts = new Map<string, number>();
//in--memory waiting area , if a userid crosses the send limit the extra messages will be stored here
const pendingMessages = new Map<string, QueuedMessage[]>();

setInterval(() => {
    sendCounts.clear();

    for (const [userId, queue] of pendingMessages.entries()) {
        let sent = 0;

        while (queue.length > 0 && sent < MAX_RATE) {
            const queued = queue.shift();
            if (!queued) {
                break;
            }

            if (queued.socket.readyState === WebSocket.OPEN) {
                queued.socket.send(queued.message);
                sent += 1;
            }
        }

        if (queue.length === 0) {
            pendingMessages.delete(userId);
        }

        if (sent > 0) {
            sendCounts.set(userId, sent);
        }
    }
}, 3000);

export function safeSend(userId: string, socket: WebSocket, message: string): void {
    const sentCount = sendCounts.get(userId) ?? 0;

    if (sentCount < MAX_RATE && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
        sendCounts.set(userId, sentCount + 1);
        return;
    }

    let queue = pendingMessages.get(userId);
    if (!queue) {
        queue = [];
        pendingMessages.set(userId, queue);
    }

    if (queue.length >= MAX_QUEUE) {
        queue.shift();
    }

    queue.push({ socket, message });
}