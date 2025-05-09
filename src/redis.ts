import { createClient } from "redis";
import { getClients } from "./client";

const redisSubscriber = createClient();

redisSubscriber.connect().then(() => {
    console.log("connected to redis")
}).catch((err) => { console.log("Error while connecting to redis", err) })

const CHANNEL = "user-event";

redisSubscriber.subscribe(CHANNEL, (message) => {
       console.log("message",message);
    try {
        const event = JSON.parse(message);
        console.log("events",event);
        const targetUserId = event.userId;
        console.log("targetUserId",targetUserId);
        console.log(typeof(targetUserId));
        const sockets = getClients(targetUserId);
        console.log("sockets",sockets);
        if (!sockets) return null;
        for (const socket of sockets) {
            if (socket.readyState == socket.OPEN) {
                console.log("message inside the subscriber", message);
                socket.send(JSON.stringify(message));
            }
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

