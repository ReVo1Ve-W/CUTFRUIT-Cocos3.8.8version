import { _decorator, Component, AudioSource, AudioClip, Node, director } from 'cc';

export class AudioMgr {
    private static _inst: AudioMgr | null = null;
    private _audioSource: AudioSource | null = null;

    static get inst(): AudioMgr {
        if (!this._inst) this._inst = new AudioMgr();
        return this._inst;
    }

    constructor() {
        const node = new Node('__audioMgr__');
        director.addPersistRootNode(node);
        this._audioSource = node.addComponent(AudioSource);
    }

    playOneShot(clip: AudioClip, volume: number = 1) {
        if (this._audioSource && clip) {
            this._audioSource.playOneShot(clip, volume);
        }
    }
}
