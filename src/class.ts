export class ChannelList {
  channels: Channel[];

  constructor() {
    this.channels = [];
  }
  private getChannel(search: string): Channel | null;
  private getChannel(search: Client): Channel | null;
  private getChannel(search: string | Client) {
    let temp_channel: Channel | null = null;

    if (typeof search == "string") {
      for (let channel of this.channels) {
        if (channel.name == search) {
          temp_channel = channel;
        }
      }
    } else {
      for (let channel of this.channels) {
        if (channel.checkClient(search)) {
          temp_channel = channel;
        }
      }
    }

    return temp_channel;
  }

  addChannel(name: string) {
    let channel = this.getChannel(name);
    if (channel) {
      return;
    }
    this.channels.push(new Channel(name));
  }
  receiveImage(ws: Client, image: string) {
    let channel = this.getChannel(ws);
    channel?.receiveImage(ws, image);
  }
  discClient(ws: Client) {
    let channel = this.getChannel(ws);
    if (!channel) {
      return;
    }
    channel.removeClient(ws);
  }
  sendChan(ws: Client, msg: string, type: TYPE) {
    let channel = this.getChannel(ws);

    if (!channel) {
      return;
    }

    channel.msgAll(msg, type);
  }
  getChannelNames() {
    let names: string[] = [];
    for (let channel of this.channels) {
      names.push(channel.name);
    }
    return names;
  }

  connectToChannel(ws: Client, name: string) {
    let channel = this.getChannel(name);
    if (!channel) {
      return;
    }
    channel.addClient(ws);

    ws.connection.send(JSON.stringify(new Message(TYPE.CONNECT, name)));
  }
}

export class Channel {
  name: string;
  clients: Client[];
  imageHandler: ImageHander;

  constructor(name: string) {
    this.name = name;
    this.clients = [];
    this.imageHandler = new ImageHander();
  }
  checkClient(ws: Client) {
    let exists = false;

    for (let client of this.clients) {
      if (client.id == ws.id) {
        exists = true;
      }
    }
    return exists;
  }
  addClient(ws: Client) {
    this.clients.push(ws);
    this.imageHandler.addClientState(ws);
  }
  removeClient(ws: Client) {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].id === ws.id) {
        this.clients.splice(i, 1);
      }
    }
    this.imageHandler.removeState(ws.id);

    if (this.imageHandler.checkReady()) {
      let random_image = Math.floor(
        Math.random() * this.imageHandler.clients.length
      );
      this.msgAll(this.imageHandler.clients[random_image].image, TYPE.IMAGE);
      this.imageHandler.clear();
    }
  }
  receiveImage(ws: Client, image: string) {
    this.imageHandler.receiveImage(ws.id, image);

    if (this.imageHandler.checkReady()) {
      let random_image = Math.floor(
        Math.random() * this.imageHandler.clients.length
      );
      this.msgAll(this.imageHandler.clients[random_image].image, TYPE.IMAGE);
      this.imageHandler.clear();
    }
  }
  msgAll(msg: string, type: TYPE) {
    let message = new Message(type, msg);
    for (let client of this.clients) {
      client.connection.send(JSON.stringify(message));
    }
  }
}

class ImageHander {
  clients: ClientState[];
  images: string[];
  constructor() {
    this.clients = [];
    this.images = [];
  }
  addClientState(client: Client) {
    this.clients.push(new ClientState(client.id));
  }

  receiveImage(id: number, image: string) {
    for (let client of this.clients) {
      if (client.id == id) {
        client.image = image;
        client.ready = true;
      }
    }
  }
  removeState(id: number) {
    for (let i = 0; i < this.clients.length; i++) {
      if (this.clients[i].id == id) {
        this.clients.splice(i, 1);
      }
    }
  }

  checkReady() {
    let all_ready = this.clients.length > 0;
    for (let client of this.clients) {
      if (!client.ready) {
        all_ready = false;
      }
    }
    return all_ready;
  }
  clear() {
    for (let client of this.clients) {
      client.image = "";
      client.ready = false;
    }
  }
}

class ClientState {
  id: number;
  ready: boolean;
  image: string;
  constructor(id: number) {
    this.id = id;
    this.ready = false;
    this.image = "";
  }
}
export class Message {
  type: TYPE;
  msg: string;

  constructor(type: TYPE, msg: string) {
    this.type = type;
    this.msg = msg;
  }
}

export class StartupMessage {
  type: TYPE;
  channels: string[];
  id: number;
  constructor(type: TYPE, channels: string[], id: number) {
    this.type = type;
    this.channels = channels;
    this.id = id;
  }
}

export class Client {
  id: number;
  connection: WebSocket;
  constructor(id: number, connection: WebSocket) {
    this.id = id;
    this.connection = connection;
  }
}

export enum TYPE {
  CONNECT = "CONNECT",
  DISCONNECT = "DISCONNECT",
  SEND = "SEND",
  CREATE = "CREATE",
  STARTUP = "STARTUP",
  QUEARY = "QUEARY",
  IMAGE = "IMAGE",
}

export interface MSG {
  type: TYPE;
}
