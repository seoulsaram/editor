import * as fabric from 'fabric';
import FabricCanvas from './fabric.class';

class TextCanvas extends FabricCanvas {
  public addText({ content, font }: { content?: string; font?: string }) {
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
      fontFamily: font || 'SB Font',
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
        render: this.renderRctAnchor,
      }),
      br: new fabric.Control({
        ...object.controls.br,
        render: this.renderRctAnchor,
      }),
      tl: new fabric.Control({
        ...object.controls.tl,
        render: this.renderRctAnchor,
      }),
      tr: new fabric.Control({
        ...object.controls.tr,
        render: this.renderRctAnchor,
      }),
      mtr: new fabric.Control({
        ...object.controls.mtr,
        offsetY: -15,
        render: this.renderCircleAnchor,
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
        render: this.renderRctAnchor,
      }),
      br: new fabric.Control({
        ...text.controls.br,
        render: this.renderCircleAnchorWithTriangle,
      }),
      tl: new fabric.Control({
        ...text.controls.tl,
        render: this.renderRctAnchor,
      }),
      tr: new fabric.Control({
        ...text.controls.tr,
        render: this.renderRctAnchor,
      }),
      mtr: new fabric.Control({
        ...text.controls.mtr,
        offsetY: -15,
        render: this.renderCircleAnchor,
      }),
    };
    text.controls = customControl;
  }

  changeFontStyle(fontName: string) {
    if (!this.activeObject || this.activeObject.type !== 'i-text') return;
    const activeText = this.activeObject as fabric.IText;
    activeText.set('fontFamily', fontName);
    this.canvas.requestRenderAll();
  }
  changeFontWeight(weight: number) {
    if (!this.activeObject || this.activeObject.type !== 'i-text') return;
    const activeText = this.activeObject as fabric.IText;
    activeText.set('fontWeight', weight);
    this.canvas.requestRenderAll();
  }

  changeTextAlign(align?: string) {
    if (!this.activeObject || this.activeObject.type !== 'i-text') return;
    const activeText = this.activeObject as fabric.IText;

    const aligns = ['left', 'center', 'right'];
    const currentAlign = activeText.textAlign;
    const currentIdx = aligns.indexOf(currentAlign);
    const nextIdx = (currentIdx + 1) % aligns.length;
    const nextAlign = align ? align : aligns[nextIdx];
    activeText.set('textAlign', nextAlign);
    this.canvas.requestRenderAll();
  }

  changeFontColor(color: string) {
    if (!this.activeObject || this.activeObject.type !== 'i-text') return;
    const activeText = this.activeObject as fabric.IText;
    activeText.set('fill', color);
    this.canvas.requestRenderAll();
  }

  setActiveObject(obj: fabric.Object | null) {
    this.activeObject = obj;
  }

  saveTextData() {
    const textObjects = this.canvas
      .getObjects()
      .filter((obj) => obj.type === 'i-text');
    const obj = textObjects.map((obj) => obj.toJSON());
    return JSON.stringify(obj);
  }

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
