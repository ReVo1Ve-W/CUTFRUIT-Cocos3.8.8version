import { _decorator, Component, Node, Prefab, AudioClip, tween, UIOpacity, NodePool } from 'cc';
import { TIMING, BOMB_FLASH, WAVE, THROW, PHYSICS } from './Constants';
import { AudioMgr } from './AudioMgr';
import { batchInitObjPool, genNewNode, random, backObjPool, PoolConfig } from './utils';

const { ccclass, property } = _decorator;

type WavePattern = 'fan' | 'arc' | 'random';

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
    @property(Node) flashNode: Node = null!;
    @property([FruitConfig]) fruitConfigs: FruitConfig[] = [];
    @property(AudioClip) throwBomb: AudioClip = null!;

    private noBombConfigs: FruitConfig[] = [];
    private _gameScript: any = null;
    private _juiceGroup: any = null;
    private _waveScheduled: boolean = false;
    private _poolMap: Map<string, NodePool> = new Map();
    private _halfWidth: number = 375;
    private _halfHeight: number = 375;
    private _spawnY: number = 0;

    onLoad(): void {
        this._gameScript = this.node.parent?.getComponent('Game');
        const juiceNode = this.node.parent?.getChildByName('fruitJuice');
        if (juiceNode) {
            this._juiceGroup = juiceNode.getComponent('JuiceGroup');
        }
        this.noBombConfigs = this.fruitConfigs.filter(c => c.type === 'fruit');
        batchInitObjPool(this._poolMap, this.fruitConfigs as PoolConfig[]);

        const parentUi = this.node.getComponent('UITransform') as any;
        if (parentUi) {
            this._halfWidth = parentUi.width / 2;
            this._halfHeight = parentUi.height / 2;
        }
        // 从屏幕底部发射
        this._spawnY = -this._halfHeight;
    }

    scheduleCreateWave(): void {
        if (this._waveScheduled) return;
        this._waveScheduled = true;
        const delay = random(TIMING.WAVE_DELAY_MIN, TIMING.WAVE_DELAY_MAX);
        this.scheduleOnce(() => {
            this._waveScheduled = false;
            this.createFruitList();
        }, delay);
    }

    createFruitList(): void {
        const count = Math.floor(random(WAVE.COUNT_MIN, WAVE.COUNT_MAX + 0.4));
        const pattern = this.pickPattern();
        const targets = this.computeTargets(count, pattern);
        const bombIndices = this.pickBombSlots(count);

        for (let i = 0; i < count; i++) {
            const isBomb = bombIndices.has(i);
            const configs = isBomb ? this.fruitConfigs : this.noBombConfigs;
            const idx = Math.floor(random(0, configs.length - 0.1));
            const cfg = configs[idx];

            const stagger = random(TIMING.STAGGER_MIN, TIMING.STAGGER_MAX) * i;
            this.scheduleOnce(() => {
                this.spawnFruit(cfg, targets[i]);
            }, stagger);
        }
    }

    // ---- 投掷模式 ----
    private pickPattern(): WavePattern {
        const r = random(0, 3);
        if (r < 1) return 'fan';
        if (r < 2) return 'arc';
        return 'random';
    }

    /**
     * 为每个水果计算 (spawnX, targetX)
     * spawnX 随机散布在底部，targetX 由模式决定
     */
    private computeTargets(count: number, pattern: WavePattern): { spawnX: number; targetX: number }[] {
        const result: { spawnX: number; targetX: number }[] = [];

        if (pattern === 'fan') {
            // 扇面：从同一个发射区域向外扩散到不同落点
            const centerX = random(-this._halfWidth * 0.5, this._halfWidth * 0.5);
            const fanStart = -this._halfWidth + THROW.SPREAD_MARGIN;
            const fanEnd = this._halfWidth - THROW.SPREAD_MARGIN;
            for (let i = 0; i < count; i++) {
                const spreadOffset = random(-50, 50); // 发射点附近小范围偏移
                const targetX = fanStart + (fanEnd - fanStart) * (i / Math.max(count - 1, 1)) + random(-40, 40);
                result.push({ spawnX: centerX + spreadOffset, targetX });
            }
        } else if (pattern === 'arc') {
            // 弧形散布：发射点分散在底部，目标分散在对侧
            for (let i = 0; i < count; i++) {
                const spawnX = random(-this._halfWidth + THROW.SPREAD_MARGIN, this._halfWidth - THROW.SPREAD_MARGIN);
                // 目标点与发射点相反侧
                const targetX = spawnX > 0
                    ? random(-this._halfWidth + THROW.SPREAD_MARGIN, spawnX * 0.3)
                    : random(spawnX * 0.3, this._halfWidth - THROW.SPREAD_MARGIN);
                result.push({ spawnX, targetX });
            }
        } else {
            // 完全随机
            for (let i = 0; i < count; i++) {
                const spawnX = random(-this._halfWidth + THROW.SPREAD_MARGIN, this._halfWidth - THROW.SPREAD_MARGIN);
                const targetX = random(-this._halfWidth + THROW.SPREAD_MARGIN, this._halfWidth - THROW.SPREAD_MARGIN);
                result.push({ spawnX, targetX });
            }
        }
        return result;
    }

    private pickBombSlots(count: number): Set<number> {
        const set = new Set<number>();
        if (count <= 1) return set;
        const maxBombs = Math.min(WAVE.MAX_BOMBS, Math.floor(count / 2));
        if (maxBombs <= 0) return set;
        const bombCount = Math.floor(random(0, maxBombs + 0.5));
        while (set.size < bombCount) {
            set.add(Math.floor(random(0, count - 0.1)));
        }
        // 炸弹不放第一个位置
        set.delete(0);
        return set;
    }

    private spawnFruit(cfg: FruitConfig, target: { spawnX: number; targetX: number }): void {
        const poolName = cfg.name + 'Pool';
        const fruitNode = genNewNode(this._poolMap, poolName, cfg.prefab, this.node);
        if (!fruitNode) return;

        fruitNode.setPosition(target.spawnX, this._spawnY);

        // 根据屏幕高度和重力计算初速度
        // vy = sqrt(2 * g * apexHeight), vx = (targetX - spawnX) / (2 * tRise)
        // 所有速度统一乘 SPEED_SCALE，调这一个参数就能控制整体力度
        const g = Math.abs(PHYSICS.GRAVITY_Y);
        const screenH = this._halfHeight * 2;
        const apexHeight = screenH * random(THROW.APEX_RATIO_MIN, THROW.APEX_RATIO_MAX);
        const tRise = Math.sqrt(2 * apexHeight / g);
        const vy = g * tRise * THROW.SPEED_SCALE;
        const vx = ((target.targetX - target.spawnX) / (2 * tRise)) * THROW.SPEED_SCALE;
        const angVel = (random(-1, 1) > 0 ? 1 : -1) * random(THROW.ANG_VEL_MIN, THROW.ANG_VEL_MAX) * THROW.SPEED_SCALE;

        const fruitComp: any = fruitNode.getComponent('Fruit');
        fruitComp?.init(poolName, cfg.score, this._gameScript, this, this._juiceGroup,
            vx, vy, angVel);

        if (cfg.type === 'bomb') {
            AudioMgr.inst.playOneShot(this.throwBomb);
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
            this._gameScript.updateUI();
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
