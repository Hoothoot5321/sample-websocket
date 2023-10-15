export class ChannelList {
    constructor() {
        this.channels = [];
    }
    getChannel(search) {
        let temp_channel = null;
        if (typeof search == "string") {
            for (let channel of this.channels) {
                if (channel.name == search) {
                    temp_channel = channel;
                }
            }
        }
        else {
            for (let channel of this.channels) {
                if (channel.checkClient(search)) {
                    temp_channel = channel;
                }
            }
        }
        return temp_channel;
    }
    addChannel(name) {
        let channel = this.getChannel(name);
        if (channel) {
            return;
        }
        this.channels.push(new Channel(name));
    }
    receiveImage(ws, image) {
        let channel = this.getChannel(ws);
        channel === null || channel === void 0 ? void 0 : channel.receiveImage(ws, image);
    }
    discClient(ws) {
        let channel = this.getChannel(ws);
        if (!channel) {
            return;
        }
        channel.removeClient(ws);
    }
    sendChan(ws, msg, type) {
        let channel = this.getChannel(ws);
        if (!channel) {
            return;
        }
        channel.msgAll(msg, type);
    }
    getChannelNames() {
        let names = [];
        for (let channel of this.channels) {
            names.push(channel.name);
        }
        return names;
    }
    connectToChannel(ws, name) {
        let channel = this.getChannel(name);
        if (!channel) {
            return;
        }
        channel.addClient(ws);
        ws.connection.send(JSON.stringify(new Message(TYPE.CONNECT, name)));
    }
}
export class Channel {
    constructor(name) {
        this.name = name;
        this.clients = [];
        this.imageHandler = new ImageHander();
    }
    checkClient(ws) {
        let exists = false;
        for (let client of this.clients) {
            if (client.id == ws.id) {
                exists = true;
            }
        }
        return exists;
    }
    addClient(ws) {
        this.clients.push(ws);
        this.imageHandler.addClientState(ws);
    }
    removeClient(ws) {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].id === ws.id) {
                this.clients.splice(i, 1);
            }
        }
        this.imageHandler.removeState(ws.id);
        if (this.imageHandler.checkReady()) {
            let random_image = Math.floor(Math.random() * this.imageHandler.clients.length);
            this.msgAll(this.imageHandler.clients[random_image].image, TYPE.IMAGE);
            this.imageHandler.clear();
        }
    }
    receiveImage(ws, image) {
        this.imageHandler.receiveImage(ws.id, image);
        if (this.imageHandler.checkReady()) {
            let random_image = Math.floor(Math.random() * this.imageHandler.clients.length);
            this.msgAll(this.imageHandler.clients[random_image].image, TYPE.IMAGE);
            this.imageHandler.clear();
        }
    }
    msgAll(msg, type) {
        let message = new Message(type, msg);
        for (let client of this.clients) {
            client.connection.send(JSON.stringify(message));
        }
    }
}
class ImageHander {
    constructor() {
        this.clients = [];
        this.images = [];
    }
    addClientState(client) {
        this.clients.push(new ClientState(client.id));
    }
    receiveImage(id, image) {
        for (let client of this.clients) {
            if (client.id == id) {
                client.image = image;
                client.ready = true;
            }
        }
    }
    removeState(id) {
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
    constructor(id) {
        this.id = id;
        this.ready = false;
        this.image = "";
    }
}
export class Message {
    constructor(type, msg) {
        this.type = type;
        this.msg = msg;
    }
}
export class StartupMessage {
    constructor(type, channels, id) {
        this.type = type;
        this.channels = channels;
        this.id = id;
    }
}
export class Client {
    constructor(id, connection) {
        this.id = id;
        this.connection = connection;
    }
}
export var TYPE;
(function (TYPE) {
    TYPE["CONNECT"] = "CONNECT";
    TYPE["DISCONNECT"] = "DISCONNECT";
    TYPE["SEND"] = "SEND";
    TYPE["CREATE"] = "CREATE";
    TYPE["STARTUP"] = "STARTUP";
    TYPE["QUEARY"] = "QUEARY";
    TYPE["IMAGE"] = "IMAGE";
})(TYPE || (TYPE = {}));
