import "dotenv/config";
import { createClient } from "redis";
import WebSocket from "ws";
import { getClients } from "./client";
import { safeSend } from "./rateLimit";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

const redisSubscriber = createClient({ url: process.env.REDIS_URL });
//used to store the events if the user/socket is not active 
const redisStorage = createClient({ url: process.env.REDIS_URL }); 

redisSubscriber.on("error", function(err){
    throw err;
});

redisStorage.on("error", function(err){
    console.error("Redis storage error", err);
});

Promise.all([
    redisSubscriber.connect(),
    redisStorage.connect(),
]).then(() => {
    console.log("connected to redis");
}).catch((err) => { console.log("Error while connecting to redis", err); });

const CHANNEL = "user-event";
const PENDING_SECONDS = Number(process.env.PENDING_SECONDS) || 86400;

redisSubscriber.subscribe(CHANNEL, async (message) => {
    try {
        const event = JSON.parse(message);
        console.log("events",event);
        const targetUserId = event.userId;
        console.log("targetUserId",targetUserId);
        console.log(typeof(targetUserId));
        const sockets = getClients(targetUserId);
        //if socket is inactive
        if (!sockets || sockets.size === 0) {
            const pendingKey = `pending:${targetUserId}`;
            await redisStorage.rPush(pendingKey, message);
            await redisStorage.expire(pendingKey, PENDING_SECONDS);
            return;
        }

        for (const socket of sockets) {
            if (socket.readyState === socket.OPEN) {
                safeSend(targetUserId, socket, message);
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

//this function flushes all the events present in the waiting queue.
export async function flushPendingEvents(userId: string, socket: WebSocket): Promise<void> {
    const pendingKey = `pending:${userId}`;
    const pendingEvents = await redisStorage.lRange(pendingKey, 0, -1);

    if (pendingEvents.length === 0) {
        return;
    }

    await redisStorage.del(pendingKey);

    for (const pendingMessage of pendingEvents) {
        safeSend(userId, socket, pendingMessage);
    }
}

