'use client';

import { useEffect, useState } from 'react';
import Editor from '../components/Editor';
import { saveBase64Image } from '../utils/image.utils';
import Image from 'next/image';

export default function Home() {
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [bg, setBg] = useState<string>('');

  const handleSubmit = (dataUrl: string) => {
    setImgFile(null);
    saveBase64Image(dataUrl);
  };

  useEffect(() => {
    if (imgFile) {
      const url = URL.createObjectURL(imgFile);
      setBg(url);

      return () => URL.revokeObjectURL(url);
    }
  }, [imgFile]);

  return (
    <div className='relative min-h-screen flex flex-col items-center justify-center'>
      {bg && (
        <>
          <Image
            className='absolute to-0 left-0 w-screen h-screen'
            src={bg}
            width={500}
            height={500}
            alt=''
          />
          <div className='absolute top-0 left-0 w-screen h-screen bg-white/60 backdrop-blur-3xl'></div>
        </>
      )}
      <main className='p-8 pb-20 z-40'>
        <label className='flex flex-col gap-4 cursor-pointer'>
          이미지 첨부하기
          <input
            type='file'
            accept='image/*'
            className='p-3 rounded-lg border-[1px] border-black/20'
            onChange={(e) => {
              const file = e?.target?.files?.[0];
              if (file) {
                setImgFile(file);
              }
            }}
          />
        </label>

        <div className='mt-4 flex flex-col gap-4 row-start-2 items-center'>
          {imgFile && <Editor bgImage={imgFile} onSubmit={handleSubmit} />}
        </div>
      </main>
    </div>
  );
}
