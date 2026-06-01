import { _decorator, Component, Node, Prefab, AudioClip, tween, UIOpacity, NodePool } from 'cc';
import { TIMING, BOMB_FLASH } from './Constants';
import { AudioMgr } from './AudioMgr';
import { batchInitObjPool, genNewNode, random, backObjPool, PoolConfig } from './utils';

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

    private noBombConfigs: FruitConfig[] = [];
    private _gameScript: any = null;
    private _juiceGroup: any = null;
    private _waveScheduled: boolean = false;
    private _poolMap: Map<string, NodePool> = new Map();

    onLoad(): void {
        this._gameScript = this.node.parent?.getComponent('Game');
        const juiceNode = this.node.parent?.getChildByName('fruitJuice');
        if (juiceNode) {
            this._juiceGroup = juiceNode.getComponent('JuiceGroup');
        }
        this.noBombConfigs = this.fruitConfigs.filter(c => c.type === 'fruit');
        batchInitObjPool(this._poolMap, this.fruitConfigs as PoolConfig[]);
    }

    scheduleCreateWave(): void {
        if (this._waveScheduled) return;
        this._waveScheduled = true;
        this.scheduleOnce(() => {
            this._waveScheduled = false;
            this.createFruitList();
        }, TIMING.WAVE_CREATE_DELAY);
    }

    createFruitList(): void {
        let configs = this.fruitConfigs;
        const count = Math.floor(random(1, this.maxLength + 0.4));

        for (let i = 0; i < count; i++) {
            const idx = Math.floor(random(0, configs.length - 0.1));
            const fruitConfig = configs[idx];
            const poolName = fruitConfig.name + 'Pool';

            const fruitNode = genNewNode(this._poolMap, poolName, fruitConfig.prefab, this.node);
            if (!fruitNode) continue;

            const ui = fruitNode.getComponent('UITransform') as any;
            const parentUi = this.node.getComponent('UITransform') as any;
            const hw = parentUi ? parentUi.width / 2 : 375;
            const hh = parentUi ? parentUi.height / 2 : 375;
            const fw = ui ? ui.width / 2 : 20;
            const fh = ui ? ui.height / 2 : 20;
            fruitNode.setPosition(random(-hw + fw, hw - fw), -(hh - fh));

            const fruitComp: any = fruitNode.getComponent('Fruit');
            fruitComp?.init(poolName, fruitConfig.score, this._gameScript, this, this._juiceGroup);

            if (fruitConfig.type === 'bomb') {
                AudioMgr.inst.playOneShot(this.throwBomb);
                configs = this.noBombConfigs;
            }
        }
    }

    checkRemain(): void {
        if (this._gameScript?.isGameOver) return;
        if (this.node.children.length === 0) {
            this.scheduleCreateWave();
        }
    }

    cutBombRemoveAllChildren(): void {
        this.flashScreen();

        const fruitComps: any[] = [];
        this.node.children.forEach(child => {
            const comp = child.getComponent('Fruit');
            if (comp) fruitComps.push(comp);
        });
        for (const comp of fruitComps) {
            comp.returnToPool(true);
        }

        if (this._gameScript) {
            this._gameScript.loseLife();
            this._gameScript.upDateUi();
        }

        if (!this._gameScript?.isGameOver) {
            this.scheduleCreateWave();
        }
    }

    flashScreen(): void {
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

    recycleNode(fruitComp: any): void {
        if (fruitComp.poolName) {
            backObjPool(this._poolMap, fruitComp.poolName, fruitComp.node);
        }
    }
}
