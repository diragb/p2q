"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2Q = void 0;
// Packages:
const immer_1 = require("immer");
const lodash_1 = require("lodash");
const localforage_1 = __importDefault(require("localforage"));
// Functions:
const buildMessageForCrossOriginCommunication = (id, payload) => {
    try {
        const wrappedPayload = {
            id,
            payload,
        };
        const stringifiedPayload = JSON.stringify(wrappedPayload);
        return [true, stringifiedPayload];
    }
    catch (error) {
        return [false, error];
    }
};
const deconstructMessageForCrossOriginCommunication = (event, acceptableIDs) => {
    var _a;
    try {
        const parsedData = (_a = JSON.parse(event.data)) !== null && _a !== void 0 ? _a : {};
        if (typeof (parsedData === null || parsedData === void 0 ? void 0 : parsedData.id) !== 'string') {
            return {
                isError: false,
                payload: null,
                isRelevant: false,
            };
        }
        if (!acceptableIDs.has(parsedData === null || parsedData === void 0 ? void 0 : parsedData.id)) {
            return {
                isError: false,
                payload: null,
                isRelevant: false,
            };
        }
        else {
            const payload = parsedData.payload;
            return {
                isError: false,
                payload,
                isRelevant: true,
            };
        }
    }
    catch (error) {
        return {
            isError: true,
            payload: error,
            isRelevant: true,
        };
    }
};
// Classes:
class P2Q {
    constructor(initialStore, options) {
        var _a;
        // State:
        this.storeListeners = [];
        this.topicListeners = new Map();
        this.topicIDs = new Set();
        this.defaultStore = {};
        this._store = {};
        this.crossOriginCommunication = {
            id: 'P2Q-WEB',
            enabled: false,
            targetOrigin: undefined,
            acceptableIDs: new Set(),
        };
        // Listeners:
        this.listenForCrossOriginCommunication = (event) => {
            if (!this.crossOriginCommunication.enabled)
                return;
            const { isError, payload, isRelevant, } = deconstructMessageForCrossOriginCommunication(event, this.crossOriginCommunication.acceptableIDs);
            if (!isRelevant)
                return;
            if (isError) {
                console.error('[p2q] Encountered an error while trying to parse message from outer context', payload, event);
                return;
            }
            this._store = (0, immer_1.produce)(this._store, (_store) => {
                _store = payload;
            });
        };
        // Store:
        this.store = {
            get: (topicID, options) => {
                if (topicID)
                    return this.topic.get(topicID, options);
                return this._store;
            },
            addListener: (callback, options) => {
                var _a;
                if (!(0, lodash_1.isFunction)(callback)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to listen to the store with a non-function callback!');
                }
                const callbackToAdd = (_a = this.storeListeners) === null || _a === void 0 ? void 0 : _a.find(storeCallback => storeCallback !== callback);
                if (callbackToAdd) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to add a listener to the store that it is already listening to!');
                }
                this.storeListeners.push(callback);
            },
            removeListener: (callback, options) => {
                var _a, _b;
                if (!(0, lodash_1.isFunction)(callback)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to remove listener from the store with a non-function callback!');
                }
                const callbackToRemove = (_a = this.storeListeners) === null || _a === void 0 ? void 0 : _a.find(storeCallback => storeCallback !== callback);
                if (!callbackToRemove) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Listener does not exist on the store!');
                }
                this.storeListeners = (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.filter(storeCallback => storeCallback !== callback);
            }
        };
        // Topic:
        this.topic = {
            get: (ID, options) => {
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to get a topic with a non-string ID!');
                }
                if (this._store[ID] === undefined) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to get a topic that does not exist!');
                }
                return this._store[ID];
            },
            create: (ID, initialTopic, options) => {
                var _a, _b;
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to create a topic with a non-string ID!');
                }
                if (!(0, lodash_1.isObject)(initialTopic) && initialTopic !== undefined) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to create a topic with a non-object!');
                }
                if (this._store[ID] !== undefined) {
                    if (options === null || options === void 0 ? void 0 : options.overwrite)
                        return this.topic.update(ID, () => initialTopic !== null && initialTopic !== void 0 ? initialTopic : {});
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to create a topic that already exists!');
                }
                this._store = (0, immer_1.produce)(this._store, (_store) => {
                    _store[ID] = initialTopic ? initialTopic : {};
                });
                (_a = this.storeListeners) === null || _a === void 0 ? void 0 : _a.forEach(storeCallback => storeCallback(this._store));
                this.topicIDs.add(ID);
                localforage_1.default.setItem('p2q', this._store).catch(error => {
                    console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error);
                });
                if (this.crossOriginCommunication.enabled) {
                    const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store);
                    if (!isSuccessful)
                        console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload);
                    window.parent.postMessage(payload, (_b = this.crossOriginCommunication.targetOrigin) !== null && _b !== void 0 ? _b : '*');
                }
                return this._store[ID];
            },
            update: (ID, mutator, options) => {
                var _a, _b, _c;
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to update a topic with a non-string ID!');
                }
                if (!(0, lodash_1.isFunction)(mutator)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to update a topic with a non-function callback!');
                }
                if (this._store[ID] === undefined) {
                    if (options === null || options === void 0 ? void 0 : options.ensure)
                        this.topic.create(ID);
                    else if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    else
                        throw new Error('[p2q] Attempted to update a topic that does not exist!');
                }
                if (!(0, lodash_1.isObject)(this._store[ID])) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return undefined;
                    throw new Error('[p2q] Attempted to update a topic that contains non-object data!');
                }
                let encounteredErrorDuringProduce = false;
                this._store = (0, immer_1.produce)(this._store, (_store) => {
                    const _topic = (0, lodash_1.cloneDeep)(_store[ID]);
                    const newTopic = mutator(_topic);
                    if (!(0, lodash_1.isObject)(newTopic)) {
                        encounteredErrorDuringProduce = true;
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return;
                        throw new Error('[p2q] Attempted to update a topic with a non-object!');
                    }
                    _store[ID] = newTopic;
                });
                if (encounteredErrorDuringProduce)
                    return;
                (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(this._store[ID]));
                (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(this._store));
                localforage_1.default.setItem('p2q', this._store).catch(error => {
                    console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error);
                });
                if (this.crossOriginCommunication.enabled) {
                    const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store);
                    if (!isSuccessful)
                        console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload);
                    window.parent.postMessage(payload, (_c = this.crossOriginCommunication.targetOrigin) !== null && _c !== void 0 ? _c : '*');
                }
                return this._store[ID];
            },
            delete: (ID, options) => {
                var _a, _b, _c;
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to delete a topic with a non-string ID!');
                }
                if (this._store[ID] === undefined) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to delete a topic that does not exist!');
                }
                (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(undefined));
                this.topicListeners.delete(ID);
                this._store = (0, immer_1.produce)(this._store, (_store) => {
                    delete _store[ID];
                });
                (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(this._store));
                this.topicIDs.delete(ID);
                localforage_1.default.setItem('p2q', this._store).catch(error => {
                    console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error);
                });
                if (this.crossOriginCommunication.enabled) {
                    const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store);
                    if (!isSuccessful)
                        console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload);
                    window.parent.postMessage(payload, (_c = this.crossOriginCommunication.targetOrigin) !== null && _c !== void 0 ? _c : '*');
                }
            },
            reset: (ID, options) => {
                var _a, _b, _c;
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to reset a topic with a non-string ID!');
                }
                if (this._store[ID] === undefined && !(options === null || options === void 0 ? void 0 : options.ensure)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to reset a topic that does not exist!');
                }
                let encounteredErrorDuringProduce = false;
                this._store = (0, immer_1.produce)(this._store, (_store) => {
                    let defaultTopic;
                    if (this.defaultStore[ID] || !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith)) {
                        defaultTopic = !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith) ? options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith : this.defaultStore[ID];
                    }
                    else {
                        if (options === null || options === void 0 ? void 0 : options.ensure)
                            defaultTopic = !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith) ? options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith : {};
                        else {
                            encounteredErrorDuringProduce = true;
                            if (options === null || options === void 0 ? void 0 : options.silentErrors)
                                return;
                            throw new Error('[p2q] Attempted to reset a topic that does not have a default state!');
                        }
                    }
                    _store[ID] = defaultTopic;
                });
                if (encounteredErrorDuringProduce)
                    return;
                (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(this._store[ID]));
                (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(this._store));
                localforage_1.default.setItem('p2q', this._store).catch(error => {
                    console.error(`[p2q] Encountered an error while trying to set local state, while trying to create topic ${ID}`, error);
                });
                if (this.crossOriginCommunication.enabled) {
                    const [isSuccessful, payload] = buildMessageForCrossOriginCommunication(this.crossOriginCommunication.id, this._store);
                    if (!isSuccessful)
                        console.error(`[p2q] Encountered an error while trying to communicate across origins, while trying to create topic ${ID}`, payload);
                    window.parent.postMessage(payload, (_c = this.crossOriginCommunication.targetOrigin) !== null && _c !== void 0 ? _c : '*');
                }
                return this._store[ID];
            },
            addListener: (ID, callback, options) => {
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to listen to a topic with a non-string ID!');
                }
                if (!(0, lodash_1.isFunction)(callback)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to listen to a topic with a non-function callback!');
                }
                if (this._store[ID] === undefined) {
                    if (options === null || options === void 0 ? void 0 : options.ensure)
                        this.topic.create(ID);
                    else if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    else
                        throw new Error('[p2q] Attempted to listen to a topic that does not exist!');
                }
                const topicCallbacks = this.topicListeners.get(ID);
                const callbackToAdd = topicCallbacks === null || topicCallbacks === void 0 ? void 0 : topicCallbacks.find(topicCallback => topicCallback !== callback);
                if (callbackToAdd) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to add a listener to a topic that it is already listening to!');
                }
                this.topicListeners.set(ID, topicCallbacks ? [...topicCallbacks, callback] : [callback]);
            },
            removeListener: (ID, callback, options) => {
                if (!(0, lodash_1.isString)(ID)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to remove listener from a topic with a non-string ID!');
                }
                if (!(0, lodash_1.isFunction)(callback)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to remove listener from a topic with a non-function callback!');
                }
                if (this._store[ID] === undefined) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to remove listener from a topic that does not exist!');
                }
                const topicCallbacks = this.topicListeners.get(ID);
                const callbackToRemove = topicCallbacks === null || topicCallbacks === void 0 ? void 0 : topicCallbacks.find(topicCallback => topicCallback !== callback);
                if (!callbackToRemove) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Listener does not exist on topic!');
                }
                this.topicListeners.set(ID, topicCallbacks ? topicCallbacks === null || topicCallbacks === void 0 ? void 0 : topicCallbacks.filter(topicCallback => topicCallback !== callback) : []);
            }
        };
        // Cross Origin:
        this.crossOrigin = {
            id: {
                get: () => this.crossOriginCommunication.id,
                set: (ID, options) => {
                    if (!(0, lodash_1.isString)(ID)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to set ID for Cross Origin Communication with a non-string ID!');
                    }
                    this.crossOriginCommunication.id = ID;
                    return this.crossOriginCommunication.id;
                }
            },
            enable: () => this.crossOriginCommunication.enabled = true,
            disable: () => this.crossOriginCommunication.enabled = false,
            targetOrigin: {
                get: () => this.crossOriginCommunication.targetOrigin,
                set: (targetOrigin, options) => {
                    if (!(0, lodash_1.isString)(targetOrigin)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to set targetOrigin for Cross Origin Communication with a non-string value!');
                    }
                    this.crossOriginCommunication.targetOrigin = targetOrigin;
                    return this.crossOriginCommunication.targetOrigin;
                }
            },
            acceptableIDs: {
                get: () => this.crossOriginCommunication.acceptableIDs,
                set: (mutator, options) => {
                    if (!(0, lodash_1.isFunction)(mutator)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to set acceptable IDs for Cross Origin Communication with a non-function callback!');
                    }
                    const newAcceptableIDs = mutator(this.crossOriginCommunication.acceptableIDs);
                    if (!(0, lodash_1.isArray)(newAcceptableIDs)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to update acceptable IDs for Cross Origin Communication with a non-array!');
                    }
                    this.crossOriginCommunication.acceptableIDs = newAcceptableIDs;
                    return this.crossOriginCommunication.acceptableIDs;
                },
                add: (ID, options) => {
                    if (!(0, lodash_1.isString)(ID)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to add to acceptable IDs for Cross Origin Communication with a non-string ID!');
                    }
                    this.crossOriginCommunication.acceptableIDs.add(ID);
                    return this.crossOriginCommunication.acceptableIDs;
                },
                delete: (ID, options) => {
                    if (!(0, lodash_1.isString)(ID)) {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return undefined;
                        throw new Error('[p2q] Attempted to delete from acceptable IDs for Cross Origin Communication with a non-string ID!');
                    }
                    this.crossOriginCommunication.acceptableIDs.delete(ID);
                    return this.crossOriginCommunication.acceptableIDs;
                },
            },
            removeListener: () => {
                window.parent.removeEventListener('message', this.listenForCrossOriginCommunication);
            },
        };
        if (options === null || options === void 0 ? void 0 : options.persistLocally) {
            localforage_1.default.getItem('p2q', (error, localStore) => {
                if (error)
                    console.error('[p2q] Encountered an error while trying to fetch local store', error);
                else {
                    this.defaultStore = localStore !== null && localStore !== void 0 ? localStore : {};
                    this._store = localStore !== null && localStore !== void 0 ? localStore : {};
                }
            });
        }
        else {
            this.defaultStore = initialStore !== null && initialStore !== void 0 ? initialStore : {};
            this._store = initialStore !== null && initialStore !== void 0 ? initialStore : {};
        }
        if ((_a = options === null || options === void 0 ? void 0 : options.crossOriginCommunication) === null || _a === void 0 ? void 0 : _a.enabled) {
            this.crossOriginCommunication = options === null || options === void 0 ? void 0 : options.crossOriginCommunication;
            window.parent.addEventListener('message', this.listenForCrossOriginCommunication);
        }
    }
}
exports.P2Q = P2Q;
// Exports:
exports.default = P2Q;
