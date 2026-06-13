import { _decorator, Component, Node } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass } = _decorator;

@ccclass('BgmMgr')
export class BgmMgr extends Component {

    onLoad(): void {
        this.node.on(Node.EventType.TOUCH_START, this.toggleBGM, this);
    }

    toggleBGM(): void {
        if (AudioMgr.inst.isBGMPlaying) {
            AudioMgr.inst.pauseBGM();
        } else {
            AudioMgr.inst.resumeBGM();
        }
    }

    onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_START, this.toggleBGM, this);
    }
}
