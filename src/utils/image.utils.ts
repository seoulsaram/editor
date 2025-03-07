export function resizeImageSize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
) {
  const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);

  const width = originalWidth * ratio;
  const height = originalHeight * ratio;

  return { width, height };
}

export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function saveBase64Media(base64String: string, filename = 'media') {
  // Base64 문자열에서 MIME 타입 추출
  const matches = base64String.match(/^data:(image\/\w+|video\/\w+);base64,/);
  if (!matches) {
    console.error('Invalid Base64 string');
    return;
  }

  const mimeType = matches[1];
  const base64Data = base64String.replace(
    /^data:(image\/\w+|video\/\w+);base64,/,
    ''
  );
  const byteCharacters = atob(base64Data); // Base64 디코딩

  // Uint8Array를 사용하여 바이너리 데이터 변환
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // 확장자 결정 (MIME 타입에 따라 자동 설정)
  const extension = mimeType.startsWith('image') ? 'png' : 'webm';
  const fullFilename = `${filename}.${extension}`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function extractFirstFrame(
  videoFile: File,
  callback: (imgFile: File | null) => void
) {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  video.autoplay = false;
  video.playsInline = true; // iOS 지원
  video.crossOrigin = 'anonymous'; // CORS 방지 (필요할 경우)

  video.addEventListener('loadeddata', () => {
    video.currentTime = 0; // 첫 번째 프레임으로 이동
  });

  video.addEventListener('seeked', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const imgFile = new File([blob], 'first-frame.png', {
          type: 'image/png',
        });
        callback(imgFile);
      } else {
        callback(null);
      }
    }, 'image/png');

    // 비디오 URL 해제
    URL.revokeObjectURL(video.src);
  });

  video.addEventListener('error', () => {
    console.error('비디오를 로드할 수 없습니다.');
    callback(null);
  });
}
