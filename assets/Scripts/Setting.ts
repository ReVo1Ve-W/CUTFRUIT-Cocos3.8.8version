import { _decorator, Component, AudioClip } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('Setting')
export class Setting extends Component {
    @property(AudioClip) bgmClip: AudioClip = null!;

    start(): void {
        if (this.bgmClip) {
            AudioMgr.inst.playBGM(this.bgmClip);
        }
    }

    onDestroy(): void {
        AudioMgr.inst.stopBGM();
    }
}
