export function hexToRgba(hex: string, alpha = 0.5) {
  // HEX 값이 '#' 포함 여부 확인 후 제거
  hex = hex.replace(/^#/, '');

  // HEX 길이에 따라 RGB 값 추출
  let r, g, b;
  if (hex.length === 3) {
    // 3자리 HEX 코드 변환 (e.g. #abc → #aabbcc)
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // 6자리 HEX 코드 변환
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error('잘못된 HEX 색상 코드입니다.');
  }

  // RGBA 문자열 반환
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function extractCommonColor(pixels: Uint8ClampedArray) {
  let totalGray = 0;
  const pixelCount = pixels.length / 4; // RGBA (4채널이므로 4로 나눔)

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]; // Red
    const g = pixels[i + 1]; // Green
    const b = pixels[i + 2]; // Blue
    const gray = (r + g + b) / 3; // 평균 밝기 계산
    totalGray += gray;
  }

  const averageGray = totalGray / pixelCount; // 전체 평균 밝기

  const result = averageGray >= 128 ? '#000000' : '#ffffff';
  return result;
}
