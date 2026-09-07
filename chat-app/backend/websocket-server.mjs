import { server as WebSocketServer } from "websocket"; 
import express from "express"; 
import http from "node:http";
import cors from "cors";
import { validateBody, validateMessage } from "./shared.mjs";
const app = express();
app.use(cors());

const port = 4000;
const messages = [];
const connections = []; 
let nextMessageId = 1;


const server = http.createServer(app); 
//Attach the WebSocket server
const webSocketServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});


function handleReceivedMessage(receivedObject,connection){
  if(receivedObject.type==="newMessage")
  {
    
    let body = receivedObject.data

    const validateBodyError = validateBody(body);
    if (validateBodyError !== null) {
      connection.sendUTF(
        JSON.stringify({ type: "error", data: validateBodyError }),
      );
      return;
    }
    const trimmedMessage = body.message.trim();
    const trimmedUserName = body.username.trim();
    const validateMessageError = validateMessage(
      trimmedMessage,
      trimmedUserName,
    );
     if (validateMessageError !== null) {
       connection.sendUTF(
         JSON.stringify({ type: "error", data: validateMessageError }),
       );
       return;
     }
     const newMessage = {
        id:nextMessageId++,
        username:trimmedUserName,
        message:trimmedMessage,
        createdAt: new Date().toISOString(),
        likesCount:0,
        dislikesCount:0,
     };
     messages.push(newMessage)
     connection.sendUTF(JSON.stringify({
        type:"message-sent",
        data:"Message sent Successfully."
     }))
     const response = JSON.stringify({type:"message-added",data:newMessage});
     connections.forEach((client)=>{
        if(client.connected)
        {
            client.sendUTF(response)
        }
     })
  }
  if(receivedObject.type==="reaction")
  {
    //find the correct message from messages
    //update the reaction counter 
    //send the update to the connections
    const message = messages.find((message)=>{
    return message.id === receivedObject.data.messageId;
    })
    if(!message)
    {
       connection.sendUTF(
        JSON.stringify({ type: "error", data: "Message not found" }),
      );
      return;
    }
    const action = receivedObject.data.action;
    if(action==="like")
    {
      message.likesCount++;
    }
    if(action ==="dislike")
    {
      message.dislikesCount++;
    }
    const updatedMessage = {
      type:"updatedMessage",
      data:{messageId:message.id,
            likesCount:message.likesCount,
            dislikesCount:message.dislikesCount,
      }
    }
    connections.forEach((client)=>{
      if(client.connected){
      client.sendUTF(JSON.stringify(updatedMessage));
      }
    })
  }
}
function originIsAllowed(origin) {
  //check the requesting website
  // return origin === "my front end domain"
  return true; //for now it permits every website
}

webSocketServer.on("request", (request) => {
 
  if (!originIsAllowed(request.origin)) {
    //request.origin is the address of the frontend requesting the connection
    //to make sure that  we only accept requests from an allowed origin
    request.reject();
    console.log(`connection from origin ${request.origin} rejected.`);
    return;
  }
  const connection = request.accept("chat-protocol", request.origin); 
  connections.push(connection);
  console.log(
    `WebSocket connection accepted. Active connections: ${connections.length}`,
  ); 
connection.sendUTF(JSON.stringify({
    type:"message-history",
    data: messages,
}))
  connection.on("message", (message) => {
    if (message.type !== "utf8") {
      connection.sendUTF(
        JSON.stringify({
          type: "error",
          data: "Expect a text message ",
        }),
      );
      return;
    }
    let receivedObject;
    try {
      receivedObject = JSON.parse(message.utf8Data);
    } catch (error) {
      connection.sendUTF(
        JSON.stringify({
          type: "error",
          data: "Expected message to be valid JSON ",
        }),
      );
      return;
    }
    handleReceivedMessage(receivedObject,connection);

  });
  connection.on("close", () => {
    const connectionIndex =connections.indexOf(connection);
    if(connectionIndex!==-1){
        connections.splice(connectionIndex,1);
    }
    console.log(`Websocket disconnected. Active connections:${connections.length}`)
});
});

server.listen(port, () => {
  console.error(`WebSocket chat server is listening on port :${port}`);
});
