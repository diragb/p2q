export type ID = string | number
export type Listener = (from: ID, data: any) => void
export type StoreListener = (data: Object) => void
export enum MESSAGE_TYPE { NORMAL, STORE, QUERY }
export const p2qbc = new BroadcastChannel('p2q')

export class P2P {
  private p2q: P2Q
  private id: ID
  private callback: Listener
  private storeCallback: StoreListener
  private response: (to: ID, type: MESSAGE_TYPE, p2p: P2P) => any

  constructor (props: { p2q: P2Q, id: ID }) {
    this.p2q = props.p2q
    this.id = props.id
    this.callback = (_from: ID, _data: any) => {}
    this.storeCallback = (_data: Object) => {}
    this.response = (_to, _type, _p2p) => undefined
    p2qbc.onmessage = ({ data: { from, to, data, type } }) => {
      if (type === MESSAGE_TYPE.NORMAL && (to === null || to === this.id))
        this.callback(from, data)
      if (type === MESSAGE_TYPE.STORE) this.storeCallback(data)
      if (type === MESSAGE_TYPE.QUERY) this.respond(from, MESSAGE_TYPE.QUERY)
    }
  }

  private hear (from: ID, data: any) {
    if (this.callback) this.callback(from, data)
  }

  listen (callback: Listener) {
    this.callback = callback
    this.p2q.listeners.set(this.id, this)
  }

  tell (to: ID, data: any, options?: { global?: boolean }) {
    if (options?.global) p2qbc.postMessage({ from: this.id, to, data, type: MESSAGE_TYPE.NORMAL })
    else {
      const listener = this.p2q.listeners.get(to)
      if (listener) listener.hear(this.id, data)
      else throw new Error(`p2q - Component ID (${ to }) does not exist!`)
    }
  }

  broadcast (data: any, options?: { global?: boolean }) {
    if (options?.global) p2qbc.postMessage({ from: this.id, to: null, data, type: MESSAGE_TYPE.NORMAL })
    else this.p2q.listeners.forEach(listener => listener.hear(this.id, data))
  }

  unsubscribe () {
    this.p2q.ids = this.p2q.ids.filter(id => id !== this.id)
    this.p2q.existers.delete(this.id)
    this.p2q.listeners.delete(this.id)
    this.p2q.storeListeners.delete(this.id)
  }

  hearStore (data: any) {
    if (this.storeCallback) this.storeCallback(data)
  }

  listenToStore (callback: StoreListener) {
    this.storeCallback = callback
    this.p2q.storeListeners.set(this.id, this)
  }

  ask (options?: { global?: boolean }) {
    if (options?.global) p2qbc.postMessage({ from: this.id, type: MESSAGE_TYPE.QUERY })
    else this.p2q.existers.forEach(exister => exister.respond(this.id, MESSAGE_TYPE.NORMAL))
  }

  setupResponseHandler (response: (to: ID, type: MESSAGE_TYPE, p2p: P2P) => any) {
    this.response = response
  }

  private respond (from: ID, type: MESSAGE_TYPE) {
    this.response(from, type, this)
  }
}

export class P2Q {
  ids: ID[] = []
  existers: Map<ID, P2P> = new Map()
  listeners: Map<ID, P2P> = new Map()
  store = {}
  storeListeners: Map<ID, P2P> = new Map()
  discriminant: ((data: Object) => boolean) | null = null

  register (id: ID) {
    if (this.ids.includes(id)) return this.existers.get(id)
    this.ids.push(id)
    const p = new P2P({ p2q: this, id: id })
    this.existers.set(id, p)
    return p
  }

  createStore (data: Object, discriminant?: (data: Object) => boolean) {
    if (discriminant) this.discriminant = discriminant
    return structuredClone(this.store, data)
  }

  getStore () {
    return this.store
  }

  setStore (data: Object, options?: { global?: boolean }) {
    if (this.discriminant !== null && !this.discriminant(data)) return false
    structuredClone(this.store, data)
    if (options?.global) p2qbc.postMessage({ data, type: MESSAGE_TYPE.STORE })
    else this.storeListeners.forEach(storeListener => storeListener.hearStore(data))
    return true
  }
}

const p2q = new P2Q()
export default p2q
