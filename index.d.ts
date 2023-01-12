export type ID = string | number;
export type Listener = (from: ID, data: any) => void;
export type StoreListener = (data: Object) => void;
export declare enum MESSAGE_TYPE {
    NORMAL = 0,
    STORE = 1,
    QUERY = 2
}
export declare const p2qbc: BroadcastChannel;
export declare class P2P {
    private p2q;
    private id;
    private callback;
    private storeCallback;
    private response;
    constructor(props: {
        p2q: P2Q;
        id: ID;
    });
    private hear;
    listen(callback: Listener): void;
    tell(to: ID, data: any, options?: {
        global?: boolean;
    }): void;
    broadcast(data: any, options?: {
        global?: boolean;
    }): void;
    unsubscribe(): void;
    hearStore(data: any): void;
    listenToStore(callback: StoreListener): void;
    ask(options?: {
        global?: boolean;
    }): void;
    setupResponseHandler(response: (to: ID, type: MESSAGE_TYPE, p2p: P2P) => any): void;
    private respond;
}
export declare class P2Q {
    ids: ID[];
    existers: Map<ID, P2P>;
    listeners: Map<ID, P2P>;
    store: {};
    storeListeners: Map<ID, P2P>;
    discriminant: ((data: Object) => boolean) | null;
    register(id: ID): P2P | undefined;
    createStore(data: Object, discriminant?: (data: Object) => boolean): any;
    getStore(): {};
    setStore(data: Object, options?: {
        global?: boolean;
    }): boolean;
}
declare const p2q: P2Q;
export default p2q;
