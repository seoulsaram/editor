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

export function saveBase64Image(base64String: string, filename = 'image.png') {
  // Base64 문자열에서 MIME 타입 추출 (data:image/png;base64, 부분 제거)
  const matches = base64String.match(/^data:(image\/\w+);base64,/);
  if (!matches) {
    console.error('Invalid Base64 string');
    return;
  }

  const mimeType = matches[1]; // image/png, image/jpeg 등
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, ''); // Base64 데이터만 추출
  const byteCharacters = atob(base64Data); // Base64 디코딩

  // Uint8Array를 사용하여 바이너리 데이터 변환
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // 다운로드를 위한 <a> 요소 생성
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
