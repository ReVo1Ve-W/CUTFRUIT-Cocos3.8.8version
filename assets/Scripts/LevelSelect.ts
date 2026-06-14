import { _decorator, Component, AudioClip, director } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

@ccclass('LevelSelect')
export class LevelSelect extends Component {
    @property(AudioClip) buttonClip: AudioClip = null!;

    onLoad(): void {
        // 预加载三个游戏场景
        director.preloadScene('Game-001');
        director.preloadScene('Game-002');
        director.preloadScene('Game-003');
    }

    startGame0(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        AudioMgr.inst.stopBGM();
        director.loadScene('Game-001');
    }

    startGame1(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        AudioMgr.inst.stopBGM();
        director.loadScene('Game-002');
    }

    startGame2(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        AudioMgr.inst.stopBGM();
        director.loadScene('Game-003');
    }

    returnMenu(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        director.loadScene('Menu');
    }
}
