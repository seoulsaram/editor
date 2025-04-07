import * as fabric from 'fabric';
import FabricCanvas from '../class/fabric.class';

export function guidelineExists({
  canvas,
  id,
}: {
  canvas: FabricCanvas;
  id: string;
}) {
  const objects = canvas.getCanvas().getObjects('line');
  return objects.some((obj) => {
    const objId = obj.get('id');
    return objId === id;
  });
}

export function clearGuidelines(canvas: FabricCanvas) {
  const objects = canvas.getCanvas().getObjects('line') as fabric.Object[];
  objects.forEach((obj) => {
    const id = obj.get('id');
    if ((id && id.startsWith('vertical-')) || id.startsWith('horizontal-')) {
      canvas.getCanvas().remove(obj);
    }
  });
  canvas.getCanvas().renderAll();
}

function guideLineOpt(id: string) {
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

export function createVerticalGuideline({
  canvas,
  x,
  id,
}: {
  canvas: fabric.Canvas;
  x: number;
  id: string;
}) {
  return new fabric.Line([x, 0, x, canvas.height], guideLineOpt(id));
}

export function createHorizontalGuideline({
  canvas,
  y,
  id,
}: {
  canvas: fabric.Canvas;
  y: number;
  id: string;
}) {
  return new fabric.Line([0, y, canvas.width, y], guideLineOpt(id));
}

export function getSnapPoints({
  target,
  canvasInstance,
}: {
  target: fabric.Object;
  canvasInstance: FabricCanvas;
}) {
  const obj = target;
  target.setCoords(); // ★ 꼭 필요함

  const canvas = canvasInstance.getCanvas();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const snappingDistance = 10;

  const basePointX = obj.aCoords.tl.x;
  const basePointY = obj.aCoords.tl.y;

  const left = Math.min(
    obj.aCoords.bl.x,
    obj.aCoords.br.x,
    obj.aCoords.tl.x,
    obj.aCoords.tr.x
  );
  const top = Math.min(
    obj.aCoords.bl.y,
    obj.aCoords.br.y,
    obj.aCoords.tl.y,
    obj.aCoords.tr.y
  );

  const right = Math.max(
    obj.aCoords.bl.x,
    obj.aCoords.br.x,
    obj.aCoords.tl.x,
    obj.aCoords.tr.x
  );

  const bottom = Math.max(
    obj.aCoords.bl.y,
    obj.aCoords.br.y,
    obj.aCoords.tl.y,
    obj.aCoords.tr.y
  );

  const centerX =
    (obj.aCoords.tl.x +
      obj.aCoords.tr.x +
      obj.aCoords.bl.x +
      obj.aCoords.br.x) /
    4;
  const centerY =
    (obj.aCoords.tl.y +
      obj.aCoords.tr.y +
      obj.aCoords.bl.y +
      obj.aCoords.br.y) /
    4;

  return [
    {
      condition: Math.abs(left) < snappingDistance,
      set: { left: basePointX - left },
      id: 'vertical-left',
      createLine: () =>
        createVerticalGuideline({
          canvas,
          x: 0,
          id: 'vertical-left',
        }),
    },
    {
      condition: Math.abs(top) < snappingDistance,
      set: { top: basePointY - top },
      id: 'horizontal-top',
      createLine: () =>
        createHorizontalGuideline({
          canvas,
          y: 0,
          id: 'horizontal-top',
        }),
    },
    {
      condition: Math.abs(right - canvasWidth) < snappingDistance,
      set: { left: basePointX - (right - canvasWidth) },
      id: 'vertical-right',
      createLine: () =>
        createVerticalGuideline({
          canvas,
          x: canvasWidth,
          id: 'vertical-right',
        }),
    },
    {
      condition: Math.abs(bottom - canvasHeight) < snappingDistance,
      set: { top: basePointY - (bottom - canvasHeight) },
      id: 'horizontal-bottom',
      createLine: () =>
        createHorizontalGuideline({
          canvas,
          y: canvasHeight,
          id: 'horizontal-bottom',
        }),
    },
    {
      condition: Math.abs(centerX - canvasWidth / 2) < snappingDistance,
      set: { left: basePointX - (centerX - canvasWidth / 2) },
      id: 'vertical-center',
      createLine: () =>
        createVerticalGuideline({
          canvas,
          x: canvasWidth / 2,
          id: 'vertical-center',
        }),
    },
    {
      condition: Math.abs(centerY - canvasHeight / 2) < snappingDistance,
      set: { top: basePointY - (centerY - canvasHeight / 2) },
      id: 'horizontal-center',
      createLine: () =>
        createHorizontalGuideline({
          canvas,
          y: canvasHeight / 2,
          id: 'horizontal-center',
        }),
    },
  ];
}
