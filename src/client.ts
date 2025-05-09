import WebSocket from "ws";

export type UserId = string;

const clients : Map<UserId , Set<WebSocket>> = new Map();

export function addClient(userId : UserId , ws : WebSocket):void{
   let userSocket = clients.get(userId);
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