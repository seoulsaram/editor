import { useEffect } from 'react';
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
  useEffect(() => {
    if (selected && canvas) {
      if (!canvas) return;
      canvas.handleActiveObject(selected);
    }
  }, [selected, canvas]);

  if (!layers.length) return null;
  return (
    <div className='flex flex-col p-1 border-[1px] border-black/10 bg-white rounded-lg'>
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
