import * as fabric from 'fabric';
import * as Background from '../utils/background.utils';
import * as GuideLine from '../utils/Guideline.utils';
import { extractCommonColor } from '../utils/color.utils';

const MAX_SCALE = 10;

type ObjEvents = keyof fabric.ObjectEvents;

type LayerType = {
  id: string;
  zIndex: number | undefined;
  type: string;
};

type ObjectChangeCallback = (objects: fabric.Object[]) => void;

fabric.Canvas.prototype.updateZIndexes = function () {
  const objects = this.getObjects();
  objects.forEach((obj, index) => {
    addIdTObject(obj);
    obj.zIndex = index;
  });
};
function addIdTObject(object: fabric.Object) {
  if (!object.get('id')) {
    const timestamp = new Date().getTime();
    object.set('id', `${object.type}_${timestamp}`);
  }
}
class FabricCanvas {
  protected canvas!: fabric.Canvas;
  protected width: number;
  protected height: number;
  protected activeObject?: fabric.Object | null;
  protected bgWidth?: number;
  protected bgHeight?: number;
  protected isAdjusted?: boolean;

  protected controlImage?: HTMLImageElement;

  public menuRef: HTMLDivElement | null;

  protected defaultTextColor: string = '#ffffff';

  protected videoDuration?: number = 3000;

  private guidelines?: fabric.Line[];
  private layers: Array<LayerType> = [];
  public selectedLayer?: LayerType;

  private onObjectChangeCallbacks: ObjectChangeCallback[] = [];

  constructor(
    containerId: string,
    width: number,
    height: number,
    menuRef: HTMLDivElement | null
  ) {
    this.width = width;
    this.height = height;
    this.menuRef = menuRef;

    this.canvas = new fabric.Canvas(containerId, {
      width,
      height,
      selection: false,
      backgroundColor: 'white',
    });
    this.cleanCanvas();
    this.addEvents();
  }

  public async addBgImage(file: File) {
    if (file.type.includes('video')) {
      const { width, height, videoDuration } = await Background.renderVideo({
        canvas: this,
        file,
        height: this.height,
        width: this.width,
      });
      this.videoDuration = videoDuration;
      this.width = width;
      this.height = height;
    } else {
      const { width, height, bgHeight, bgWidth } = await Background.renderImage(
        { file, canvas: this, width: this.width, height: this.height }
      );

      this.width = width;
      this.height = height;
      this.bgWidth = bgWidth;
      this.bgHeight = bgHeight;
      const pixels = this.canvas
        .getContext()
        .getImageData(0, 0, width, height).data;
      this.canvas.setDimensions({ width, height });
      this.defaultTextColor = extractCommonColor(pixels);
    }
  }

  hideTooltip() {
    if (this.menuRef !== null) {
      this.menuRef.style.transition = 'all 0.1s';
      this.menuRef.style.transform = 'translateY(100%)';
    }
  }

  showTooltip(obj: fabric.Object) {
    const menu = this.menuRef;
    if (!menu || !obj) return;

    menu.style.transition = 'all 0.1s';
    menu.style.transform = 'translateY(0%)';
    const elements = Array.from(menu.children);

    elements.forEach((el) => {
      const btn = el as HTMLButtonElement;
      const btnType = btn.dataset.type;

      if (obj.type === 'image' && btnType === 'text') {
        btn.style.display = 'none';
      } else {
        btn.style.display = 'flex';
      }
    });
  }

  addObjectChangeListener(callback: ObjectChangeCallback) {
    this.onObjectChangeCallbacks.push(callback);
  }

  removeObjectChangeListener(callback: ObjectChangeCallback) {
    this.onObjectChangeCallbacks = this.onObjectChangeCallbacks.filter(
      (cb) => cb !== callback
    );
  }

  private notifyObjectChange() {
    const objects = this.canvas.getObjects();

    this.onObjectChangeCallbacks.forEach((cb) =>
      cb(
        objects.filter((i) => {
          const id = i.get('id');
          return !id.startsWith('vertical-') && !id.startsWith('horizontal-');
        })
      )
    );
  }

  private addEvents() {
    let atvObj: fabric.Object | null = null;
    const canvas = this.canvas;
    this.activeObject = atvObj;

    const showTooltip = this.showTooltip.bind(this);
    const hideTooltip = this.hideTooltip.bind(this);
    const updateLayers = this.updateLayers.bind(this);

    const handleObjectMoving = this.handleObjectMoving.bind(this);
    const handleObjectSelected = this.handleObjectSelected.bind(this);
    const notifyObjectChange = this.notifyObjectChange.bind(this);

    this.canvas.on('object:added', () => {
      this.updateLayers();
      notifyObjectChange();
    });
    this.canvas.on('object:removed', function () {
      updateLayers();
      notifyObjectChange();
    });

    this.canvas.on('selection:created', function (opt) {
      handleObjectSelected(opt.selected);
    });
    this.canvas.on('selection:updated', function (opt) {
      handleObjectSelected(opt.selected);
    });
    this.canvas.on('selection:cleared', () => (this.selectedLayer = undefined));

    this.canvas.on('object:moving', function (opt) {
      const target = opt.target;
      handleObjectMoving(target);
    });
    this.canvas.on('object:modified', () => {
      GuideLine.clearGuidelines(this);
      updateLayers();
      this.notifyObjectChange();
    });

    this.canvas.on('object:added', function (opt) {
      const target = opt.target;
      showTooltip(target);
    });
    this.canvas.on('mouse:down', function (opt) {
      const target = opt.target;
      const hideMenuEvents: ObjEvents[] = ['deselected'];

      hideMenuEvents.forEach((eventName) => {
        target?.on(eventName, () => {
          hideTooltip();
        });
      });

      const showMenuEvents: ObjEvents[] = ['selected', 'dragleave', 'modified'];
      showMenuEvents.forEach((eventName) => {
        target?.on(eventName, function () {
          showTooltip(target);
        });
      });

      if (target) {
        canvas.setActiveObject(target);
        atvObj = target;

        let lastGoodTop = 0;
        let lastGoodLeft = 0;
        target.on('scaling', function () {
          const target = canvas.getActiveObject();
          if (target) {
            if (target.scaleX > MAX_SCALE) {
              target.scaleX = MAX_SCALE;
              target.scaleY = MAX_SCALE;
              target.left = lastGoodLeft;
              target.top = lastGoodTop;
            }
            lastGoodTop = target.top;
            lastGoodLeft = target.left;
          }
        });
      }
      canvas.requestRenderAll();
    });

    this.canvas.on('mouse:wheel', function (opt) {
      const active = canvas.getActiveObject();
      if (opt.e.ctrlKey && active) {
        const delta = opt.e.deltaY;
        let scale = active.scaleX || 1; // 현재 스케일 가져오기
        scale *= 0.999 ** delta; // 스케일 계산

        const pointer = canvas.getScenePoint(opt.e);
        const transform = canvas.viewportTransform; // 뷰포트 변환 정보
        const point = {
          x: (pointer.x - transform[4]) / transform[0], // 뷰포트의 X 보정
          y: (pointer.y - transform[5]) / transform[3], // 뷰포트의 Y 보정
        };

        // 객체 중심 이동
        active.set({
          originX: 'center',
          originY: 'center',
          left: point.x,
          top: point.y,
        });

        active.scale(scale > MAX_SCALE ? MAX_SCALE : scale);
        canvas.requestRenderAll();
      }
      opt.e.preventDefault();
      opt.e.stopPropagation();

      if (active) {
        active.on('scaling', function () {
          active.scaleY = active.scaleX;
          active.setCoords(); // 좌표 업데이트
          canvas.requestRenderAll();
        });
      }
    });
  }

  private handleObjectMoving(target: fabric.Object) {
    const canvasWidth = this.width;
    const canvasHeight = this.height;

    if (!target) return;
    const obj = target;

    const snappingDistance = 10;

    const left = obj.left || 0;
    const top = obj.top || 0;
    const right = left + obj.width! * obj.scaleX!;
    const bottom = top + obj.height! * obj.scaleY!;

    const centerX = left + (obj.width * obj.scaleX) / 2;
    const centerY = top + (obj.height * obj.scaleY) / 2;

    const newGuidelines: fabric.Line[] = [];
    GuideLine.clearGuidelines(this);

    let snapped = false;

    const snapPoints = [
      {
        condition: Math.abs(left) < snappingDistance,
        set: { left: 0 },
        id: 'vertical-left',
        createLine: () =>
          GuideLine.createVerticalGuideline({
            canvas: this.canvas,
            x: 0,
            id: 'vertical-left',
          }),
      },
      {
        condition: Math.abs(top) < snappingDistance,
        set: { top: 0 },
        id: 'horizontal-top',
        createLine: () =>
          GuideLine.createHorizontalGuideline({
            canvas: this.canvas,
            y: 0,
            id: 'horizontal-top',
          }),
      },
      {
        condition: Math.abs(right - canvasWidth) < snappingDistance,
        set: { left: canvasWidth - obj.width * obj.scaleX },
        id: 'vertical-right',
        createLine: () =>
          GuideLine.createVerticalGuideline({
            canvas: this.canvas,
            x: canvasWidth,
            id: 'vertical-right',
          }),
      },
      {
        condition: Math.abs(bottom - canvasHeight) < snappingDistance,
        set: { top: canvasHeight - obj.height * obj.scaleY },
        id: 'horizontal-bottom',
        createLine: () =>
          GuideLine.createHorizontalGuideline({
            canvas: this.canvas,
            y: canvasHeight,
            id: 'horizontal-bottom',
          }),
      },
      {
        condition: Math.abs(centerX - canvasWidth / 2) < snappingDistance,
        set: { left: canvasWidth / 2 - (obj.width * obj.scaleX) / 2 },
        id: 'vertical-center',
        createLine: () =>
          GuideLine.createVerticalGuideline({
            canvas: this.canvas,
            x: canvasWidth / 2,
            id: 'vertical-center',
          }),
      },
      {
        condition: Math.abs(centerY - canvasHeight / 2) < snappingDistance,
        set: { top: canvasHeight / 2 - (obj.height * obj.scaleY) / 2 },
        id: 'horizontal-center',
        createLine: () =>
          GuideLine.createHorizontalGuideline({
            canvas: this.canvas,
            y: canvasHeight / 2,
            id: 'horizontal-center',
          }),
      },
    ];

    snapPoints.forEach(({ condition, set, id, createLine }) => {
      if (condition) {
        obj.set(set);
        if (!GuideLine.guidelineExists({ canvas: this, id })) {
          const line = createLine();
          newGuidelines.push(line);
          this.canvas.add(line);
        }
        snapped = true;
      }
    });

    if (!snapped) {
      GuideLine.clearGuidelines(this);
    } else {
      this.guidelines = newGuidelines;
    }

    this.canvas.renderAll();
  }

  deleteObject() {
    if (!this.activeObject) return;
    this.canvas.remove(this.activeObject);
    this.hideTooltip();
    this.activeObject = null;
  }

  getCanvas() {
    return this.canvas;
  }

  getCanvasSize() {
    return { width: this.width, height: this.height };
  }

  getLayers() {
    return this.layers;
  }

  updateLayers() {
    if (this.canvas) {
      this.canvas.updateZIndexes();
      const objects = this.canvas
        .getObjects()
        .filter(
          (obj) =>
            !obj.get('id').startsWith('vertical-') ||
            obj.get('id').startsWith('horizontal-')
        )
        .map((obj) => ({
          id: obj.get('id'),
          zIndex: obj?.zIndex,
          type: obj.type,
        }));
      this.layers = [...objects].reverse();
    }
  }

  handleObjectSelected(
    e: fabric.FabricObject<
      Partial<fabric.FabricObjectProps>,
      fabric.SerializedObjectProps,
      fabric.ObjectEvents
    >[]
  ) {
    const selectedObject = e ? e[0] : null;
    if (selectedObject) {
      this.selectedLayer = selectedObject.get('id');
    } else {
      this.selectedLayer = undefined;
    }
  }

  async getImageDataUrl(format: string): Promise<string | null> {
    this.canvas.discardActiveObject();

    if (format.includes('image')) {
      if (this.bgWidth && this.bgHeight && !this.isAdjusted) {
        const wScale = this.bgWidth / this.width;
        const hScale = this.bgHeight / this.height;

        // 배경 이미지 크기 조정
        const bgImage = this.canvas.backgroundImage;
        if (bgImage) {
          bgImage.set({
            scaleX: bgImage.scaleX * wScale,
            scaleY: bgImage.scaleY * hScale,
          });
        }

        // 모든 객체 크기 조정
        this.canvas.getObjects().forEach((obj) => {
          obj.set({
            left: obj.left * wScale,
            top: obj.top * hScale,
            scaleX: obj.scaleX * wScale,
            scaleY: obj.scaleY * hScale,
          });
        });

        this.isAdjusted = true;
      }

      this.canvas.renderAll();

      // PNG 이미지로 저장
      return this.canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        width: this.bgWidth || this.canvas.width,
        height: this.bgHeight || this.canvas.height,
      });
    } else if (format.includes('video')) {
      return new Promise((resolve) => {
        // 비디오 녹화 시작
        const stream = this.canvas.getElement().captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm',
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: format });

          // Blob을 Base64로 변환
          const reader = new FileReader();
          reader.readAsDataURL(blob);

          reader.onloadend = () => {
            const base64Video = reader.result as string; // Base64 문자열 변환
            resolve(base64Video);
          };
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), this.videoDuration);
      });
    }

    return null; // 다른 경우 null 반환
  }

  private cleanCanvas() {
    this.hideTooltip();
    this.bgWidth = undefined;
    this.bgHeight = undefined;
    this.controlImage = undefined;
  }
}

export default FabricCanvas;
