import React, { useRef, useEffect } from 'react';

const FONT_SIZE = 16;
const MATRIX_COLOR = '#8D0000';

interface MatrixRainProps {
  color?: string;
  speed?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ color = MATRIX_COLOR, speed = 50 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    setCanvasSize();

    const resizeObserver = new ResizeObserver(setCanvasSize);
    resizeObserver.observe(canvas);

    const characters = '01';
    let columns = Math.floor(canvas.width / FONT_SIZE);

    let drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    let interval: number;

    const draw = () => {
      if (columns !== Math.floor(canvas.width / FONT_SIZE)) {
        columns = Math.floor(canvas.width / FONT_SIZE);
        drops = [];
        for (let i = 0; i < columns; i++) {
          drops[i] = 1;
        }
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      ctx.font = `${FONT_SIZE}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];

        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    interval = setInterval(draw, speed) as unknown as number;

    return () => {
      clearInterval(interval);
      resizeObserver.unobserve(canvas);
    };
  }, [color, speed]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 opacity-80" />;
};

export default MatrixRain;
