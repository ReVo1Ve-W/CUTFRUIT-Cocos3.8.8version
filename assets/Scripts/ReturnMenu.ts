import { _decorator, Component, AudioClip, director } from 'cc';
import { AudioMgr } from './AudioMgr';
const { ccclass, property } = _decorator;

@ccclass('ReturnMenu')
export class ReturnMenu extends Component {
    @property(AudioClip) buttonClip: AudioClip = null!;

    returnMenu() {
        if (this.buttonClip) {
            AudioMgr.inst.playOneShot(this.buttonClip);
        }
        director.loadScene("Menu");
    }
}
