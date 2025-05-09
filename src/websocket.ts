import http from 'http';
import {WebSocketServer} from 'ws';
import { addClient , removeClient , UserId } from './client';

const server = http.createServer();
const wss = new WebSocketServer({server});

wss.on('connection', (ws)=>{
    let userId : UserId;

    //accepting one msg(userId) from client
    ws.once('message', (message)=>{
        try {
        const data = JSON.parse(message.toString());
        if(!data.userId){
            ws.close(1000, 'Missing userId');
            return;
        }
        userId = data.userId;
        console.log("the type of the userid in the websocket field is : " , typeof(userId));
        addClient(userId, ws);
        console.log(`User ${userId} connected`);
        
        ws.on('close',()=>{
            if(userId){
            removeClient(userId, ws);
            console.log(`User ${userId} disconnected`);
            }
        });
        } catch (error) {
          console.error('Invalid message format', error);
          ws.close(1000, 'Invalid message format'); 
        }
    })
})

const PORT = 8080;
server.listen(PORT , ()=>{
    console.log(`Server listening on port ${PORT}`);
})