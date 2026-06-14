import { _decorator, Component, AudioClip, director } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('ReturnSetting')
export class ReturnSetting extends Component {
    @property(AudioClip) buttonClip: AudioClip = null!;

    returnSetting(): void {
        if (this.buttonClip) {
            AudioMgr.inst.playOneShot(this.buttonClip);
        }
        director.loadScene('Setting');
    }
}
