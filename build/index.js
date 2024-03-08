"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2Q = void 0;
// Packages:
const immer_1 = require("immer");
const lodash_1 = require("lodash");
// Classes:
class P2Q {
    constructor(initialStore) {
        // State:
        this.storeListeners = [];
        this.topicListeners = new Map();
        this.topicIDs = new Set();
        this.defaultStore = {};
        this.store = {};
        // Listeners:
        this.addListenerToStore = (callback, options) => {
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
        };
        this.removeListenerFromStore = (callback, options) => {
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
        };
        this.addListenerToTopic = (ID, callback, options) => {
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
            if (this.store[ID] === undefined) {
                if (options === null || options === void 0 ? void 0 : options.ensure)
                    this.createTopic(ID);
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
        };
        this.removeListenerFromTopic = (ID, callback, options) => {
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
            if (this.store[ID] === undefined) {
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
        };
        // Getters:
        this.getStore = (topicID, options) => {
            if (topicID)
                return this.getTopic(topicID, options);
            return this.store;
        };
        this.getTopic = (ID, options) => {
            if (!(0, lodash_1.isString)(ID)) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return undefined;
                throw new Error('[p2q] Attempted to get a topic with a non-string ID!');
            }
            if (this.store[ID] === undefined) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return undefined;
                throw new Error('[p2q] Attempted to get a topic that does not exist!');
            }
            return this.store[ID];
        };
        // Setters:
        this.createTopic = (ID, initialTopic, options) => {
            var _a;
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
            if (this.store[ID] !== undefined) {
                if (options === null || options === void 0 ? void 0 : options.overwrite)
                    return this.updateTopic(ID, () => initialTopic !== null && initialTopic !== void 0 ? initialTopic : {});
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return undefined;
                throw new Error('[p2q] Attempted to create a topic that already exists!');
            }
            this.store = (0, immer_1.produce)(this.store, (_store) => {
                _store[ID] = initialTopic ? initialTopic : {};
            });
            (_a = this.storeListeners) === null || _a === void 0 ? void 0 : _a.forEach(storeCallback => storeCallback(this.store));
            this.topicIDs.add(ID);
            return this.store[ID];
        };
        this.updateTopic = (ID, mutator, options) => {
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
            if (this.store[ID] === undefined) {
                if (options === null || options === void 0 ? void 0 : options.ensure)
                    this.createTopic(ID);
                else if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return undefined;
                else
                    throw new Error('[p2q] Attempted to update a topic that does not exist!');
            }
            if (!(0, lodash_1.isObject)(this.store[ID])) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return undefined;
                throw new Error('[p2q] Attempted to update a topic that contains non-object data!');
            }
            this.store = (0, immer_1.produce)(this.store, (_store) => {
                var _a, _b;
                const _topic = (0, lodash_1.cloneDeep)(_store[ID]);
                const newTopic = mutator(_topic);
                if (!(0, lodash_1.isObject)(newTopic)) {
                    if (options === null || options === void 0 ? void 0 : options.silentErrors)
                        return;
                    throw new Error('[p2q] Attempted to update a topic with a non-object!');
                }
                _store[ID] = newTopic;
                (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(_store[ID]));
                (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(_store));
            });
            return this.store[ID];
        };
        this.deleteTopic = (ID, options) => {
            var _a, _b;
            if (!(0, lodash_1.isString)(ID)) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return;
                throw new Error('[p2q] Attempted to delete a topic with a non-string ID!');
            }
            if (this.store[ID] === undefined) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return;
                throw new Error('[p2q] Attempted to delete a topic that does not exist!');
            }
            (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(undefined));
            this.topicListeners.delete(ID);
            this.store = (0, immer_1.produce)(this.store, (_store) => {
                delete _store[ID];
            });
            (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(this.store));
            this.topicIDs.delete(ID);
        };
        this.resetTopic = (ID, options) => {
            if (!(0, lodash_1.isString)(ID)) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return;
                throw new Error('[p2q] Attempted to reset a topic with a non-string ID!');
            }
            if (this.store[ID] === undefined && !(options === null || options === void 0 ? void 0 : options.ensure)) {
                if (options === null || options === void 0 ? void 0 : options.silentErrors)
                    return;
                throw new Error('[p2q] Attempted to reset a topic that does not exist!');
            }
            this.store = (0, immer_1.produce)(this.store, (_store) => {
                var _a, _b;
                let defaultTopic;
                if (this.defaultStore[ID] || !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith)) {
                    defaultTopic = !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith) ? options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith : this.defaultStore[ID];
                }
                else {
                    if (options === null || options === void 0 ? void 0 : options.ensure)
                        defaultTopic = !!(options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith) ? options === null || options === void 0 ? void 0 : options.overrideDefaultTopicWith : {};
                    else {
                        if (options === null || options === void 0 ? void 0 : options.silentErrors)
                            return;
                        throw new Error('[p2q] Attempted to reset a topic that does not have a default state!');
                    }
                }
                _store[ID] = defaultTopic;
                (_a = this.topicListeners.get(ID)) === null || _a === void 0 ? void 0 : _a.forEach(topicCallback => topicCallback(_store[ID]));
                (_b = this.storeListeners) === null || _b === void 0 ? void 0 : _b.forEach(storeCallback => storeCallback(_store));
            });
        };
        this.defaultStore = initialStore;
        this.store = initialStore;
    }
}
exports.P2Q = P2Q;
// Exports:
exports.default = P2Q;
