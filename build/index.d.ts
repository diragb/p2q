type Callback = (initial: any) => any;
export interface CrossOriginCommunication {
    id: string;
    enabled: boolean;
    targetOrigin: string | undefined;
    acceptableIDs: Set<string>;
}
export interface P2QOptions {
    persistLocally?: boolean;
    enableCrossOriginCommunication?: boolean;
    crossOriginCommunication?: CrossOriginCommunication;
}
export declare class P2Q {
    storeListeners: Callback[];
    topicListeners: Map<string, Callback[]>;
    topicIDs: Set<string>;
    defaultStore: Record<string, any>;
    _store: Record<string, any>;
    private crossOriginCommunication;
    constructor(initialStore?: Record<string, any>, options?: P2QOptions);
    private listenForCrossOriginCommunication;
    store: {
        get: (topicID?: string, options?: {
            silentErrors?: boolean;
        }) => any;
        addListener: (callback: Callback, options?: {
            silentErrors?: boolean;
        }) => void;
        removeListener: (callback: Callback, options?: {
            silentErrors?: boolean;
        }) => void;
    };
    topic: {
        get: (ID: string, options?: {
            silentErrors?: boolean;
        }) => any;
        create: <T = object>(ID: string, initialTopic?: T | undefined, options?: {
            silentErrors?: boolean;
            overwrite?: boolean;
        }) => any;
        update: (ID: string, mutator: Callback, options?: {
            silentErrors?: boolean;
            ensure?: boolean;
        }) => any;
        delete: (ID: string, options?: {
            silentErrors?: boolean;
        }) => void;
        reset: (ID: string, options?: {
            silentErrors?: boolean;
            ensure?: boolean;
            overrideDefaultTopicWith?: any;
        }) => any;
        addListener: (ID: string, callback: Callback, options?: {
            silentErrors?: boolean;
            ensure?: boolean;
        }) => void;
        removeListener: (ID: string, callback: Callback, options?: {
            silentErrors?: boolean;
        }) => void;
    };
    crossOrigin: {
        id: {
            get: () => string;
            set: (ID: string, options?: {
                silentErrors?: boolean;
            }) => string | undefined;
        };
        enable: () => boolean;
        disable: () => boolean;
        targetOrigin: {
            get: () => string | undefined;
            set: (targetOrigin: string, options?: {
                silentErrors?: boolean;
            }) => string | undefined;
        };
        acceptableIDs: {
            get: () => Set<string>;
            set: (mutator: (acceptableIDs: Set<string>) => Set<string>, options?: {
                silentErrors?: boolean;
            }) => Set<string> | undefined;
            add: (ID: string, options?: {
                silentErrors?: boolean;
            }) => Set<string> | undefined;
            delete: (ID: string, options?: {
                silentErrors?: boolean;
            }) => Set<string> | undefined;
        };
        removeListener: () => void;
    };
}
export default P2Q;
