// Packages:
import { produce } from 'immer'
import {
  isString,
  isObject,
  cloneDeep,
  isFunction,
} from 'lodash'

// Typescript:
type Callback = (initialTopic: any) => any

// Classes:
export class P2Q {
  // State:
  storeListeners: Callback[] = []
  topicListeners: Map<string, Callback[]> = new Map()
  topicIDs: Set<string> = new Set()
  defaultStore: Record<string, any> = {}
  store: Record<string, any> = {}

  constructor (initialStore: Record<string, any>) {
    this.defaultStore = initialStore
    this.store = initialStore
  }

  // Listeners:
  addListenerToStore = (
    callback: Callback,
    options?: {
      silentErrors?: boolean
    }
  ) => {
    if (!isFunction(callback)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to listen to the store with a non-function callback!')
    }
    const callbackToAdd = this.storeListeners?.find(storeCallback => storeCallback !== callback)
    if (callbackToAdd) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to add a listener to the store that it is already listening to!')
    }
    this.storeListeners.push(callback)
  }

  removeListenerFromStore = (
    callback: Callback,
    options?: {
      silentErrors?: boolean
    }
  ) => {
    if (!isFunction(callback)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to remove listener from the store with a non-function callback!')
    }
    const callbackToRemove = this.storeListeners?.find(storeCallback => storeCallback !== callback)
    if (!callbackToRemove) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Listener does not exist on the store!')
    }
    this.storeListeners = this.storeListeners?.filter(storeCallback=> storeCallback !== callback)
  }

  addListenerToTopic = (
    ID: string,
    callback: Callback,
    options?: {
      silentErrors?: boolean
      ensure?: boolean
    }
  ) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to listen to a topic with a non-string ID!')
    }
    if (!isFunction(callback)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to listen to a topic with a non-function callback!')
    }
    if (this.store[ID] === undefined) {
      if (options?.ensure) this.createTopic(ID)
      else if (options?.silentErrors) return
      else throw new Error('[p2q] Attempted to listen to a topic that does not exist!')
    }
    const topicCallbacks = this.topicListeners.get(ID)
    const callbackToAdd = topicCallbacks?.find(topicCallback => topicCallback !== callback)
    if (callbackToAdd) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to add a listener to a topic that it is already listening to!')
    }
    this.topicListeners.set(ID, topicCallbacks ? [...topicCallbacks, callback] : [callback])
  }

  removeListenerFromTopic = (
    ID: string,
    callback: Callback,
    options?: {
      silentErrors?: boolean
    }
  ) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to remove listener from a topic with a non-string ID!')
    }
    if (!isFunction(callback)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to remove listener from a topic with a non-function callback!')
    }
    if (this.store[ID] === undefined) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to remove listener from a topic that does not exist!')
    }
    const topicCallbacks = this.topicListeners.get(ID)
    const callbackToRemove = topicCallbacks?.find(topicCallback => topicCallback !== callback)
    if (!callbackToRemove) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Listener does not exist on topic!')
    }
    this.topicListeners.set(ID, topicCallbacks ? topicCallbacks?.filter(topicCallback => topicCallback !== callback) : [])
  }

  // Getters:
  getStore = (topicID?: string, options?: { silentErrors?: boolean }) => {
    if (topicID) return this.getTopic(topicID, options)
    return this.store
  }

  getTopic = (ID: string, options?: { silentErrors?: boolean }) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to get a topic with a non-string ID!')
    }
    if (this.store[ID] === undefined) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to get a topic that does not exist!')
    }
    return this.store[ID]
  }

  // Setters:
  createTopic = <T = object>(
    ID: string,
    initialTopic?: T,
    options?: {
      silentErrors?: boolean
      overwrite?: boolean
    }
  ) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to create a topic with a non-string ID!')
    }
    if (!isObject(initialTopic) && initialTopic !== undefined) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to create a topic with a non-object!')
    }
    if (this.store[ID] !== undefined) {
      if (options?.overwrite) return this.updateTopic(ID, () => initialTopic ?? {})
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to create a topic that already exists!')
    }
    this.store = produce(this.store, (_store: Record<string, any>) => {
      _store[ID] = initialTopic ? initialTopic : {}
    })
    this.storeListeners?.forEach(storeCallback => storeCallback(this.store))
    this.topicIDs.add(ID)
    return this.store[ID]
  }

  updateTopic = (
    ID: string,
    mutator: Callback,
    options?: {
      silentErrors?: boolean
      ensure?: boolean
    }
  ) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to update a topic with a non-string ID!')
    }
    if (!isFunction(mutator)) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to update a topic with a non-function callback!')
    }
    if (this.store[ID] === undefined) {
      if (options?.ensure) this.createTopic(ID)
      else if (options?.silentErrors) return undefined
      else throw new Error('[p2q] Attempted to update a topic that does not exist!')
    }
    if (!isObject(this.store[ID])) {
      if (options?.silentErrors) return undefined
      throw new Error('[p2q] Attempted to update a topic that contains non-object data!')
    }
    this.store = produce(this.store, (_store: Record<string, any>) => {
      const _topic = cloneDeep(_store[ID])
      const newTopic = mutator(_topic)
      if (!isObject(newTopic)) {
        if (options?.silentErrors) return
        throw new Error('[p2q] Attempted to update a topic with a non-object!')
      }
      _store[ID] = newTopic
      this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(_store[ID]))
      this.storeListeners?.forEach(storeCallback => storeCallback(_store))
    })
    return this.store[ID]
  }

  deleteTopic = (ID: string, options?: { silentErrors?: boolean }) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to delete a topic with a non-string ID!')
    }
    if (this.store[ID] === undefined) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to delete a topic that does not exist!')
    }
    this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(undefined))
    this.topicListeners.delete(ID)
    this.store = produce(this.store, (_store: Record<string, any>) => {
      delete _store[ID]
    })
    this.storeListeners?.forEach(storeCallback => storeCallback(this.store))
    this.topicIDs.delete(ID)
  }

  resetTopic = (
    ID: string,
    options?: {
      silentErrors?: boolean
      ensure?: boolean
      overrideDefaultTopicWith?: any
    }
  ) => {
    if (!isString(ID)) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to reset a topic with a non-string ID!')
    }
    if (this.store[ID] === undefined && !options?.ensure) {
      if (options?.silentErrors) return
      throw new Error('[p2q] Attempted to reset a topic that does not exist!')
    }
    this.store = produce(this.store, (_store: Record<string, any>) => {
      let defaultTopic
      if (this.defaultStore[ID] || !!options?.overrideDefaultTopicWith) {
        defaultTopic = !!options?.overrideDefaultTopicWith ? options?.overrideDefaultTopicWith : this.defaultStore[ID]
      } else {
        if (options?.ensure) defaultTopic = !!options?.overrideDefaultTopicWith ? options?.overrideDefaultTopicWith : {}
        else {
          if (options?.silentErrors) return
          throw new Error('[p2q] Attempted to reset a topic that does not have a default state!')
        }
      }
      _store[ID] = defaultTopic
      this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(_store[ID]))
      this.storeListeners?.forEach(storeCallback => storeCallback(_store))
    })
  }
}

// Exports:
export default P2Q
