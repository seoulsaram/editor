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
