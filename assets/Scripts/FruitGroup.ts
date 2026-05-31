import { _decorator, Component, Node, Prefab, AudioClip, tween, UIOpacity } from 'cc';
import { TIMING, BOMB_FLASH } from './Constants';
import { AudioMgr } from './AudioMgr';
import { batchInitObjPool, genNewNode, random, backObjPool } from './utils';
const { ccclass, property } = _decorator;

@ccclass('FruitConfig')
export class FruitConfig {
    @property name: string = '';
    @property initPoolCount: number = 10;
    @property score: number = 0;
    @property type: string = 'fruit';
    @property(Prefab) prefab: Prefab = null!;
}

@ccclass('FruitGroup')
export class FruitGroup extends Component {
    @property maxLength: number = 5;
    @property(Node) flashNode: Node = null!;
    @property([FruitConfig]) fruitConfigs: FruitConfig[] = [];
    @property(AudioClip) throwBomb: AudioClip = null!;

    private noBombArr: FruitConfig[] = [];
    private _gameScript: any = null;
    private _juiceGroup: any = null;
    private _scheduledCreate: boolean = false;

    onLoad() {
        this._gameScript = this.node.parent?.getComponent('Game');
        let juiceNode = this.node.parent?.getChildByName('fruitJuice');
        if (juiceNode) {
            this._juiceGroup = juiceNode.getComponent('JuiceGroup');
        }
        this.noBombArr = this.fruitConfigs.filter(a => a.type == 'fruit');
        batchInitObjPool(this, this.fruitConfigs);
    }

    scheduleCreateWave() {
        if (this._scheduledCreate) return;
        this._scheduledCreate = true;
        this.scheduleOnce(() => {
            this._scheduledCreate = false;
            this.createFruitList();
        }, TIMING.WAVE_CREATE_DELAY);
    }

    createFruitList() {
        let totalFr = this.fruitConfigs;
        let randomLength = Math.floor(random(1, this.maxLength + 0.4));
        for (let i = 0; i < randomLength; i++) {
            let ran: number, fruit: FruitConfig, poolName: string;
            ran = Math.floor(random(0, totalFr.length - 0.1));
            fruit = totalFr[ran];
            poolName = fruit.name + 'Pool';
            let fruitNode = genNewNode((this as any)[poolName], fruit.prefab, this.node);
            if (!fruitNode) continue;
            let ui = fruitNode.getComponent('UITransform') as any;
            let parentUi = this.node.getComponent('UITransform') as any;
            let hw = parentUi ? parentUi.width / 2 : 375;
            let hh = parentUi ? parentUi.height / 2 : 375;
            let fw = ui ? ui.width / 2 : 20;
            let fh = ui ? ui.height / 2 : 20;
            fruitNode.setPosition(random(-hw + fw, hw - fw), -(hh - fh));
            let fruitComp: any = fruitNode.getComponent('Fruit');
            if (fruitComp) {
                fruitComp.init(poolName, fruit.score, this._gameScript, this, this._juiceGroup);
            }
            if (fruit.type == 'bomb') {
                AudioMgr.inst.playOneShot(this.throwBomb);
                totalFr = this.noBombArr;
            }
        }
    }

    checkRemain() {
        if (this._gameScript?.isGameOver) return;
        if (this.node.children.length == 0) {
            this.scheduleCreateWave();
        }
    }

    cutBombRemoveAllChildren() {
        this.flashScreen();
        let childObjArr: any[] = [];
        this.node.children.forEach((child) => {
            let comp = child.getComponent('Fruit');
            if (comp) childObjArr.push(comp);
        });
        for (let i = 0; i < childObjArr.length; i++) {
            childObjArr[i].backThisNode(true);
        }
        if (this._gameScript) {
            this._gameScript.loseLife();
            this._gameScript.upDateUi();
        }
        if (!this._gameScript?.isGameOver) {
            this.scheduleCreateWave();
        }
    }

    flashScreen() {
        this.flashNode.active = true;
        let uiOpacity = this.flashNode.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.flashNode.addComponent(UIOpacity);
        }
        uiOpacity.opacity = BOMB_FLASH.INITIAL_OPACITY;
        tween(uiOpacity)
            .to(TIMING.FLASH_DURATION, { opacity: 0 })
            .call(() => {
                this.flashNode.active = false;
            })
            .start();
    }

    recycleNode(fruitComp: any) {
        let poolName = fruitComp.poolName;
        if (poolName) {
            backObjPool(this, poolName, fruitComp.node);
        }
    }
}
