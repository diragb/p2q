// Packages:
import { produce } from 'immer'
import {
  isString,
  isObject,
  isArray,
  cloneDeep,
  isFunction,
} from 'lodash'
import localforage from 'localforage'

// Typescript:
type Callback = (initial: any) => any

export interface CrossOriginCommunication {
  id: string
  enabled: boolean
  targetOrigin: string | undefined
  acceptableIDs: Set<string>
}

export interface P2QOptions {
  persistLocally?: boolean
  enableCrossOriginCommunication?: boolean
  crossOriginCommunication?: CrossOriginCommunication
}

// Functions:
const buildMessageForCrossOriginCommunication = (id: string, payload: any): [false, any] | [true, string] => {
  try {
    const wrappedPayload = {
      id,
      payload,
    }
    const stringifiedPayload = JSON.stringify(wrappedPayload)
    return [true, stringifiedPayload]
  } catch (error) {
    return [false, error]
  }
}

const deconstructMessageForCrossOriginCommunication = (event: MessageEvent<any>, acceptableIDs: Set<string>): {
  isError: boolean
  payload: any
  isRelevant: boolean
} => {
  try {
    const parsedData = JSON.parse(event.data) ?? {}
    if (typeof parsedData?.id !== 'string') {
      return {
        isError: false,
        payload: null,
        isRelevant: false,
      }
    } if (!acceptableIDs.has(parsedData?.id)) {
      return {
        isError: false,
        payload: null,
        isRelevant: false,
      }
    } else {
      const payload = parsedData.payload
      return {
        isError: false,
        payload,
        isRelevant: true,
      }
    }
  } catch (error) {
    return {
      isError: true,
      payload: error,
      isRelevant: true,
    }
  }
}

// Classes:
export class P2Q {
  // State:
  storeListeners: Callback[] = []
  topicListeners: Map<string, Callback[]> = new Map()
  topicIDs: Set<string> = new Set()
  defaultStore: Record<string, any> = {}
  _store: Record<string, any> = {}
  private crossOriginCommunication: CrossOriginCommunication = {
    id: 'P2Q-WEB',
    enabled: false,
    targetOrigin: undefined,
    acceptableIDs: new Set(),
  }

  constructor (initialStore?: Record<string, any>, options?: P2QOptions) {
    if (options?.persistLocally) {
      localforage.getItem('p2q', (error, localStore: any) => {
        if (error) console.error('[p2q] Encountered an error while trying to fetch local store', error)
        else {
          this.defaultStore = localStore ?? {}
          this._store = localStore ?? {}
        }
      })
    } else {
      this.defaultStore = initialStore ?? {}
      this._store = initialStore ?? {}
    }
    if (options?.crossOriginCommunication?.enabled) {
      this.crossOriginCommunication = options?.crossOriginCommunication
      window.parent.addEventListener('message', this.listenForCrossOriginCommunication)
    }
  }

  // Listeners:
  private listenForCrossOriginCommunication = (event: MessageEvent<any>) => {
    if (!this.crossOriginCommunication.enabled) return
    const {
      isError,
      payload,
      isRelevant,
    } = deconstructMessageForCrossOriginCommunication(event, this.crossOriginCommunication.acceptableIDs)
    if (!isRelevant) return
    if (isError) {
      console.error('[p2q] Encountered an error while trying to parse message from outer context', payload, event)
      return
    }
    this._store = produce(this._store, (_store: Record<string, any>) => {
      _store = payload
    })
  }

  // Store:
  store = {
    get: (topicID?: string, options?: { silentErrors?: boolean }) => {
      if (topicID) return this.topic.get(topicID, options)
      return this._store
    },
    addListener: (
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
    },
    removeListener: (
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
  }

  // Topic:
  topic = {
    get: (ID: string, options?: { silentErrors?: boolean }) => {
      if (!isString(ID)) {
        if (options?.silentErrors) return undefined
        throw new Error('[p2q] Attempted to get a topic with a non-string ID!')
      }
      if (this._store[ID] === undefined) {
        if (options?.silentErrors) return undefined
        throw new Error('[p2q] Attempted to get a topic that does not exist!')
      }
      return this._store[ID]
    },
    create: <T = object>(
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
      if (this._store[ID] !== undefined) {
        if (options?.overwrite) return this.topic.update(ID, () => initialTopic ?? {})
        if (options?.silentErrors) return undefined
        throw new Error('[p2q] Attempted to create a topic that already exists!')
      }
      this._store = produce(this._store, (_store: Record<string, any>) => {
        _store[ID] = initialTopic ? initialTopic : {}
      })
      this.storeListeners?.forEach(storeCallback => storeCallback(this._store))
      this.topicIDs.add(ID)
      localforage.setItem('p2q', this._store).catch(error => {
        console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error)
      })
      if (this.crossOriginCommunication.enabled) {
        const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store)
        if (!isSuccessful) console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload)
        window.parent.postMessage(payload, this.crossOriginCommunication.targetOrigin ?? '*')
      }
      return this._store[ID]
    },
    update: (
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
      if (this._store[ID] === undefined) {
        if (options?.ensure) this.topic.create(ID)
        else if (options?.silentErrors) return undefined
        else throw new Error('[p2q] Attempted to update a topic that does not exist!')
      }
      if (!isObject(this._store[ID])) {
        if (options?.silentErrors) return undefined
        throw new Error('[p2q] Attempted to update a topic that contains non-object data!')
      }
      let encounteredErrorDuringProduce = false
      this._store = produce(this._store, (_store: Record<string, any>) => {
        const _topic = cloneDeep(_store[ID])
        const newTopic = mutator(_topic)
        if (!isObject(newTopic)) {
          encounteredErrorDuringProduce = true
          if (options?.silentErrors) return
          throw new Error('[p2q] Attempted to update a topic with a non-object!')
        }
        _store[ID] = newTopic
      })
      if (encounteredErrorDuringProduce) return
      this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(this._store[ID]))
      this.storeListeners?.forEach(storeCallback => storeCallback(this._store))
      localforage.setItem('p2q', this._store).catch(error => {
        console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error)
      })
      if (this.crossOriginCommunication.enabled) {
        const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store)
        if (!isSuccessful) console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload)
        window.parent.postMessage(payload, this.crossOriginCommunication.targetOrigin ?? '*')
      }
      return this._store[ID]
    },
    delete: (ID: string, options?: { silentErrors?: boolean }) => {
      if (!isString(ID)) {
        if (options?.silentErrors) return
        throw new Error('[p2q] Attempted to delete a topic with a non-string ID!')
      }
      if (this._store[ID] === undefined) {
        if (options?.silentErrors) return
        throw new Error('[p2q] Attempted to delete a topic that does not exist!')
      }
      this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(undefined))
      this.topicListeners.delete(ID)
      this._store = produce(this._store, (_store: Record<string, any>) => {
        delete _store[ID]
      })
      this.storeListeners?.forEach(storeCallback => storeCallback(this._store))
      this.topicIDs.delete(ID)
      localforage.setItem('p2q', this._store).catch(error => {
        console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error)
      })
      if (this.crossOriginCommunication.enabled) {
        const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store)
        if (!isSuccessful) console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload)
        window.parent.postMessage(payload, this.crossOriginCommunication.targetOrigin ?? '*')
      }
    },
    reset: (
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
      if (this._store[ID] === undefined && !options?.ensure) {
        if (options?.silentErrors) return
        throw new Error('[p2q] Attempted to reset a topic that does not exist!')
      }
      let encounteredErrorDuringProduce = false
      this._store = produce(this._store, (_store: Record<string, any>) => {
        let defaultTopic
        if (this.defaultStore[ID] || !!options?.overrideDefaultTopicWith) {
          defaultTopic = !!options?.overrideDefaultTopicWith ? options?.overrideDefaultTopicWith : this.defaultStore[ID]
        } else {
          if (options?.ensure) defaultTopic = !!options?.overrideDefaultTopicWith ? options?.overrideDefaultTopicWith : {}
          else {
            encounteredErrorDuringProduce = true
            if (options?.silentErrors) return
            throw new Error('[p2q] Attempted to reset a topic that does not have a default state!')
          }
        }
        _store[ID] = defaultTopic
      })
      if (encounteredErrorDuringProduce) return
      this.topicListeners.get(ID)?.forEach(topicCallback => topicCallback(this._store[ID]))
      this.storeListeners?.forEach(storeCallback => storeCallback(this._store))
      localforage.setItem('p2q', this._store).catch(error => {
        console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error)
      })
      if (this.crossOriginCommunication.enabled) {
        const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store)
        if (!isSuccessful) console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload)
        window.parent.postMessage(payload, this.crossOriginCommunication.targetOrigin ?? '*')
      }
      return this._store[ID]
    },
    addListener: (
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
      if (this._store[ID] === undefined) {
        if (options?.ensure) this.topic.create(ID)
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
    },
    removeListener: (
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
      if (this._store[ID] === undefined) {
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
  }

  // Cross Origin:
  crossOrigin = {
    id: {
      get: () => this.crossOriginCommunication.id,
      set: (
        ID: string,
        options?: {
          silentErrors?: boolean
        }
      ) => {
        if (!isString(ID)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to set ID for Cross Origin Communication with a non-string ID!')
        }
        this.crossOriginCommunication.id = ID
        return this.crossOriginCommunication.id
      }
    },
    enable: () => this.crossOriginCommunication.enabled = true,
    disable: () => this.crossOriginCommunication.enabled = false,
    targetOrigin: {
      get: () => this.crossOriginCommunication.targetOrigin,
      set: (
        targetOrigin: string,
        options?: {
          silentErrors?: boolean
        }
      ) => {
        if (!isString(targetOrigin)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to set targetOrigin for Cross Origin Communication with a non-string value!')
        }
        this.crossOriginCommunication.targetOrigin = targetOrigin
        return this.crossOriginCommunication.targetOrigin 
      }
    },
    acceptableIDs: {
      get: () => this.crossOriginCommunication.acceptableIDs,
      set: (
        mutator: (acceptableIDs: Set<string>) => Set<string>,
        options?: {
          silentErrors?: boolean
        }
      ) => {
        if (!isFunction(mutator)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to set acceptable IDs for Cross Origin Communication with a non-function callback!')
        }
        const newAcceptableIDs = mutator(this.crossOriginCommunication.acceptableIDs)
        if (!isArray(newAcceptableIDs)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to update acceptable IDs for Cross Origin Communication with a non-array!')
        }
    
        this.crossOriginCommunication.acceptableIDs = newAcceptableIDs
        return this.crossOriginCommunication.acceptableIDs
      },
      add: (
        ID: string,
        options?: {
          silentErrors?: boolean
        }
      ) => {
        if (!isString(ID)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to add to acceptable IDs for Cross Origin Communication with a non-string ID!')
        }
        this.crossOriginCommunication.acceptableIDs.add(ID)
        return this.crossOriginCommunication.acceptableIDs
      },
      delete: (
        ID: string,
        options?: {
          silentErrors?: boolean
        }
      ) => {
        if (!isString(ID)) {
          if (options?.silentErrors) return undefined
          throw new Error('[p2q] Attempted to delete from acceptable IDs for Cross Origin Communication with a non-string ID!')
        }
        this.crossOriginCommunication.acceptableIDs.delete(ID)
        return this.crossOriginCommunication.acceptableIDs
      },
    },
    removeListener: () => {
      window.parent.removeEventListener('message', this.listenForCrossOriginCommunication)
    },
  }
}

// Exports:
export default P2Q
