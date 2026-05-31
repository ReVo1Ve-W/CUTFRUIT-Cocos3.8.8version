import { _decorator, Component, Node, Sprite, SpriteFrame, Color, Vec3, UITransform, warn } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 模拟 Cocos Creator 2.x MotionStreak 的刀光拖尾组件。
 * 在 knife 节点上挂载此组件，配合触摸移动产生拖尾效果。
 *
 * 用法:
 * 1. 创建一个子节点作为拖尾渲染节点，挂载 Sprite 组件
 * 2. 指定 trailTexture 为 knife.png
 * 3. 在父节点的触摸事件中调用 motionTrail.reset() 和更新位置
 */
@ccclass('MotionTrail')
export class MotionTrail extends Component {
    @property({ type: SpriteFrame }) trailTexture: SpriteFrame | null = null;
    @property fadeTime: number = 0.15;
    @property stroke: number = 6;
    @property minDistance: number = 5;

    private _positions: Vec3[] = [];
    private _trailNodes: Node[] = [];
    private _trailSprites: Sprite[] = [];
    private _elapsedTimes: number[] = [];
    private _isActive: boolean = false;
    private _lastPos: Vec3 = new Vec3();

    reset() {
        this._isActive = true;
        this._positions = [];
        this._lastPos = this.node.getPosition().clone();
        this._clearTrails();
    }

    update(dt: number) {
        if (!this._isActive) return;

        let currentPos = this.node.getPosition();
        if (Vec3.distance(currentPos, this._lastPos) > this.minDistance) {
            this._addTrailPoint(currentPos.clone());
            this._lastPos = currentPos.clone();
        }

        // 更新已有拖尾的衰减
        for (let i = this._elapsedTimes.length - 1; i >= 0; i--) {
            this._elapsedTimes[i] += dt;
            if (this._elapsedTimes[i] >= this.fadeTime) {
                this._removeTrailAt(i);
            } else {
                let progress = this._elapsedTimes[i] / this.fadeTime;
                let sprite = this._trailSprites[i];
                if (sprite) {
                    let c = sprite.color.clone();
                    c.a = Math.floor(255 * (1 - progress));
                    sprite.color = c;
                }
            }
        }

        // 停止后逐步清除
        if (this._positions.length === 0 && this._trailNodes.length === 0) {
            this._isActive = false;
        }
    }

    private _addTrailPoint(pos: Vec3) {
        if (!this.trailTexture) return;
        if (this._trailNodes.length >= 50) {
            this._removeTrailAt(0);
        }

        let trailNode = new Node('trailSegment');
        trailNode.parent = this.node.parent;
        trailNode.setPosition(pos);
        trailNode.layer = this.node.layer;

        let uiTransform = trailNode.addComponent(UITransform);
        let texW = this.trailTexture.originalSize ? this.trailTexture.originalSize.width : 20;
        let texH = this.trailTexture.originalSize ? this.trailTexture.originalSize.height : 20;
        uiTransform.setContentSize(texW, texH);

        let sprite = trailNode.addComponent(Sprite);
        sprite.spriteFrame = this.trailTexture;
        sprite.color = new Color(255, 255, 255, 200);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        this._positions.push(pos);
        this._trailNodes.push(trailNode);
        this._trailSprites.push(sprite);
        this._elapsedTimes.push(0);
    }

    private _removeTrailAt(index: number) {
        if (index < 0 || index >= this._trailNodes.length) return;
        let node = this._trailNodes[index];
        if (node && node.isValid) {
            node.destroy();
        }
        this._positions.splice(index, 1);
        this._trailNodes.splice(index, 1);
        this._trailSprites.splice(index, 1);
        this._elapsedTimes.splice(index, 1);
    }

    private _clearTrails() {
        for (let node of this._trailNodes) {
            if (node && node.isValid) {
                node.destroy();
            }
        }
        this._positions = [];
        this._trailNodes = [];
        this._trailSprites = [];
        this._elapsedTimes = [];
    }

    onDestroy() {
        this._clearTrails();
    }
}
