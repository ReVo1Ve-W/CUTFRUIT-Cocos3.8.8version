import { _decorator, Component, Node, Sprite, SpriteFrame, Color, Vec3, UITransform } from 'cc';

const { ccclass, property } = _decorator;

const MAX_SEGMENTS = 50;
const DEFAULT_TEX_SIZE = 20;
const INITIAL_ALPHA = 200;

interface TrailSegment {
    position: Vec3;
    node: Node;
    sprite: Sprite;
    elapsed: number;
}

@ccclass('MotionTrail')
export class MotionTrail extends Component {
    @property({ type: SpriteFrame }) trailTexture: SpriteFrame | null = null;
    @property fadeTime: number = 0.15;
    @property stroke: number = 6;
    @property minDistance: number = 5;

    private _segments: TrailSegment[] = [];
    private _isActive: boolean = false;
    private _hasEverCreatedSegment: boolean = false;
    private _lastPos: Vec3 = new Vec3();

    reset(): void {
        this._isActive = true;
        this._hasEverCreatedSegment = false;
        this._lastPos = this.node.getPosition().clone();
        this._clearTrails();
    }

    stop(): void {
        this._isActive = false;
        this._clearTrails();
    }

    update(dt: number): void {
        if (!this._isActive) return;

        const currentPos = this.node.getPosition();
        if (Vec3.distance(currentPos, this._lastPos) > this.minDistance) {
            this._addTrailPoint(currentPos.clone());
            this._lastPos = currentPos.clone();
        }

        for (let i = this._segments.length - 1; i >= 0; i--) {
            const seg = this._segments[i];
            seg.elapsed += dt;
            if (seg.elapsed >= this.fadeTime) {
                this._removeTrailAt(i);
            } else {
                const c = seg.sprite.color.clone();
                c.a = Math.floor(255 * (1 - seg.elapsed / this.fadeTime));
                seg.sprite.color = c;
            }
        }

        if (this._segments.length === 0 && this._hasEverCreatedSegment) {
            this._isActive = false;
        }
    }

    private _addTrailPoint(pos: Vec3): void {
        if (!this.trailTexture) return;
        if (this._segments.length >= MAX_SEGMENTS) {
            this._removeTrailAt(0);
        }

        const trailNode = new Node('trailSegment');
        trailNode.parent = this.node.parent;
        trailNode.setPosition(pos);
        trailNode.layer = this.node.layer;

        const uiTransform = trailNode.addComponent(UITransform);
        const texW = this.trailTexture.originalSize?.width ?? DEFAULT_TEX_SIZE;
        const texH = this.trailTexture.originalSize?.height ?? DEFAULT_TEX_SIZE;
        uiTransform.setContentSize(texW, texH);

        const sprite = trailNode.addComponent(Sprite);
        sprite.spriteFrame = this.trailTexture;
        sprite.color = new Color(255, 255, 255, INITIAL_ALPHA);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        this._segments.push({ position: pos, node: trailNode, sprite, elapsed: 0 });
        this._hasEverCreatedSegment = true;
    }

    private _removeTrailAt(index: number): void {
        const seg = this._segments[index];
        if (!seg) return;
        if (seg.node?.isValid) {
            seg.node.destroy();
        }
        this._segments.splice(index, 1);
    }

    private _clearTrails(): void {
        for (const seg of this._segments) {
            if (seg.node?.isValid) {
                seg.node.destroy();
            }
        }
        this._segments = [];
    }

    onDestroy(): void {
        this._clearTrails();
    }
}
