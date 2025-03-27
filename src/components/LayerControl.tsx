import { useEffect, useState } from 'react';
import * as fabric from 'fabric';

import TextCanvas from '../class/editor.class';

type Props = {
  canvas: TextCanvas | null;
  layers: fabric.Object[];
  selected: string | null;
  setSelected: (id: string) => void;
};
export default function LayerControl({
  selected,
  setSelected,
  layers,
  canvas,
}: Props) {
  const [layerOpacityMap, setLayerOpacityMap] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    if (selected && canvas) {
      if (!canvas) return;
      canvas.handleActiveObject(selected);
    }
  }, [selected, canvas]);

  function moveSelectedLayer(direction: 'up' | 'down') {
    if (!selected && !canvas) return;
    const objects = canvas?.getCanvas().getObjects();
    const object = objects?.find((obj) => obj.get('id') === selected);

    if (object && objects?.length) {
      const currentIdx = objects.indexOf(object);
      if (direction === 'up' && currentIdx < objects.length - 1) {
        const temp = objects[currentIdx];
        objects[currentIdx] = objects[currentIdx + 1];
        objects[currentIdx + 1] = temp;
      } else if (direction === 'down' && currentIdx > 0) {
        const temp = objects[currentIdx];
        objects[currentIdx] = objects[currentIdx - 1];
        objects[currentIdx - 1] = temp;
      }
    }

    const backgroundImg = canvas?.getCanvas().backgroundImage;

    canvas?.getCanvas().remove(
      ...canvas
        ?.getCanvas()
        .getObjects()
        .filter((obj) => obj !== backgroundImg)
    );

    objects?.forEach((obj) => canvas?.getCanvas().add(obj));
    canvas?.getCanvas().renderAll();

    objects?.forEach((obj, idx) => {
      obj.set('zIndex', idx);
    });

    if (!object) return;
    canvas?.handleActiveObject(object.get('id'));
    canvas?.getCanvas().renderAll();

    canvas?.updateLayers();
  }

  function hideSelectedLayer() {
    if (!selected || !canvas) return;

    const object = canvas
      .getCanvas()
      .getObjects()
      .find((obj) => obj.get('id') === selected);

    if (!object) return;

    const newMap = { ...layerOpacityMap };
    if (!(selected in newMap)) {
      newMap[selected] = object.opacity;
    }
    const newOpacity = object.opacity === 0 ? newMap[selected] : 0;
    object.set('opacity', Number(newOpacity));

    canvas.getCanvas().renderAll();
    setLayerOpacityMap(newMap);
  }

  if (!layers.length) return null;
  return (
    <div className='flex flex-col p-1 border-[1px] border-black/10 bg-white rounded-lg'>
      <div className='flex justify-between gap-1'>
        <button
          className='h-6 flex items-center px-2 bg-amber-300 text-center rounded-2xl font-semibold'
          onClick={() => moveSelectedLayer('up')}
          disabled={!selected || layers[0].get('id') === selected}
        >
          up
        </button>
        <button
          className='h-6 flex items-center px-2 bg-amber-300 text-center rounded-2xl font-semibold'
          onClick={() => moveSelectedLayer('down')}
          disabled={
            !selected || layers[layers.length - 1].get('id') === selected
          }
        >
          down
        </button>
        <button onClick={hideSelectedLayer}>
          {canvas
            ?.getCanvas()
            .getObjects()
            .find((obj) => obj.get('id') === selected)?.opacity === 0
            ? 'show'
            : 'hide'}
        </button>
      </div>
      {layers.map((layer) => (
        <button
          onClick={() => setSelected(layer.get('id'))}
          key={layer.get('id')}
          className={`${
            selected === layer.get('id')
              ? 'bg-blue-500 text-white'
              : 'bg-white text-black'
          } p-2 rounded-lg m-1`}
        >
          {layer.type} / ({layer.zIndex})
        </button>
      ))}
    </div>
  );
}
