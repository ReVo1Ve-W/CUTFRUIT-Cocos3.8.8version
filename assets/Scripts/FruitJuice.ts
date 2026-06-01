import { _decorator, Component, Node, Color, tween, UIOpacity } from 'cc';
import { TIMING } from './Constants';

const { ccclass, property } = _decorator;

@ccclass('FruitJuice')
export class FruitJuice extends Component {
    @property(Node) juiceSprite: Node = null!;

    private _parentGroup: any = null;

    onLoad(): void {
        this._parentGroup = this.node.parent?.getComponent('JuiceGroup');
    }

    init(rotation: number, color: Color, initialOpacity: number): void {
        this.node.angle = rotation;
        (this.juiceSprite as any).color = color;

        let uiOpacity = this.juiceSprite.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = this.juiceSprite.addComponent(UIOpacity);
        }
        uiOpacity.opacity = initialOpacity;

        tween(uiOpacity)
            .to(TIMING.JUICE_FADE_DURATION, { opacity: 0 })
            .call(() => {
                if (this._parentGroup && this.node?.isValid) {
                    this._parentGroup.backNode(this.node);
                }
            })
            .start();
    }
}
