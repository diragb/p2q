"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2Q = exports.P2P = exports.p2qbc = exports.MESSAGE_TYPE = void 0;
var MESSAGE_TYPE;
(function (MESSAGE_TYPE) {
    MESSAGE_TYPE[MESSAGE_TYPE["NORMAL"] = 0] = "NORMAL";
    MESSAGE_TYPE[MESSAGE_TYPE["STORE"] = 1] = "STORE";
    MESSAGE_TYPE[MESSAGE_TYPE["QUERY"] = 2] = "QUERY";
})(MESSAGE_TYPE = exports.MESSAGE_TYPE || (exports.MESSAGE_TYPE = {}));
exports.p2qbc = new BroadcastChannel('p2q');
class P2P {
    constructor(props) {
        this.p2q = props.p2q;
        this.id = props.id;
        this.callback = (_from, _data) => { };
        this.storeCallback = (_data) => { };
        this.response = (_to, _type, _p2p) => undefined;
        exports.p2qbc.onmessage = ({ data: { from, to, data, type } }) => {
            if (type === MESSAGE_TYPE.NORMAL && (to === null || to === this.id))
                this.callback(from, data);
            if (type === MESSAGE_TYPE.STORE)
                this.storeCallback(data);
            if (type === MESSAGE_TYPE.QUERY)
                this.respond(from, MESSAGE_TYPE.QUERY);
        };
    }
    hear(from, data) {
        if (this.callback)
            this.callback(from, data);
    }
    listen(callback) {
        this.callback = callback;
        this.p2q.listeners.set(this.id, this);
    }
    tell(to, data, options) {
        if (options === null || options === void 0 ? void 0 : options.global)
            exports.p2qbc.postMessage({ from: this.id, to, data, type: MESSAGE_TYPE.NORMAL });
        else {
            const listener = this.p2q.listeners.get(to);
            if (listener)
                listener.hear(this.id, data);
            else
                throw new Error(`p2q - Component ID (${to}) does not exist!`);
        }
    }
    broadcast(data, options) {
        if (options === null || options === void 0 ? void 0 : options.global)
            exports.p2qbc.postMessage({ from: this.id, to: null, data, type: MESSAGE_TYPE.NORMAL });
        else
            this.p2q.listeners.forEach(listener => listener.hear(this.id, data));
    }
    unsubscribe() {
        this.p2q.ids = this.p2q.ids.filter(id => id !== this.id);
        this.p2q.existers.delete(this.id);
        this.p2q.listeners.delete(this.id);
        this.p2q.storeListeners.delete(this.id);
    }
    hearStore(data) {
        if (this.storeCallback)
            this.storeCallback(data);
    }
    listenToStore(callback) {
        this.storeCallback = callback;
        this.p2q.storeListeners.set(this.id, this);
    }
    ask(options) {
        if (options === null || options === void 0 ? void 0 : options.global)
            exports.p2qbc.postMessage({ from: this.id, type: MESSAGE_TYPE.QUERY });
        else
            this.p2q.existers.forEach(exister => exister.respond(this.id, MESSAGE_TYPE.NORMAL));
    }
    setupResponseHandler(response) {
        this.response = response;
    }
    respond(from, type) {
        this.response(from, type, this);
    }
}
exports.P2P = P2P;
class P2Q {
    constructor() {
        this.ids = [];
        this.existers = new Map();
        this.listeners = new Map();
        this.store = {};
        this.storeListeners = new Map();
        this.discriminant = null;
    }
    register(id) {
        if (this.ids.includes(id))
            return this.existers.get(id);
        this.ids.push(id);
        const p = new P2P({ p2q: this, id: id });
        this.existers.set(id, p);
        return p;
    }
    createStore(data, discriminant) {
        if (discriminant)
            this.discriminant = discriminant;
        return structuredClone(this.store, data);
    }
    getStore() {
        return this.store;
    }
    setStore(data, options) {
        if (this.discriminant !== null && !this.discriminant(data))
            return false;
        structuredClone(this.store, data);
        if (options === null || options === void 0 ? void 0 : options.global)
            exports.p2qbc.postMessage({ data, type: MESSAGE_TYPE.STORE });
        else
            this.storeListeners.forEach(storeListener => storeListener.hearStore(data));
        return true;
    }
}
exports.P2Q = P2Q;
const p2q = new P2Q();
exports.default = p2q;
