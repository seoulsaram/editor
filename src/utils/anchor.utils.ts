export function renderRctAnchor(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number
) {
  ctx.save(); // 이전 상태 저장
  ctx.fillStyle = '#ffffff'; // 배경색
  ctx.strokeStyle = '#99c0ff'; // 선 색상

  // 사각형 렌더링
  ctx.beginPath();
  ctx.fillRect(left - 4, top - 4, 8, 8); // 배경 채우기
  ctx.strokeRect(left - 4, top - 4, 8, 8); // 테두리 그리기
  ctx.closePath();

  ctx.restore(); // 이전 상태 복원
}

export function renderCircleAnchor(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number
) {
  ctx.beginPath();
  ctx.arc(left, top, 4, 0, Math.PI * 2, false);
  ctx.fillStyle = '#99c0ff';
  ctx.fill();
  ctx.strokeStyle = '#99c0ff';
  ctx.stroke();
}
