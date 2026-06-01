import { NodePool, instantiate, Node, Prefab, warn } from 'cc';

export interface PoolConfig {
    name: string;
    prefab: Prefab;
    initPoolCount?: number;
}

export function batchInitObjPool(poolMap: Map<string, NodePool>, configs: PoolConfig[]): void {
    for (const config of configs) {
        initObjPool(poolMap, config);
    }
}

export function initObjPool(poolMap: Map<string, NodePool>, config: PoolConfig): void {
    if (!config?.prefab) {
        warn('initObjPool: config or config.prefab is missing');
        return;
    }
    const pool = new NodePool();
    const count = config.initPoolCount || 0;
    for (let i = 0; i < count; i++) {
        pool.put(instantiate(config.prefab));
    }
    poolMap.set(config.name + 'Pool', pool);
}

export function genNewNode(poolMap: Map<string, NodePool>, poolName: string, prefab: Prefab | null, nodeParent: Node): Node | null {
    const pool = poolMap.get(poolName);
    let newNode: Node | null = pool && pool.size() > 0 ? pool.get() : null;
    if (!newNode) {
        if (!prefab) {
            warn('genNewNode: pool empty and no prefab provided');
            return null;
        }
        newNode = instantiate(prefab);
    }
    nodeParent.addChild(newNode);
    return newNode;
}

export function backObjPool(poolMap: Map<string, NodePool>, poolName: string, nodeInfo: Node): void {
    const pool = poolMap.get(poolName);
    if (pool) {
        pool.put(nodeInfo);
    }
}

export function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}
