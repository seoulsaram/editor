'use client';
import { useEffect, useRef, useState } from 'react';
import TextCanvas from '../class/editor.class';
import Image from 'next/image';

type FontStyle =
  | 'NotoSansKR'
  | 'NanumMyeongjo-ExtraBold'
  | 'NanumMyeongjo-Bold'
  | 'NanumMyeongjo-Regular'
  | 'GasoekOne-Regular'
  | 'EastSeaDokdo-Regular';

type FontDataType = {
  weight: number[];
  idx: number;
};

type StyleRef = {
  [fontName in FontStyle]: FontDataType;
} & {
  curr: FontStyle;
};

type Props = {
  background: File;
  onSubmit: (dataUrl: string | undefined) => void;
};

export const fonts = [
  { name: 'NotoSansKR', url: '/fonts/NotoSansKR-VariableFont_wght.ttf' },
  {
    name: 'NanumMyeongjo-ExtraBold',
    url: '/fonts/NanumMyeongjo-ExtraBold.ttf',
  },
  { name: 'NanumMyeongjo-Bold', url: '/fonts/NanumMyeongjo-Bold.ttf' },
  { name: 'NanumMyeongjo-Regular', url: '/fonts/NanumMyeongjo-Regular.ttf' },
  { name: 'GasoekOne-Regular', url: '/fonts/GasoekOne-Regular.ttf' },
  { name: 'EastSeaDokdo-Regular', url: '/fonts/EastSeaDokdo-Regular.ttf' },
];

const icons = [
  '/bear.svg',
  '/star.svg',
  '/cat.svg',
  '/rainbow.svg',
  '/target.svg',
];

export default function Editor({ background, onSubmit }: Props) {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<TextCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const styleRef = useRef<StyleRef>({
    NotoSansKR: {
      weight: [900, 200, 300, 400, 500, 600, 700, 800, 100],
      idx: 0,
    },
    'NanumMyeongjo-ExtraBold': {
      weight: [100],
      idx: 0,
    },
    'NanumMyeongjo-Bold': {
      weight: [100],
      idx: 0,
    },
    'NanumMyeongjo-Regular': {
      weight: [100],
      idx: 0,
    },
    'GasoekOne-Regular': {
      weight: [100],
      idx: 0,
    },
    'EastSeaDokdo-Regular': {
      weight: [100],
      idx: 0,
    },

    curr: 'NotoSansKR',
  });

  const colorRef = useRef<HTMLInputElement | null>(null);

  /* load fonts */
  useEffect(() => {
    const loadFont = (fontName: string, fontUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const font = new FontFace(fontName, `url(${fontUrl})`);
        font
          .load()
          .then((loadedFont) => {
            document.fonts.add(loadedFont); // 브라우저에 폰트 등록
            resolve();
          })
          .catch((error) => reject(error + fontName));
      });
    };

    fonts.forEach((font) => {
      loadFont(font.name, font.url);
    });
  }, []);

  /* init canvas */
  useEffect(() => {
    if (typeof window === 'undefined' && containerRef.current === null) return;
    const clientWidth = window.innerWidth - 20;
    const clientHeight = window.innerHeight - 200;

    setIsLoading(true);

    const canvasInstance = new TextCanvas(
      'texteditCanvas',
      clientWidth > 500 ? 500 : clientWidth,
      clientHeight > 500 ? 500 : clientHeight,
      menuRef.current
    );
    if (background) {
      canvasInstance.addBgImage(background).then(() => {
        setCanvas(canvasInstance);
        setIsLoading(false);
      });
    } else {
      setCanvas(canvasInstance);
      setIsLoading(false);
    }

    return () => {
      canvasInstance.getCanvas().dispose();
    };
  }, [background]);

  function addText() {
    canvas?.addText({ content: 'Hello 월드', font: styleRef.current.curr });
  }

  function changeFontStyle() {
    if (!canvas) return;
    const style = styleRef.current;
    const currentFont = style.curr;
    const fontStyles = Object.keys(style);
    const currentIdx = fontStyles.indexOf(currentFont);
    const nextIdx = (currentIdx + 1) % fontStyles.length;
    const nextFont = (
      fontStyles[nextIdx] === 'curr' ? fontStyles[0] : fontStyles[nextIdx]
    ) as FontStyle;
    style.curr = nextFont;
    canvas.changeFontStyle(nextFont);
  }

  function changeFontWeight() {
    if (!canvas) return;
    const style = styleRef.current;
    const currentFont = style.curr;
    const fontWeights = style[currentFont].weight;
    const currentIdx = style[currentFont].idx;
    const nextIdx = (currentIdx + 1) % fontWeights.length;
    style[currentFont].idx = nextIdx;
    canvas.changeFontWeight(fontWeights[nextIdx]);
  }

  function changeFontColor(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canvas) return;
    canvas.changeFontColor(e.target.value);
    colorRef.current?.blur();
  }

  function changeTextAlign() {
    if (!canvas) return;
    canvas.changeTextAlign();
  }

  function deleteText() {
    if (!canvas) return;
    canvas.deleteObject();
  }

  function handleColorChangeBtnClick() {
    colorRef.current?.click();
  }

  function addIcon(path: string) {
    if (!canvas) return;
    canvas.addObject(path);
  }

  const handleSubmit = async () => {
    if (canvas) {
      const data = await canvas.getImageDataUrl(background.type);
      onSubmit(data || undefined);
      setSubmitted(true);
    }
  };

  const btn =
    'w-full p-3 text-blue-500 font-[700] flex items-center justify-center';
  return (
    <>
      {isLoading && (
        <div className='fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-white z-50'>
          <div className='text-[100px] animate-spin'>💿</div>
        </div>
      )}
      {/* icons */}
      <div className='flex gap-1'>
        {icons.map((i) => (
          <button
            key={i}
            className='p-1 border-[1px] border-black/20 bg-white/70 rounded-lg'
            onClick={() => addIcon(i)}
          >
            <Image src={i} width={50} height={50} alt='bear' />
          </button>
        ))}
      </div>
      <div className='relative flex flex-col gap-[8px]'>
        <canvas
          ref={containerRef}
          className='rounded-lg shadow-xl overflow-hidden'
          id='texteditCanvas'
        ></canvas>

        <div className='sticky w-full bottom-5 left-0 flex justify-center'>
          <div
            className='w-full flex gap-2'
            style={{ maxWidth: canvas?.getCanvasSize().width }}
          >
            <button
              className='p-2 w-full bg-blue-500 text-white font-semibold rounded-lg '
              onClick={addText}
              disabled={submitted}
            >
              텍스트 추가
            </button>
            <button
              className='p-2 w-full border-[1px] border-blue-500 text-blue-500 bg-white font-semibold rounded-lg '
              onClick={handleSubmit}
              disabled={submitted}
            >
              저장
            </button>
          </div>
        </div>
        <div
          ref={menuRef}
          style={{
            transform: 'translateY(100%)',
            boxShadow: 'rgba(100, 100, 111, 0.7) 0px 7px 29px 0px',
          }}
          className='fixed bottom-0 left-0  w-full overflow-hidden rounded-tl-xl border-[1px] border-black/10 rounded-tr-xl bg-white/50 backdrop-blur-2xl divide-y-[1px] divide-black/10'
        >
          <button onClick={changeTextAlign} data-type='text' className={btn}>
            정렬 변경
          </button>
          <button onClick={changeFontStyle} data-type='text' className={btn}>
            폰트변경
          </button>
          <button onClick={changeFontWeight} data-type='text' className={btn}>
            굵기 변경
          </button>
          <button
            onClick={handleColorChangeBtnClick}
            data-type='text'
            className={btn}
          >
            색상 변경
            <input
              ref={colorRef}
              onChange={changeFontColor}
              type='color'
              className='cursor-pointer absolute top-2 left-3 opacity-0'
            />
          </button>
          <button onClick={deleteText} className={`${btn} text-red-600`}>
            삭제
          </button>
        </div>
      </div>
    </>
  );
}
