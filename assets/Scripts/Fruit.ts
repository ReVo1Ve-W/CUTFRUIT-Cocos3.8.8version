import { _decorator, Component, Node, AudioClip, Animation, RigidBody2D, Collider2D, Contact2DType, IPhysics2DContact, Vec2 } from 'cc';
import { COLLISION_TAG } from './Constants';
import { AudioMgr } from './AudioMgr';
import { random } from './utils';

const { ccclass, property } = _decorator;

const ANGULAR_VELOCITY = 100;

@ccclass('Fruit')
export class Fruit extends Component {
    @property(Node) comFruit: Node = null!;
    @property(Node) splitAni: Node = null!;
    @property type: string = 'fruit';
    @property forceHorzMin: number = 0;
    @property forceHorzMax: number = 80;
    @property forceMin: number = 300;
    @property forceMax: number = 420;
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
    private _collisionPending: boolean = false;

    onLoad(): void {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
        if (this.type === 'fruit' && this.splitAni) {
            this.ani = this.splitAni.getComponent(Animation);
        }
    }

    init(poolName: string, score: number, gameScript: any, fruitGroup: any, juiceGroup: any): void {
        this.poolName = poolName;
        this.score = score;
        this.isCut = false;
        this._gameScript = gameScript;
        this._fruitGroup = fruitGroup;
        this._juiceGroup = juiceGroup;
        this._collisionPending = false;

        if (this.type === 'fruit') {
            this.comFruit.active = true;
            this.splitAni.active = false;
            this.resetAnimationFrame();
        }

        const rigidBody = this.node.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.enabled = true;
            rigidBody.linearVelocity = new Vec2(0, 0);
            const forceY = Math.floor(random(this.forceMin, this.forceMax));
            const forceX = Math.floor(random(this.forceHorzMin, this.forceHorzMax));
            rigidBody.angularVelocity = random(-1, 1) > 0 ? ANGULAR_VELOCITY : -ANGULAR_VELOCITY;
            rigidBody.applyForceToCenter(new Vec2(this.node.position.x > 0 ? -forceX : forceX, forceY), true);
        }

        const col = this.node.getComponent(Collider2D);
        if (col) col.enabled = true;
    }

    onBeginContact(_selfCollider: Collider2D, otherCollider: Collider2D, _contact: IPhysics2DContact | null): void {
        if (this._collisionPending) return;

        if (otherCollider.tag === COLLISION_TAG.KNIFE) {
            if (!this.isCut) {
                this._collisionPending = true;
                this.scheduleOnce(() => {
                    this._collisionPending = false;
                    if (this.type === 'fruit') {
                        this._juiceGroup?.createJuiceBg(this.node.getPosition(), this.colorType);
                        this.playSplitAnimation();
                        AudioMgr.inst.playOneShot(this.cutFruitAudio);
                        this._gameScript?.updateScore(true, this.score);
                    } else {
                        this._fruitGroup?.cutBombRemoveAllChildren();
                        AudioMgr.inst.playOneShot(this.cutBombAudio);
                    }
                });
            }
            this.isCut = true;
            return;
        }

        if (otherCollider.tag === COLLISION_TAG.FLOOR) {
            this._collisionPending = true;
            this.scheduleOnce(() => {
                this._collisionPending = false;
                this.returnToPool();
                this._fruitGroup?.checkRemain();
            });
        }
    }

    playSplitAnimation(): void {
        this.comFruit.active = false;
        this.splitAni.active = true;
        this.ani?.play();
    }

    resetAnimationFrame(): void {
        if (!this.ani) return;
        const clips = this.ani.clips;
        if (!clips || clips.length === 0) return;
        const state = this.ani.getState(clips[0].name);
        if (!state) return;
        state.time = 0;
        (this.ani as any).sample();
    }

    returnToPool(isBombBack: boolean = false): void {
        if (!isBombBack && this.type === 'fruit' && !this.isCut) {
            this._gameScript?.updateScore(false, this.score);
        }
        this._fruitGroup?.recycleNode(this);
    }
}
