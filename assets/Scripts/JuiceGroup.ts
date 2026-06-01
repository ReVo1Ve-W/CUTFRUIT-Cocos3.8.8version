import { _decorator, Component, Node, Prefab, Color, Vec3, NodePool } from 'cc';
import { POOL } from './Constants';
import { initObjPool, genNewNode, backObjPool, random } from './utils';

const { ccclass, property } = _decorator;

@ccclass('JuiceColor')
export class JuiceColor {
    @property code: number = 0;
    @property(Color) color: Color = new Color();
    @property opacity: number = 255;
}

@ccclass('JuiceGroup')
export class JuiceGroup extends Component {
    @property([JuiceColor]) juiceColors: JuiceColor[] = [];
    @property(Prefab) juicePrefab: Prefab = null!;

    private poolName: string = 'fruitJuicePool';
    private _poolMap: Map<string, NodePool> = new Map();

    onLoad(): void {
        initObjPool(this._poolMap, {
            name: 'fruitJuice',
            prefab: this.juicePrefab,
            initPoolCount: POOL.FRUIT_JUICE_SIZE,
        });
    }

    createJuiceBg(pos: Vec3, colorType: number): void {
        const currJuiceColor = this.juiceColors.find(a => a.code === colorType);
        if (!currJuiceColor) return;

        const juiceNode = genNewNode(this._poolMap, this.poolName, this.juicePrefab, this.node);
        if (!juiceNode) return;

        juiceNode.setPosition(pos);
        const juiceComp: any = juiceNode.getComponent('FruitJuice');
        juiceComp?.init(random(0, 359), currJuiceColor.color, currJuiceColor.opacity);
    }

    backNode(nodeInfo: Node): void {
        backObjPool(this._poolMap, this.poolName, nodeInfo);
    }
}
