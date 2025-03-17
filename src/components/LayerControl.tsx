import FabricCanvas from '../class/fabric.class';
import { useEffect } from 'react';

type Props = {
  canvas: FabricCanvas | null;
};
export default function LayerControl({ canvas }: Props) {
  useEffect(() => {
    const layers = canvas?.getLayers();
    console.log('layer', layers);
  }, [canvas]);
  return (
    <div className='p-3 border-[1px] border-black/10 bg-white rounded-lg'>
      layercontrol
    </div>
  );
}
