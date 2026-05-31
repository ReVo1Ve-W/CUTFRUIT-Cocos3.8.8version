import { NodePool, instantiate, Node, Prefab, warn } from 'cc';

export function batchInitObjPool(targetObj: any, objArray: any[]) {
    for (let i = 0; i < objArray.length; i++) {
        initObjPool(targetObj, objArray[i]);
    }
}

export function initObjPool(targetObj: any, objInfo: any) {
    if (!objInfo || !objInfo.prefab) {
        warn('initObjPool: objInfo or objInfo.prefab is missing');
        return;
    }
    let poolName = objInfo.name + 'Pool';
    targetObj[poolName] = new NodePool();
    let initPoolCount = objInfo.initPoolCount || 0;
    for (let i = 0; i < initPoolCount; ++i) {
        let nodeO = instantiate(objInfo.prefab);
        targetObj[poolName].put(nodeO);
    }
}

export function genNewNode(pool: NodePool, prefab: Prefab | null, nodeParent: Node): Node | null {
    let newNode = pool.size() > 0 ? pool.get() : null;
    if (!newNode) {
        if (!prefab) {
            warn('genNewNode: pool is empty and no prefab provided');
            return null;
        }
        newNode = instantiate(prefab);
    }
    nodeParent.addChild(newNode);
    return newNode;
}

export function backObjPool(targetObj: any, poolName: string, nodeInfo: Node) {
    if (targetObj[poolName]) {
        targetObj[poolName].put(nodeInfo);
    }
}

export function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}
