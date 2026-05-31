import { _decorator, Component, Node, AudioClip, tween, EventTouch, director } from 'cc';
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

    onLoad() {
        director.preloadScene('Game');
        this.knifeMotionT = this.knife.getComponent('MotionTrail');
    }

    start() {
        this.knifeMove();
        this.circleRotate();
    }

    knifeMove() {
        this.node.on(Node.EventType.TOUCH_START, this.startEvent, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.moveEvent, this);
        this.node.on(Node.EventType.TOUCH_END, this.endEvent, this);
    }

    startEvent(e: EventTouch) {
        let uiPos = e.getUILocation();
        this.knife.setPosition(uiPos.x, uiPos.y);
        if (this.knifeMotionT?.reset) this.knifeMotionT.reset();
    }

    moveEvent(e: EventTouch) {
        let uiPos = e.getUILocation();
        this.knife.setPosition(uiPos.x, uiPos.y);
    }

    endEvent(_e: EventTouch) {
        if (this.knifeMotionT?.reset) this.knifeMotionT.reset();
    }

    circleRotate() {
        const createRote = (angle: number) =>
            tween().by(TIMING.ROTATE_DURATION, { angle }).repeatForever();

        tween(this.btnBeginCir).then(createRote(360)).start();
        tween(this.btnQuitCir).then(createRote(360)).start();
        tween(this.btnBeginfR).then(createRote(-360)).start();
        tween(this.btnQuitfR).then(createRote(-360)).start();
    }

    backList() {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Detail');
    }

    gameStart() {
        AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Game');
    }
}
