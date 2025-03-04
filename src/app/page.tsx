'use client';

import { useState } from 'react';
import Editor from '../components/Editor';
import { saveBase64Image } from '../utils/image.utils';

export default function Home() {
  const [imgFile, setImgFile] = useState<File | null>(null);

  const handleSubmit = (dataUrl: string) => {
    setImgFile(null);
    saveBase64Image(dataUrl);
  };

  return (
    <div className='min-h-screen p-8 pb-20 flex flex-col items-center justify-center'>
      <main>
        <label className='flex flex-col gap-4 cursor-pointer'>
          이미지 첨부하기
          <input
            type='file'
            accept='image/*'
            className='p-3 rounded-lg border-[1px]'
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
