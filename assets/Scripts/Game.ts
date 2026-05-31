import { _decorator, Component, Node, AudioClip, Label, tween, Vec3, director, sys } from 'cc';
import { TIMING, SCORE } from './Constants';
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
    // 不需要在编辑器绑定，onLoad 里自动找
    @property(Node) gameOverMask: Node = null!;
    @property(Label) bestScoreLabel: Label = null!;
    @property(AudioClip) buttonClip: AudioClip = null!;

    private fruitGroup: any = null;

    private knifeMotionT: any = null;
    private isGameOver: boolean = false;
    private score: number = 0;
    private bestScore: number = 0;
    private life: number = 0;

    onLoad() {
        this.knifeMotionT = this.knife.getComponent('MotionTrail');
        // 自动找 fruitGroup，不需要编辑器绑定
        let fgNode = this.node.getChildByName('fruitGroup');
        if (fgNode) {
            this.fruitGroup = fgNode.getComponent('FruitGroup');
        }
    }

    start() {
        this.knifeMove();
        this.init();
    }

    init() {
        this.isGameOver = false;
        this.score = 0;
        this.bestScore = 0;
        let max = sys.localStorage.getItem("Best score");
        if (max) {
            this.bestScore = parseInt(max);
            this.bestScoreLabel.string = "最佳分数 : " + this.bestScore;
        }
        this.life = 0;
        this.lifeIcons.forEach((a) => {
            a.lifeConsume.active = false;
        });
        this.upDateUi();
        if (this.fruitGroup) {
            this.fruitGroup.createFruitList();
        }
    }

    knifeMove() {
        this.node.on(Node.EventType.TOUCH_START, this.startEvent, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.moveEvent, this);
        this.node.on(Node.EventType.TOUCH_END, this.endEvent, this);
    }

    startEvent(event: any) {
        let uiPos = event.getUILocation();
        this.knife.setPosition(uiPos.x, uiPos.y);
        const knifeCol = this.knife.getComponent('BoxCollider2D') as any;
        if (knifeCol) knifeCol.enabled = true;
        if (this.knifeMotionT?.reset) this.knifeMotionT.reset();
    }

    moveEvent(event: any) {
        let uiPos = event.getUILocation();
        this.knife.setPosition(uiPos.x, uiPos.y);
    }

    endEvent(_event: any) {
        const knifeCol = this.knife.getComponent('BoxCollider2D') as any;
        if (knifeCol) knifeCol.enabled = false;
    }

    updateScore(isHit: boolean, score: number) {
        if (this.isGameOver) return;
        if (isHit) {
            this.score += score;
        } else {
            let penalty = score * SCORE.PENALTY_MULTIPLIER;
            if (this.score <= penalty) {
                this.loseLife();
                this.score = 0;
            } else {
                this.score -= penalty;
            }
        }
        this.upDateUi();
    }

    loseLife() {
        this.life++;
        if (this.life >= SCORE.MAX_LIVES) this.gameOverHandle();
    }

    upDateUi() {
        this.scoreLabel.string = "分数 : " + this.score;
        for (let i = 0; i < this.life; i++) {
            if (this.lifeIcons[i]) {
                this.lifeIcons[i].lifeConsume.active = true;
            }
        }
    }

    gameOverHandle() {
        this.isGameOver = true;
        const knifeCol = this.knife.getComponent('BoxCollider2D') as any;
        if (knifeCol) knifeCol.enabled = false;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreLabel.string = '最佳分数 : ' + this.bestScore;
            sys.localStorage.setItem("Best score", this.bestScore.toString());
        }
        this.scheduleOnce(() => {
            this.showTheGameOverMask(true);
        }, TIMING.GAME_OVER_DELAY);
    }

    returnMenu() {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Menu');
    }

    restartGame() {
        AudioMgr.inst.playOneShot(this.buttonClip);
        this.showTheGameOverMask(false);
        this.init();
    }

    showTheGameOverMask(show: boolean) {
        if (show) {
            this.gameOverMask.active = true;
            this.gameOverMask.setScale(0.95, 0.95, 1);
            tween(this.gameOverMask)
                .to(TIMING.GAME_OVER_TWEEN, { scale: new Vec3(1, 1, 1) })
                .start();
        } else {
            tween(this.gameOverMask)
                .to(TIMING.FADE_OUT_TWEEN, { scale: new Vec3(0.01, 0.01, 1) })
                .call(() => {
                    this.gameOverMask.active = false;
                })
                .start();
        }
    }
}
