'use client';
import { useEffect, useRef, useState } from 'react';
import TextCanvas from '../class/editor.class';
import Image from 'next/image';
import 'react-color-palette/css';
import { ColorPicker, useColor, type IColor } from 'react-color-palette';

type FontStyle = '42dotSans' | 'DynaPuff' | 'Hahmlet';

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
  { name: '42dotSans', url: '/fonts/42dotSans.ttf' },
  { name: 'DynaPuff', url: '/fonts/DynaPuff.ttf' },
  { name: 'Hahmlet', url: '/fonts/Hahmlet.ttf' },
];

const icons = [
  '/iconCD.png',
  '/iconFace1.png',
  '/iconFace2.png',
  '/iconHeart.png',
  '/iconNail.png',
  '/iconUnicorn.png',
  '/iconWoman.png',
];

const bgList = [
  '#000000',
  '#ffffff',
  '#ffd000',
  '#ad5913',
  '#ff5e5e',
  '#38cc35',
  '#00a2ff',
  '#84369e',
  '#fc9f9f',
];

export default function Editor({ background, onSubmit }: Props) {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<TextCanvas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [color, setColor] = useColor('#123123');

  const menuRef = useRef<HTMLDivElement | null>(null);

  const styleRef = useRef<StyleRef>({
    '42dotSans': {
      weight: [300, 800],
      idx: 0,
    },
    DynaPuff: {
      weight: [400, 700],
      idx: 0,
    },
    Hahmlet: {
      weight: [300, 900],
      idx: 0,
    },

    curr: '42dotSans',
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTextBgPicker, setShowTextBgPicker] = useState(false);

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
    setIsLoading(true);
    if (typeof window === 'undefined' && containerRef.current === null) return;
    const clientWidth = window.innerWidth - 20;
    const clientHeight = window.innerHeight - 200;

    const canvasInstance = new TextCanvas(
      'texteditCanvas',
      clientWidth > 500 ? 500 : clientWidth - 24,
      clientHeight > 500 ? 500 : clientHeight,
      menuRef.current
    );
    if (background) {
      canvasInstance.addBgImage(background).then(() => {
        setCanvas(canvasInstance);

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      });
    }

    return () => {
      canvasInstance.getCanvas().dispose();
    };
  }, [background]);

  function addText() {
    canvas?.addText({ content: 'Hello', font: styleRef.current.curr });
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

  function changeFontColor(color: IColor) {
    if (!canvas) return;
    canvas.changeFontColor(color.hex);
    setShowColorPicker(false);
  }

  function changeTextAlign() {
    if (!canvas) return;
    canvas.changeTextAlign();
  }

  function deleteText() {
    if (!canvas) return;
    canvas.deleteObject();
  }

  function openTextBgSelection() {
    setShowTextBgPicker(!showTextBgPicker);
  }

  function addTextBg(color: string) {
    if (!canvas) return;
    canvas.addTextBg(color);
  }

  function removeTextBg() {
    if (!canvas) return;
    canvas.removeTextBg();
  }

  function handleColorChangeBtnClick() {
    setShowColorPicker((prev) => !prev);
  }

  function addIcon(path: string) {
    if (!canvas) return;
    canvas.addObject(path);
  }

  const handleSubmit = async () => {
    if (canvas) {
      setIsLoading(true);
      if (background.type.includes('video')) {
        alert('비디오 저장은 시간이 걸립니다. 조금 기다려주세요.');
      }
      const data = await canvas.getImageDataUrl(background.type);
      onSubmit(data || undefined);
      setSubmitted(true);
    }
  };

  const btn =
    'w-full text-blue-500 font-[700] flex items-center justify-center';

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
            className='p-1 shadow-sm border-black/20 bg-white/70 rounded-lg'
            onClick={() => addIcon(i)}
          >
            <Image src={i} width={50} height={50} alt={i} />
          </button>
        ))}
      </div>
      <div className='relative flex flex-col gap-4'>
        <canvas
          ref={containerRef}
          className='rounded-lg shadow-xl overflow-hidden'
          id='texteditCanvas'
        ></canvas>

        <div className='w-full flex justify-center'>
          <div
            className='w-full flex gap-2'
            style={{ maxWidth: canvas?.getCanvasSize().width }}
          >
            <button
              className='p-2 w-full bg-linear-to-bl from-violet-500 to-fuchsia-500 opacity-90 text-white font-semibold rounded-lg '
              onClick={addText}
              disabled={submitted}
            >
              텍스트 추가
            </button>
            <div className='relative w-full'>
              <div className='w-full h-full bg-white rounded-lg'></div>
              <button
                className='absolute left-0 top-0 p-2 w-full bg-linear-to-bl from-violet-500 to-fuchsia-500 text-transparent bg-clip-text border-[1px] border-violet-500 opacity-90  bg-white font-semibold rounded-lg '
                onClick={handleSubmit}
                disabled={submitted}
              >
                저장
              </button>
            </div>
          </div>
        </div>
        <div
          ref={menuRef}
          style={{
            transform: 'translateY(100%)',
            boxShadow: 'rgba(100, 100, 111, 0.7) 0px 7px 29px 0px',
          }}
          className='fixed max-w-[500px] bottom-0 left-[50%] translate-x-[-50%] w-full overflow-hidden rounded-tl-xl border-[1px] border-black/10 rounded-tr-xl bg-white/50 backdrop-blur-2xl divide-y-[1px] divide-black/10'
        >
          <div className='p-3 flex justify-center' data-type='text'>
            <button
              title='폰트변경'
              className='px-4'
              onClick={changeFontStyle}
              data-type='text'
            >
              <Image
                src='/iconFont.svg'
                width={24}
                height={24}
                alt='폰트변경'
              />
            </button>
            <button
              title='굵기 변경'
              className='px-4'
              onClick={changeFontWeight}
              data-type='text'
            >
              <Image
                src='/iconBold.svg'
                width={24}
                height={24}
                alt='굵기 변경'
              />
            </button>
            <button
              title='정렬 변경'
              className='px-4'
              onClick={changeTextAlign}
              data-type='text'
            >
              <Image
                src='/iconAlign.svg'
                width={24}
                height={24}
                alt='정렬 변경'
              />
            </button>
            <button
              title='색상 변경'
              className='px-4'
              onClick={handleColorChangeBtnClick}
              data-type='text'
            >
              <Image
                src='/iconColor.svg'
                width={24}
                height={24}
                alt='색상 변경'
              />
            </button>
            <button
              title='텍스트 배경색'
              className='px-4'
              onClick={openTextBgSelection}
              data-type='text'
            >
              <Image
                src='/iconTextBg.svg'
                width={24}
                height={24}
                alt='텍스트 배경색'
              />
            </button>
          </div>
          {showTextBgPicker && (
            <div className='p-3 flex justify-center' data-type='text'>
              <button
                className='mx-1 w-8 h-8 rounded-lg shadow-sm'
                onClick={removeTextBg}
              >
                <Image
                  src='/iconTransparent.png'
                  width={32}
                  height={32}
                  alt='투명'
                />
              </button>
              {bgList.map((bg) => (
                <button
                  key={bg}
                  className='mx-1 w-8 h-8 rounded-lg shadow-sm'
                  style={{ backgroundColor: bg }}
                  onClick={() => addTextBg(bg)}
                ></button>
              ))}
            </div>
          )}
          <button onClick={deleteText} className={`${btn} p-3 text-red-600`}>
            삭제
          </button>
        </div>
        {showColorPicker && (
          <div className='max-w-[500px] fixed bottom-0 left-[50%] translate-x-[-50%] w-full p-2'>
            <ColorPicker
              hideInput={['rgb', 'hsv']}
              color={color}
              height={100}
              onChange={setColor}
              onChangeComplete={changeFontColor}
              hideAlpha
            />
          </div>
        )}
      </div>
    </>
  );
}
