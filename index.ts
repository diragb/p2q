export type ID = string | number
export type Listener = (from: ID, data: any) => void

export class p_p {
  private p_q: p_q
  private id: ID
  private callback: Listener

  constructor (props: { p_q: p_q, id: ID }) {
    this.p_q = props.p_q
    this.id = props.id
    this.callback = (_from: ID, _data: any) => {}
  }

  private hear (from: ID, data: any) {
    if (this.callback) this.callback.call(this, from, data)
  }

  listen (callback: Listener) {
    this.callback = callback
    this.p_q.listeners.set(this.id, this)
  }

  tell (to: ID, data: any) {
    const listener = this.p_q.listeners.get(to)
    if (listener) listener.hear(this.id, data)
    else throw new Error(`p_q - Component ID (${ to }) does not exist!`)
  }

  broadcast (data: any) {
    this.p_q.listeners.forEach(listener => listener.hear(this.id, data))
  }

  unsubscribe () {
    this.p_q.ids = this.p_q.ids.filter(id => id !== this.id)
    this.p_q.existers.delete(this.id)
    this.p_q.listeners.delete(this.id)
  }
}

export class p_q {
  ids: ID[] = []
  existers: Map<ID, p_p> = new Map()
  listeners: Map<ID, p_p> = new Map()

  register (id: ID) {
    if (this.ids.includes(id)) return this.existers.get(id)
    this.ids.push(id)
    const p = new p_p({ p_q: this, id: id })
    this.existers.set(id, p)
    return p
  }
}

const p2q = new p_q()

export default p2q
