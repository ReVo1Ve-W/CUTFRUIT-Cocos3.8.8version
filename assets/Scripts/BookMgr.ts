import { _decorator, Component, AudioClip, director } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('BookMgr')
export class BookMgr extends Component {
    @property(AudioClip) buttonClip: AudioClip = null!;

    toBook(): void {
        if (this.buttonClip) {
            AudioMgr.inst.playOneShot(this.buttonClip);
        }
        director.loadScene('Book');
    }
}
