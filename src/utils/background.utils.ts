import * as fabric from 'fabric';
import { fileToDataURL, resizeImageSize } from './image.utils';
import FabricCanvas from '../class/fabric.class';

export function renderVideo({
  file,
  canvas,
  width,
  height,
}: {
  file: File;
  canvas: FabricCanvas;
  width: number;
  height: number;
}): Promise<{
  width: number;
  height: number;
  videoDuration: number;
}> {
  return new Promise((resolve, reject) => {
    const videoEl = document.createElement('video');
    videoEl.id = 'video1';
    videoEl.src = URL.createObjectURL(file);

    let newCanvasWidth = 0;
    let newCanvasHeight = 0;
    let videoDuration = 0;

    videoEl.onloadedmetadata = () => {
      // 비디오 원본 크기로 설정
      const originalW = videoEl.videoWidth;
      const originalH = videoEl.videoHeight;
      // this.videoDuration = videoEl.duration * 1000;

      videoEl.width = originalW;
      videoEl.height = originalH;

      // 크기 조정
      const { width: newWidth, height: newHeight } = resizeImageSize(
        originalW,
        originalH,
        width,
        height
      );

      newCanvasWidth = newWidth;
      newCanvasHeight = newHeight;
      videoDuration = videoEl.duration * 1000;

      const fabricVideo = new fabric.FabricImage(videoEl, {
        objectCaching: false,
        width: originalW,
        height: originalH,
        scaleX: newWidth / originalW,
        scaleY: newHeight / originalH,
        selectable: false,
      });

      canvas.getCanvas().setDimensions({ width: newWidth, height: newHeight });
      canvas.getCanvas().backgroundImage = fabricVideo;
      videoEl.play();

      resolve({
        width: newCanvasWidth,
        height: newCanvasHeight,
        videoDuration,
      });
    };

    const render = () => {
      canvas.getCanvas().renderAll();
      fabric.util.requestAnimFrame(render);
    };
    fabric.util.requestAnimFrame(render);

    videoEl.onended = () => videoEl.play();
    videoEl.onerror = () => {
      alert('비디오 로딩에 실패했습니다.');
      reject(new Error('비디오 로딩 실패'));
    };
  });
}

export async function renderImage({
  canvas,
  file,
  width,
  height,
}: {
  canvas: FabricCanvas;
  file: File;
  width: number;
  height: number;
}): Promise<{
  width: number;
  bgWidth: number;
  height: number;
  bgHeight: number;
}> {
  const url = await fileToDataURL(file);
  const bg = await fabric.FabricImage.fromURL(url, {
    crossOrigin: 'anonymous',
  });

  if (!bg) {
    alert('이미지 로딩에 실패했습니다.');
    throw new Error('이미지 로딩 실패');
  }

  const { width: newWidth, height: newHeight } = resizeImageSize(
    bg.width,
    bg.height,
    width,
    height
  );

  canvas.getCanvas().setDimensions({ width: newWidth, height: newHeight });

  bg.scaleX = newWidth / bg.width;
  bg.scaleY = newHeight / bg.height;
  canvas.getCanvas().backgroundImage = bg;
  canvas.getCanvas().renderAll();

  return {
    width: newWidth,
    bgWidth: bg.width,
    height: newHeight,
    bgHeight: bg.height,
  };
}
