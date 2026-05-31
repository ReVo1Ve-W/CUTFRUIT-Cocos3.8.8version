import { _decorator, Component, Node, AudioClip, Animation, RigidBody2D, Collider2D, Contact2DType, IPhysics2DContact, Vec2 } from 'cc';
import { COLLISION_TAG } from './Constants';
import { AudioMgr } from './AudioMgr';
import { random } from './utils';
const { ccclass, property } = _decorator;

@ccclass('Fruit')
export class Fruit extends Component {
    @property(Node) comFruit: Node = null!;
    @property(Node) splitAni: Node = null!;
    @property type: string = 'fruit';
    @property forceHorzMin: number = 0;
    @property forceHorzMax: number = 1000;
    @property forceMin: number = 30000;
    @property forceMax: number = 35000;
    @property colorType: number = 1;
    @property(AudioClip) cutFruitAudio: AudioClip = null!;
    @property(AudioClip) cutBombAudio: AudioClip = null!;

    poolName: string = '';
    score: number = 0;
    isCut: boolean = false;
    ani: Animation | null = null;
    _gameScript: any = null;
    _fruitGroup: any = null;
    _juiceGroup: any = null;
    _pendingCollision: boolean = false;

    onLoad() {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
        if (this.type == 'fruit' && this.splitAni) {
            this.ani = this.splitAni.getComponent(Animation);
        }
    }

    init(poolName: string, score: number, gameScript: any, fruitGroup: any, juiceGroup: any) {
        this.poolName = poolName;
        this.score = score;
        this.isCut = false;
        this._gameScript = gameScript;
        this._fruitGroup = fruitGroup;
        this._juiceGroup = juiceGroup;
        this._pendingCollision = false;

        if (this.type == 'fruit') {
            this.comFruit.active = true;
            this.splitAni.active = false;
            this.recoveryAniFirstFps();
        }

        let rigidBody = this.node.getComponent(RigidBody2D);
        if (rigidBody) {
            let forceY = Math.floor(random(this.forceMin, this.forceMax)),
                forceX = Math.floor(random(this.forceHorzMin, this.forceHorzMax));
            rigidBody.angularVelocity = random(-1, 1) > 0 ? 100 : -100;
            rigidBody.applyForceToCenter(new Vec2(this.node.position.x > 0 ? -forceX : forceX, forceY), true);
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, _contact: IPhysics2DContact | null) {
        if (this._pendingCollision) return;
        let otherTag = otherCollider.tag;

        if (otherTag == COLLISION_TAG.KNIFE) {
            if (!this.isCut) {
                this._pendingCollision = true;
                this.scheduleOnce(() => {
                    this._pendingCollision = false;
                    if (this.type == 'fruit') {
                        if (this._juiceGroup) {
                            this._juiceGroup.createJuiceBg(this.node.getPosition(), this.colorType);
                        }
                        this.playSplitAni();
                        AudioMgr.inst.playOneShot(this.cutFruitAudio);
                        if (this._gameScript) {
                            this._gameScript.updateScore(true, this.score);
                        }
                    } else {
                        if (this._fruitGroup) {
                            this._fruitGroup.cutBombRemoveAllChildren();
                        }
                        AudioMgr.inst.playOneShot(this.cutBombAudio);
                    }
                });
            }
            this.isCut = true;
            return;
        }

        if (otherTag == COLLISION_TAG.FLOOR) {
            this._pendingCollision = true;
            this.scheduleOnce(() => {
                this._pendingCollision = false;
                this.backThisNode();
                if (this._fruitGroup) {
                    this._fruitGroup.checkRemain();
                }
            });
        }
    }

    playSplitAni() {
        this.comFruit.active = false;
        this.splitAni.active = true;
        if (this.ani) {
            this.ani.play();
        }
    }

    recoveryAniFirstFps() {
        if (!this.ani) return;
        let clips = this.ani.clips;
        if (!clips || clips.length === 0) return;
        let state = this.ani.getState(clips[0].name);
        if (!state) return;
        state.time = 0;
        this.ani.sample();
    }

    backThisNode(isBombBack: boolean = false) {
        if (!isBombBack && this.type == 'fruit' && !this.isCut) {
            if (this._gameScript) {
                this._gameScript.updateScore(false, this.score);
            }
        }
        if (this._fruitGroup) {
            this._fruitGroup.recycleNode(this);
        }
    }
}
