type Callback = (initialTopic: any) => any;
export declare class P2Q {
    storeListeners: Callback[];
    topicListeners: Map<string, Callback[]>;
    topicIDs: Set<string>;
    defaultStore: Record<string, any>;
    store: Record<string, any>;
    constructor(initialStore: Record<string, any>);
    addListenerToStore: (callback: Callback, options?: {
        silentErrors?: boolean;
    }) => void;
    removeListenerFromStore: (callback: Callback, options?: {
        silentErrors?: boolean;
    }) => void;
    addListenerToTopic: (ID: string, callback: Callback, options?: {
        silentErrors?: boolean;
        ensure?: boolean;
    }) => void;
    removeListenerFromTopic: (ID: string, callback: Callback, options?: {
        silentErrors?: boolean;
    }) => void;
    getStore: (topicID?: string, options?: {
        silentErrors?: boolean;
    }) => any;
    getTopic: (ID: string, options?: {
        silentErrors?: boolean;
    }) => any;
    createTopic: <T = object>(ID: string, initialTopic?: T | undefined, options?: {
        silentErrors?: boolean;
        overwrite?: boolean;
    }) => any;
    updateTopic: (ID: string, mutator: Callback, options?: {
        silentErrors?: boolean;
        ensure?: boolean;
    }) => any;
    deleteTopic: (ID: string, options?: {
        silentErrors?: boolean;
    }) => void;
    resetTopic: (ID: string, options?: {
        silentErrors?: boolean;
        ensure?: boolean;
        overrideDefaultTopicWith?: any;
    }) => void;
}
export default P2Q;
