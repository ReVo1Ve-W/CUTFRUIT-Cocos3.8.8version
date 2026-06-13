import { _decorator, Component, Node, AudioClip, tween, Vec3, UITransform, EventTouch, director } from 'cc';
import { TIMING } from './Constants';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {
    @property(Node) knife: Node = null!;
    @property(Node) btnBeginCir: Node = null!;
    @property(Node) btnQuitCir: Node = null!;
    @property(Node) btnBeginfR: Node = null!;
    @property(Node) btnQuitfR: Node = null!;
    @property(AudioClip) buttonClip: AudioClip = null!;

    private knifeMotionT: any = null;

    onLoad(): void {
        director.preloadScene('Menu-001');
        this.knifeMotionT = this.knife.getComponent('MotionTrail');
    }

    start(): void {
        this.registerTouchEvents();
        this.startCircleRotation();
    }

    registerTouchEvents(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch): void {
        const { x, y } = event.getUILocation();
        const uiTransform = this.knife.parent?.getComponent(UITransform);
        if (uiTransform) {
            const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(x, y, 0));
            this.knife.setPosition(localPos.x, localPos.y);
        } else {
            this.knife.setPosition(x, y);
        }
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
        if (this.knifeMotionT?.reset) this.knifeMotionT.reset();
    }

    startCircleRotation(): void {
        const createRotate = (angle: number) =>
            tween().by(TIMING.ROTATE_DURATION, { angle }).repeatForever();

        tween(this.btnBeginCir).then(createRotate(360)).start();
        tween(this.btnQuitCir).then(createRotate(360)).start();
        tween(this.btnBeginfR).then(createRotate(-360)).start();
        tween(this.btnQuitfR).then(createRotate(-360)).start();
    }

    backList(): void {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Detail');
    }

    gameStart(): void {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Menu-001');
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}
