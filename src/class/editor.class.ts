import * as fabric from 'fabric';
import FabricCanvas from './fabric.class';
import { hexToRgba } from '../utils/color.utils';
import * as Anchor from '../utils/anchor.utils';

class TextCanvas extends FabricCanvas {
  public addText({ content, font }: { content?: string; font: string }) {
    const shadow = new fabric.Shadow({
      color: 'rgba(10,10,10,0.5)',
      blur: 3,
      offsetX: 1,
      offsetY: 1,
    });
    const text = new fabric.IText(content || 'hello', {
      fontSize: 30,
      left: 100,
      top: 100,
      editable: true,
      fontFamily: font,
      fontWeight: '300',
      lockScalingFlip: true,
      lockSkewingX: true,
      lockSkewingY: true,
      centeredRotation: true,
      minScaleLimit: 1,
      centeredScaling: true,
      fill: this.defaultTextColor,
      shadow,
    });

    this.setTextControl(text);

    let mouseDownTime = 0;
    text.on('mousedown', () => {
      mouseDownTime = Date.now();
    });

    text.on('mouseup', () => {
      const mouseUpTime = Date.now();
      const timeDifference = mouseUpTime - mouseDownTime;
      if (timeDifference >= 800) {
        // 0.8초 이상인 경우
        text.enterEditing(); // 텍스트 편집 모드 진입
        this.canvas.renderAll(); // 캔버스 갱신
      }
    });

    this.canvas.add(text);
    this.canvas.setActiveObject(text);
  }

  async addObject(objectPath: string, objectScale: number = 0.3) {
    const object = await fabric.FabricImage.fromURL(objectPath, {
      crossOrigin: 'anonymous',
    });
    const shadow = new fabric.Shadow({
      color: 'rgba(10,10,10,0.5)',
      blur: 3,
      offsetX: 1,
      offsetY: 1,
    });

    object.lockScalingFlip = true;
    object.lockScalingFlip = true;
    object.lockSkewingX = true;
    object.lockSkewingY = true;
    object.centeredRotation = true;
    object.minScaleLimit = 0.3;
    object.centeredScaling = true;
    object.shadow = shadow;

    const centerX = this.canvas.getWidth() / 2;
    const centerY = this.canvas.getHeight() / 2;

    const offset = 100;
    const randomOffsetX = (Math.random() * 2 - 1) * offset; // -100 ~ +100
    const randomOffsetY = (Math.random() * 2 - 1) * offset; // -100 ~ +100

    object.top = centerY - (object.height! * objectScale) / 2 + randomOffsetY;
    object.left = centerX - (object.width! * objectScale) / 2 + randomOffsetX;

    this.canvas.setActiveObject(object);

    object.set({ borderColor: '#99c0ff', cornerColor: '#99c0ff' });

    const customControl = {
      bl: new fabric.Control({
        ...object.controls.bl,
        render: Anchor.renderRctAnchor,
      }),
      br: new fabric.Control({
        ...object.controls.br,
        render: Anchor.renderRctAnchor,
      }),
      tl: new fabric.Control({
        ...object.controls.tl,
        render: Anchor.renderRctAnchor,
      }),
      tr: new fabric.Control({
        ...object.controls.tr,
        render: Anchor.renderRctAnchor,
      }),
      mtr: new fabric.Control({
        ...object.controls.mtr,
        offsetY: -15,
        render: Anchor.renderCircleAnchor,
      }),
    };
    object.controls = customControl;
    this.canvas.add(object);
    this.canvas.requestRenderAll();
  }

  setTextControl(textNode: fabric.IText) {
    const text = textNode;
    text.set({ borderColor: '#99c0ff', cornerColor: '#99c0ff' });
    const customControl = {
      bl: new fabric.Control({
        ...text.controls.bl,
        render: Anchor.renderRctAnchor,
      }),
      br: new fabric.Control({
        ...text.controls.br,
        render: Anchor.renderRctAnchor,
      }),
      tl: new fabric.Control({
        ...text.controls.tl,
        render: Anchor.renderRctAnchor,
      }),
      tr: new fabric.Control({
        ...text.controls.tr,
        render: Anchor.renderRctAnchor,
      }),
      mtr: new fabric.Control({
        ...text.controls.mtr,
        offsetY: -15,
        render: Anchor.renderCircleAnchor,
      }),
    };
    text.controls = customControl;
  }

  changeFontStyle(fontName: string) {
    this.updateTextObj('fontFamily', fontName);
  }
  changeFontWeight(weight: number) {
    this.updateTextObj('fontWeight', weight);
  }

  changeTextAlign(align?: string) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'i-text') return;
    const activeText = activeObject as fabric.IText;
    const aligns = ['left', 'center', 'right'];
    const currentAlign = activeText.textAlign;
    const currentIdx = aligns.indexOf(currentAlign);
    const nextIdx = (currentIdx + 1) % aligns.length;
    const nextAlign = align ? align : aligns[nextIdx];

    this.updateTextObj('textAlign', nextAlign);
  }

  changeFontColor(color: string) {
    this.updateTextObj('fill', color);
  }
  addTextBg(color: string) {
    this.updateTextObj('backgroundColor', hexToRgba(color, 0.5));
  }

  removeTextBg() {
    this.updateTextObj('backgroundColor', 'rgba(0,0,0,0)');
  }

  private updateTextObj<K extends keyof fabric.ITextProps>(
    key: string,
    value: fabric.ITextProps[K]
  ) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'i-text') return;
    const activeText = activeObject as fabric.IText;
    activeText.set(key, value);
    this.canvas.requestRenderAll();
  }

  saveTextData() {
    const textObjects = this.canvas
      .getObjects()
      .filter((obj) => obj.type === 'i-text');
    const obj = textObjects.map((obj) => obj.toJSON());
    return JSON.stringify(obj);
  }

  /* 텍스트 수정 기능용 */
  loadTextData(data: fabric.IText[]) {
    if (data.length) {
      try {
        data.forEach((textObj: fabric.IText) => {
          const { text, ...rest } = textObj;
          const iText = new fabric.IText(text, {
            fontWeight: rest?.fontWeight,
            angle: rest?.angle,
            left: rest?.left,
            top: rest?.top,
            fontSize: rest?.fontSize,
            fill: rest?.fill,
            fontFamily: rest?.fontFamily,
            lockScalingFlip: true,
            lockSkewingX: true,
            lockSkewingY: true,
            centeredRotation: true,
            minScaleLimit: 1,
            centeredScaling: true,
          });

          iText.set({
            width: rest.width,
          });
          iText.setCoords();

          this.setTextControl(iText);
          this.canvas.add(iText);
        });
      } catch (e: unknown) {
        alert(
          `저장된 데이터를 받아오는데 실패했습니다. 다시 시도해주세요. ${e}`
        );
      }
    }
  }
}

export default TextCanvas;
