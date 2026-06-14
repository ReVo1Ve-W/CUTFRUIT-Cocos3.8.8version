import { _decorator, Component, AudioSource, AudioClip, Node, director } from 'cc';

export class AudioMgr {
    private static _inst: AudioMgr | null = null;
    private _audioSource: AudioSource | null = null;
    private _node: Node | null = null;

    static get inst(): AudioMgr {
        if (!this._inst) this._inst = new AudioMgr();
        return this._inst;
    }

    constructor() {
        this._node = new Node('__audioMgr__');
        director.addPersistRootNode(this._node);
        this._audioSource = this._node.addComponent(AudioSource);
    }

    playOneShot(clip: AudioClip, volume: number = 1): void {
        if (this._audioSource && clip) {
            this._audioSource.playOneShot(clip, volume);
        }
    }

    playBGM(clip: AudioClip, volume: number = 1): void {
        if (!this._audioSource || !clip) return;
        // 如果相同的BGM正在播放，跳过避免重启
        if (this._audioSource.playing && this._audioSource.clip === clip) return;
        this._audioSource.stop();
        this._audioSource.clip = clip;
        this._audioSource.loop = true;
        this._audioSource.volume = volume;
        this._audioSource.play();
    }

    stopBGM(): void {
        if (this._audioSource) {
            this._audioSource.stop();
        }
    }

    pauseBGM(): void {
        if (this._audioSource && this._audioSource.playing) {
            this._audioSource.pause();
        }
    }

    resumeBGM(): void {
        if (this._audioSource && this._audioSource.clip) {
            this._audioSource.play();
        }
    }

    get isBGMPlaying(): boolean {
        return this._audioSource?.playing ?? false;
    }

    setBGMVolume(volume: number): void {
        if (this._audioSource) {
            this._audioSource.volume = Math.max(0, Math.min(1, volume));
        }
    }

    getBGMVolume(): number {
        return this._audioSource?.volume ?? 1;
    }

    static destroy(): void {
        if (this._inst) {
            if (this._inst._node?.isValid) {
                this._inst._node.destroy();
            }
            this._inst = null;
        }
    }
}
