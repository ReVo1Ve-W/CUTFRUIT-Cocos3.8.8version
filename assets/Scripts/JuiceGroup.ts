import { _decorator, Component, Node, Prefab, Color, Vec3 } from 'cc';
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
    @property(Prefab) juicePfb: Prefab = null!;

    private poolName: string = 'fruitJuicePool';

    onLoad() {
        let createPoolObj = {
            name: 'fruitJuice',
            prefab: this.juicePfb,
            initPoolCount: POOL.FRUIT_JUICE_SIZE
        };
        initObjPool(this, createPoolObj);
    }

    createJuiceBg(pos: Vec3, colorType: number) {
        let currJuiceColor = this.juiceColors.find(a => a.code == colorType);
        if (!currJuiceColor) return;
        let color = currJuiceColor.color;
        let rotation = random(0, 359);
        let opacity = currJuiceColor.opacity;
        let juiceNode = genNewNode((this as any)[this.poolName], this.juicePfb, this.node);
        if (!juiceNode) return;
        juiceNode.setPosition(pos);
        const juiceComp: any = juiceNode.getComponent('FruitJuice');
        if (juiceComp) {
            juiceComp.init(rotation, color, opacity);
        }
    }

    backNode(nodeInfo: Node) {
        backObjPool(this, this.poolName, nodeInfo);
    }
}
