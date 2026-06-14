import { _decorator, Component, Node, Label, AudioClip, tween, Vec3, Vec2, UITransform, director, sys, PhysicsSystem2D, EventTouch, RigidBody2D, ERigidBody2DType } from 'cc';
import { TIMING, SCORE, PHYSICS } from './Constants';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('LifeIcon')
export class LifeIcon {
    @property(Node) lifeConsume: Node = null!;
}

@ccclass('Game')
export class Game extends Component {
    @property(Node) knife: Node = null!;
    @property(Label) scoreLabel: Label = null!;
    @property([LifeIcon]) lifeIcons: LifeIcon[] = [];
    @property(Node) gameOverMask: Node = null!;
    @property(Label) bestScoreLabel: Label = null!;
    @property(Node) settingPanel: Node = null!;
    @property(AudioClip) buttonClip: AudioClip = null!;
    @property({ tooltip: '难度 1/2/3' }) difficulty: number = 1;

    private fruitGroup: any = null;
    private knifeMotionT: any = null;
    private isGameOver: boolean = false;
    private score: number = 0;
    private bestScore: number = 0;
    private life: number = 0;

    onLoad(): void {
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.gravity = new Vec2(0, PHYSICS.GRAVITY_Y);

        const knifeBody = this.knife.getComponent(RigidBody2D);
        if (!knifeBody) {
            const rb = this.knife.addComponent(RigidBody2D);
            rb.type = ERigidBody2DType.Kinematic;
            rb.gravityScale = 0;
            rb.enabledContactListener = true;
        }

        this.knifeMotionT = this.knife.getComponent('MotionTrail');
        const fgNode = this.node.getChildByName('fruitGroup');
        if (fgNode) {
            this.fruitGroup = fgNode.getComponent('FruitGroup');
        }
    }

    start(): void {
        this.knife.active = false;
        this.setKnifeColliderEnabled(false);
        this.registerTouchEvents();
        this.init();
    }

    init(): void {
        this.isGameOver = false;
        this.score = 0;
        this.bestScore = 0;

        const saved = sys.localStorage.getItem('Best score');
        if (saved) {
            this.bestScore = parseInt(saved);
            this.bestScoreLabel.string = '最佳分数 : ' + this.bestScore;
        }

        this.life = 0;
        this.lifeIcons.forEach(a => { a.lifeConsume.active = false; });
        this.updateUI();
        this.fruitGroup?.setDifficulty?.(this.difficulty);
        this.fruitGroup?.createFruitList();
    }

    registerTouchEvents(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch): void {
        this.knife.active = true;
        const { x, y } = event.getUILocation();
        const uiTransform = this.knife.parent?.getComponent(UITransform);
        if (uiTransform) {
            const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(x, y, 0));
            this.knife.setPosition(localPos.x, localPos.y);
        } else {
            this.knife.setPosition(x, y);
        }
        this.setKnifeColliderEnabled(true);
        if (this.knifeMotionT?.reset) this.knifeMotionT.reset();
    }

    onTouchMove(event: EventTouch): void {
        const { x, y } = event.getUILocation();
        const uiTransform = this.knife.parent?.getComponent(UITransform);
        if (uiTransform) {
            const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(x, y, 0));
            this.knife.setPosition(localPos.x, localPos.y);
        } else {
            this.knife.setPosition(x, y);
        }
    }

    onTouchEnd(_event: EventTouch): void {
        this.setKnifeColliderEnabled(false);
        if (this.knifeMotionT?.stop) this.knifeMotionT.stop();
        this.knife.active = false;
    }

    private setKnifeColliderEnabled(enabled: boolean): void {
        const col = this.knife.getComponent('BoxCollider2D') as any;
        if (col) col.enabled = enabled;
        const rb = this.knife.getComponent(RigidBody2D);
        if (rb) rb.enabled = enabled;
    }

    updateScore(isHit: boolean, score: number): void {
        if (this.isGameOver) return;
        if (isHit) {
            this.score += score;
        } else {
            const penalty = score * SCORE.PENALTY_MULTIPLIER;
            if (this.score <= penalty) {
                this.loseLife();
                this.score = 0;
            } else {
                this.score -= penalty;
            }
        }
        this.updateUI();
    }

    loseLife(): void {
        this.life++;
        if (this.life >= SCORE.MAX_LIVES) {
            this.gameOver();
        }
    }

    updateUI(): void {
        this.scoreLabel.string = '分数 : ' + this.score;
        for (let i = 0; i < this.life; i++) {
            const icon = this.lifeIcons[i];
            if (icon) icon.lifeConsume.active = true;
        }
    }

    gameOver(): void {
        this.isGameOver = true;
        this.setKnifeColliderEnabled(false);

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreLabel.string = '最佳分数 : ' + this.bestScore;
            sys.localStorage.setItem('Best score', this.bestScore.toString());
        }

        this.scheduleOnce(() => {
            this.showGameOverMask(true);
        }, TIMING.GAME_OVER_DELAY);

    }

    returnbegin(): void {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Begin');
    }

    returnMenu(): void {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Menu');
    }

    restartGame(): void {
        AudioMgr.inst.playOneShot(this.buttonClip);
        this.showGameOverMask(false);
        this.init();
    }

    showGameOverMask(show: boolean): void {
        if (show) {
            if (this.settingPanel) this.settingPanel.active = false;
            this.gameOverMask.active = true;
            this.gameOverMask.setScale(0.95, 0.95, 1);
            tween(this.gameOverMask)
                .to(TIMING.GAME_OVER_TWEEN, { scale: new Vec3(1, 1, 1) })
                .start();
        } else {
            tween(this.gameOverMask)
                .to(TIMING.FADE_OUT_TWEEN, { scale: new Vec3(0.01, 0.01, 1) })
                .call(() => { this.gameOverMask.active = false; })
                .start();
        }
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}
