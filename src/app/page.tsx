'use client';

import { useEffect, useState } from 'react';
import Editor from '../components/Editor';
import { extractFirstFrame, saveBase64Media } from '../utils/image.utils';
import Image from 'next/image';

export default function Home() {
  //image, video
  const [file, setFile] = useState<File | null>(null);
  const [bg, setBg] = useState<string>('');

  const handleSubmit = (dataUrl: string | undefined) => {
    setFile(null);

    if (dataUrl) {
      saveBase64Media(dataUrl);
    }
  };

  useEffect(() => {
    if (file) {
      if (file.type.includes('video')) {
        extractFirstFrame(file, (imgFile) => {
          if (!imgFile) return;
          const url = URL.createObjectURL(imgFile);
          setBg(url);

          return () => URL.revokeObjectURL(url);
        });
      } else {
        const url = URL.createObjectURL(file);
        setBg(url);

        return () => URL.revokeObjectURL(url);
      }
    }
  }, [file]);

  return (
    <div className='relative min-h-screen flex flex-col justify-center'>
      {bg && (
        <>
          <Image
            className='absolute top-0 left-0 w-screen h-screen'
            src={bg}
            width={500}
            height={500}
            alt=''
          />
          <div className='absolute top-0 left-0 w-screen h-screen bg-white/60 backdrop-blur-3xl'></div>
        </>
      )}
      <main className='p-8 pb-20 z-40 sm:p-2'>
        <label className='max-w-[500px] mx-auto flex flex-col gap-4 cursor-pointer'>
          이미지 첨부하기
          <input
            type='file'
            accept='image/*, video/*'
            className='p-3 rounded-lg border-[1px] border-black/20'
            onChange={(e) => {
              const file = e?.target?.files?.[0];
              if (file) {
                setFile(file);
              }
            }}
          />
        </label>

        <div className='mt-4 flex flex-col gap-4 row-start-2 items-center'>
          {file && <Editor background={file} onSubmit={handleSubmit} />}
        </div>
      </main>
    </div>
  );
}
