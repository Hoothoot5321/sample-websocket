import { channels, clients } from "./index.js";
import { MSG, Message, TYPE, Client } from "./class.js";
export function onMessage(ws: Client, ev: MessageEvent<any>): void {
  let msg = ev.data;
  console.log(msg);
  console.log("");

  let temp = JSON.parse(msg) as MSG;
  if (temp.type == TYPE.DISCONNECT) {
    channels.discClient(ws);
  } else {
    let tempo = JSON.parse(msg) as Message;
    switch (temp.type) {
      case TYPE.CONNECT:
        channels.discClient(ws);
        channels.connectToChannel(ws, tempo.msg);
        break;
      case TYPE.SEND:
        channels.sendChan(ws, tempo.msg, TYPE.SEND);
        break;
      case TYPE.IMAGE:
        channels.receiveImage(ws, tempo.msg);
        break;
      case TYPE.CREATE:
        channels.discClient(ws);
        channels.addChannel(tempo.msg);
        channels.connectToChannel(ws, tempo.msg);

        let channel_name = channels.getChannelNames();
        for (let client of clients) {
          client.connection.send(
            JSON.stringify(
              new Message(TYPE.CREATE, JSON.stringify(channel_name))
            )
          );
        }
        break;
    }
  }
}
