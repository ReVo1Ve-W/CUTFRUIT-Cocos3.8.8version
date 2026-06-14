import { _decorator, Component, Label, AudioClip, Node, AudioSource } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('StoryMgr')
export class StoryMgr extends Component {
    @property(Label) textLabel: Label = null!;
    @property({ multiline: true }) fullText: string = '';
    @property({ tooltip: '每秒显示字符数' }) typingSpeed: number = 30;
    @property(AudioClip) typingSound: AudioClip | null = null;

    private static _hasPlayed: boolean = false;

    private _currentIndex: number = 0;
    private _accumulator: number = 0;
    private _isTyping: boolean = false;
    private _audioSource: AudioSource | null = null;

    onLoad(): void {
        this._audioSource = this.node.addComponent(AudioSource);
        this.node.on(Node.EventType.TOUCH_START, this.onTap, this);
    }

    start(): void {
        if (!StoryMgr._hasPlayed) {
            StoryMgr._hasPlayed = true;
            this.reset();
        } else {
            // 从Book等子场景返回时，直接显示完整文本，不重新播放打字机效果
            this.textLabel.string = this.fullText;
        }
    }

    update(deltaTime: number): void {
        if (!this._isTyping) return;

        this._accumulator += deltaTime;
        const interval = 1.0 / this.typingSpeed;

        const charsToAdd = Math.min(
            Math.floor(this._accumulator / interval),
            this.fullText.length - this._currentIndex
        );

        if (charsToAdd > 0) {
            this._accumulator -= charsToAdd * interval;
            this._currentIndex += charsToAdd;

            if (this.textLabel) {
                this.textLabel.string = this.fullText.substring(0, this._currentIndex);
            }
        }

        if (this._currentIndex >= this.fullText.length) {
            this.stopTyping();
        }
    }

    onTap(): void {
        if (this._isTyping) {
            this.showFullText();
        }
    }

    reset(): void {
        this._currentIndex = 0;
        this._accumulator = 0;
        if (this.textLabel) {
            this.textLabel.string = '';
        }
        this._isTyping = this.fullText.length > 0;
        if (this._isTyping) {
            this._playTypingSound();
        }
    }

    showFullText(): void {
        this._currentIndex = this.fullText.length;
        if (this.textLabel) {
            this.textLabel.string = this.fullText;
        }
        this.stopTyping();
    }

    get isTyping(): boolean {
        return this._isTyping;
    }

    private stopTyping(): void {
        this._isTyping = false;
        this._stopTypingSound();
    }

    private _playTypingSound(): void {
        if (this.typingSound && this._audioSource) {
            this._audioSource.clip = this.typingSound;
            this._audioSource.loop = true;
            this._audioSource.volume = 0.3;
            this._audioSource.play();
        }
    }

    private _stopTypingSound(): void {
        if (this._audioSource) {
            this._audioSource.stop();
        }
    }

    onDestroy(): void {
        this.stopTyping();
        this.node.off(Node.EventType.TOUCH_START, this.onTap, this);
    }
}
