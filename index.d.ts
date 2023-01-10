export type ID = string | number;
export type Listener = (from: ID, data: any) => void;
export declare class p_p {
    private p_q;
    private id;
    private callback;
    constructor(props: {
        p_q: p_q;
        id: ID;
    });
    private hear;
    listen(callback: Listener): void;
    tell(to: ID, data: any): void;
    broadcast(data: any): void;
    unsubscribe(): void;
}
export declare class p_q {
    ids: ID[];
    existers: Map<ID, p_p>;
    listeners: Map<ID, p_p>;
    register(id: ID): p_p | undefined;
}
declare const p2q: p_q;
export default p2q;
