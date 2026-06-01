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

    static destroy(): void {
        if (this._inst) {
            if (this._inst._node?.isValid) {
                this._inst._node.destroy();
            }
            this._inst = null;
        }
    }
}
