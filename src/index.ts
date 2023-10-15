import { WebSocketServer } from "ws";
import { onMessage } from "./onEvent.js";
import { ChannelList, Message, TYPE, Client, StartupMessage } from "./class.js";
import { createServer } from "http";

const server = createServer();

const wss = new WebSocketServer({ server });

export const channels = new ChannelList();

export const clients: Client[] = [];

let id = 0;

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

wss.on("connection", (ws: WebSocket) => {
  let client = new Client(id, ws);
  console.log("Connection established");
  clients.push(client);

  ws.onclose = (ev: CloseEvent) => {
    channels.discClient(client);

    for (let i = 0; i < clients.length; i++) {
      if (clients[i].id === id) {
        clients.splice(i, 1);
      }
    }
  };
  id += 1;

  ws.onmessage = (ev: MessageEvent<any>): void => {
    onMessage(client, ev);
  };

  let channel_name = channels.getChannelNames();
  let msg = new StartupMessage(TYPE.STARTUP, channel_name, client.id);
  ws.send(JSON.stringify(msg));
});
