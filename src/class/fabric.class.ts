import * as fabric from 'fabric';
import { fileToDataURL, resizeImageSize } from '../utils/image.utils';
import { extractCommonColor } from '../utils/color.utils';

const MAX_SCALE = 10;

type ObjEvents = keyof fabric.ObjectEvents;
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

  public async addBgImage(bgImgPath: File) {
    if (bgImgPath.type.includes('video')) {
      this.renderVideo(bgImgPath);
    } else {
      this.renderImage(bgImgPath);
    }
  }

  renderVideo(file: File) {
    const videoEl = document.createElement('video');
    videoEl.id = 'video1';
    videoEl.src = URL.createObjectURL(file);

    videoEl.onloadedmetadata = () => {
      // 비디오 원본 크기로 설정
      const originalW = videoEl.videoWidth;
      const originalH = videoEl.videoHeight;
      this.videoDuration = videoEl.duration * 1000;

      videoEl.width = originalW;
      videoEl.height = originalH;

      // 크기 조정
      const { width, height } = resizeImageSize(
        originalW,
        originalH,
        this.width,
        this.height
      );

      const fabricVideo = new fabric.FabricImage(videoEl, {
        objectCaching: false,
        width: originalW,
        height: originalH,
        scaleX: width / originalW,
        scaleY: height / originalH,
        selectable: false,
      });

      this.canvas.setDimensions({ width, height });
      this.width = width;
      this.height = height;
      this.canvas.backgroundImage = fabricVideo;
      videoEl.play();
    };

    videoEl.onended = () => videoEl.play();
    videoEl.onerror = () => alert('비디오 로딩에 실패했습니다.');

    const render = () => {
      this.canvas.renderAll();
      fabric.util.requestAnimFrame(render);
    };
    fabric.util.requestAnimFrame(render);
  }

  async renderImage(file: File) {
    const url = await fileToDataURL(file);
    const bg = await fabric.FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    });

    if (!bg) {
      alert('이미지 로딩에 실패했습니다.');
      return;
    }

    const { width, height } = resizeImageSize(
      bg.width,
      bg.height,
      this.width,
      this.height
    );

    this.bgWidth = bg.width;
    this.bgHeight = bg.height;

    this.canvas.setDimensions({ width, height });
    this.width = width;
    this.height = height;
    bg.scaleX = this.width / bg.width;
    bg.scaleY = this.height / bg.height;
    this.canvas.backgroundImage = bg;
    this.canvas.renderAll();

    const pixels = this.canvas
      .getContext()
      .getImageData(0, 0, width, height).data;

    this.defaultTextColor = extractCommonColor(pixels);
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
        console.log('here');
        btn.style.display = 'none';
      } else {
        btn.style.display = 'flex';
      }
    });
  }

  private addEvents() {
    let atvObj: fabric.Object | null = null;
    const canvas = this.canvas;
    this.activeObject = atvObj;

    const showTooltip = this.showTooltip.bind(this);
    const hideTooltip = this.hideTooltip.bind(this);
    const setActiveObj = this.setActiveObject.bind(this);
    const handleObjectMoving = this.handleObjectMoving.bind(this);

    this.canvas.on('object:moving', function (opt) {
      const target = opt.target;
      handleObjectMoving(target);
    });
    this.canvas.on('object:modified', () => {
      this.clearGuidelines(this.canvas);
    });

    this.canvas.on('object:added', function (opt) {
      const target = opt.target;
      setActiveObj(target);
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
      setActiveObj(atvObj);
      canvas.requestRenderAll();
    });

    this.canvas.on('mouse:wheel', function (opt) {
      const active = canvas.getActiveObject();
      setActiveObj(active || null);
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

  renderRctAnchor(ctx: CanvasRenderingContext2D, left: number, top: number) {
    ctx.save(); // 이전 상태 저장
    ctx.fillStyle = '#ffffff'; // 배경색
    ctx.strokeStyle = '#99c0ff'; // 선 색상

    // 사각형 렌더링
    ctx.beginPath();
    ctx.fillRect(left - 4, top - 4, 8, 8); // 배경 채우기
    ctx.strokeRect(left - 4, top - 4, 8, 8); // 테두리 그리기
    ctx.closePath();

    ctx.restore(); // 이전 상태 복원
  }
  renderCircleAnchor(ctx: CanvasRenderingContext2D, left: number, top: number) {
    ctx.beginPath();
    ctx.arc(left, top, 4, 0, Math.PI * 2, false);
    ctx.fillStyle = '#99c0ff';
    ctx.fill();
    ctx.strokeStyle = '#99c0ff';
    ctx.stroke();
  }

  setActiveObject(obj: fabric.Object | null) {
    this.activeObject = obj;
  }

  handleObjectMoving(target: fabric.Object) {
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

    const newGuidelines = [];
    this.clearGuidelines(this.canvas);

    let snapped = false;

    if (Math.abs(left) < snappingDistance) {
      obj.set({ left: 0 });
      if (!this.guidelineExists({ canvas: this.canvas, id: 'vertical-left' })) {
        const line = this.createVerticalGuideline({
          canvas: this.canvas,
          x: 0,
          id: 'vertical-left',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (Math.abs(top) < snappingDistance) {
      obj.set({ top: 0 });
      if (
        !this.guidelineExists({ canvas: this.canvas, id: 'horizontal-top' })
      ) {
        const line = this.createHorizontalGuideline({
          canvas: this.canvas,
          y: 0,
          id: 'horizontal-top',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (Math.abs(right - canvasWidth) < snappingDistance) {
      obj.set({ left: canvasWidth - obj.width * obj.scaleX });
      if (
        !this.guidelineExists({ canvas: this.canvas, id: 'vertical-right' })
      ) {
        const line = this.createVerticalGuideline({
          canvas: this.canvas,
          x: canvasWidth,
          id: 'vertical-right',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (Math.abs(bottom - canvasHeight) < snappingDistance) {
      obj.set({ top: canvasHeight - obj.height * obj.scaleY });
      if (
        !this.guidelineExists({ canvas: this.canvas, id: 'horizontal-bottom' })
      ) {
        const line = this.createHorizontalGuideline({
          canvas: this.canvas,
          y: canvasHeight,
          id: 'horizontal-bottom',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (Math.abs(centerX - canvasWidth / 2) < snappingDistance) {
      obj.set({ left: canvasWidth / 2 - (obj.width * obj.scaleX) / 2 });
      if (
        !this.guidelineExists({ canvas: this.canvas, id: 'vertical-center' })
      ) {
        const line = this.createVerticalGuideline({
          canvas: this.canvas,
          x: canvasWidth / 2,
          id: 'vertical-center',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (Math.abs(centerY - canvasHeight / 2) < snappingDistance) {
      obj.set({ top: canvasHeight / 2 - (obj.height * obj.scaleY) / 2 });
      if (
        !this.guidelineExists({ canvas: this.canvas, id: 'horizontal-center' })
      ) {
        const line = this.createHorizontalGuideline({
          canvas: this.canvas,
          y: canvasHeight / 2,
          id: 'horizontal-center',
        });
        newGuidelines.push(line);
        this.canvas.add(line);
      }
      snapped = true;
    }

    if (!snapped) {
      this.clearGuidelines(this.canvas);
    } else {
      this.guidelines = newGuidelines;
    }

    this.canvas.renderAll();
  }

  createVerticalGuideline({
    canvas,
    x,
    id,
  }: {
    canvas: fabric.Canvas;
    x: number;
    id: string;
  }) {
    return new fabric.Line([x, 0, x, canvas.height], this.guideLineOpt(id));
  }

  createHorizontalGuideline({
    canvas,
    y,
    id,
  }: {
    canvas: fabric.Canvas;
    y: number;
    id: string;
  }) {
    return new fabric.Line([0, y, canvas.width, y], this.guideLineOpt(id));
  }

  guideLineOpt(id: string) {
    return {
      id,
      stroke: 'red',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      // strokeDashArray: [5, 5],
      opacity: 0.8,
    };
  }

  clearGuidelines(canvas: fabric.Canvas) {
    const objects = canvas.getObjects('line') as fabric.Object[];
    objects.forEach((obj) => {
      const id = obj.get('id');
      if ((id && id.startsWith('vertical-')) || id.startsWith('horizontal-')) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  }

  guidelineExists({ canvas, id }: { canvas: fabric.Canvas; id: string }) {
    const objects = canvas.getObjects('line');
    return objects.some((obj) => {
      const objId = obj.get('id');
      return objId === id;
    });
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
