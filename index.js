"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p_q = exports.p_p = void 0;
class p_p {
    constructor(props) {
        this.p_q = props.p_q;
        this.id = props.id;
        this.callback = (_from, _data) => { };
    }
    hear(from, data) {
        if (this.callback)
            this.callback.call(this, from, data);
    }
    listen(callback) {
        this.callback = callback;
        this.p_q.listeners.set(this.id, this);
    }
    tell(to, data) {
        const listener = this.p_q.listeners.get(to);
        if (listener)
            listener.hear(this.id, data);
        else
            throw new Error(`p_q - Component ID (${to}) does not exist!`);
    }
    broadcast(data) {
        this.p_q.listeners.forEach(listener => listener.hear(this.id, data));
    }
    unsubscribe() {
        this.p_q.ids = this.p_q.ids.filter(id => id !== this.id);
        this.p_q.existers.delete(this.id);
        this.p_q.listeners.delete(this.id);
    }
}
exports.p_p = p_p;
class p_q {
    constructor() {
        this.ids = [];
        this.existers = new Map();
        this.listeners = new Map();
    }
    register(id) {
        if (this.ids.includes(id))
            return this.existers.get(id);
        this.ids.push(id);
        const p = new p_p({ p_q: this, id: id });
        this.existers.set(id, p);
        return p;
    }
}
exports.p_q = p_q;
const p2q = new p_q();
exports.default = p2q;
