import WebSocket from "ws";

export type UserId = string;

// "all" — all devices for a user receive events (default)
// "latest" — new connection added , and closes all previous ones for that user
const DEVICE_POLICY = process.env.DEVICE_POLICY || "all";

const clients : Map<UserId , Set<WebSocket>> = new Map();

export function addClient(userId : UserId , ws : WebSocket):void{
   let userSocket = clients.get(userId);
   
    //logic for the user already present
   if (DEVICE_POLICY === "latest" && userSocket) {
       for (const existingWs of userSocket) {
           existingWs.close(1000, "Replaced by new connection");
       }
       userSocket = new Set<WebSocket>();
       clients.set(userId, userSocket);
   }

   if(!userSocket){
    userSocket = new Set<WebSocket>();
    clients.set(userId, userSocket);
   }
   userSocket.add(ws);
}

export function removeClient(userId : UserId , ws : WebSocket):void{
    const userSocket = clients.get(userId);
    if(!userSocket)return ;
    userSocket.delete(ws);
    if(userSocket.size === 0){
        clients.delete(userId);
    }
}
export function getClients(userId : UserId):Set<WebSocket> | undefined{
  const client =  clients.get(userId);
  return client;
}