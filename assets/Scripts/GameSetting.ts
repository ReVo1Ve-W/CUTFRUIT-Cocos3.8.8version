import { _decorator, Component, Node, Slider, AudioClip, director, sys, EventTouch } from 'cc';
import { AudioMgr } from './AudioMgr';

const { ccclass, property } = _decorator;

const VOLUME_KEY = 'bgm_volume';

@ccclass('GameSetting')
export class GameSetting extends Component {
    @property(Node) settingPanel: Node = null!;
    @property(Slider) volumeSlider: Slider = null!;
    @property(Node) btnPause: Node = null!;
    @property(Node) btnPlay: Node = null!;
    @property(AudioClip) buttonClip: AudioClip = null!;

    onLoad(): void {
        this.settingPanel.active = false;
        const saved = sys.localStorage.getItem(VOLUME_KEY);
        const vol = saved ? parseFloat(saved) : 1;
        AudioMgr.inst.setBGMVolume(vol);
        if (this.volumeSlider) this.volumeSlider.progress = vol;
        this.settingPanel.on(Node.EventType.TOUCH_START, this.onPanelBgClick, this);
    }

    togglePanel(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        this.settingPanel.active = !this.settingPanel.active;
    }

    onPanelBgClick(event: EventTouch): void {
        if (event.target === this.settingPanel) {
            this.settingPanel.active = false;
        }
    }

    onVolumeChanged(slider: Slider): void {
        const vol = slider.progress;
        AudioMgr.inst.setBGMVolume(vol);
        sys.localStorage.setItem(VOLUME_KEY, vol.toString());
    }

    togglePause(): void {
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        const paused = director.isPaused();
        if (paused) {
            director.resume();
        } else {
            director.pause();
        }
        this.updatePauseIcon();
    }

    private updatePauseIcon(): void {
        const paused = director.isPaused();
        if (this.btnPause) this.btnPause.active = !paused;
        if (this.btnPlay) this.btnPlay.active = paused;
    }

    returnMenu(): void {
        if (director.isPaused()) director.resume();
        if (this.buttonClip) AudioMgr.inst.playOneShot(this.buttonClip);
        AudioMgr.inst.stopBGM();
        director.loadScene('Begin');
    }
}
