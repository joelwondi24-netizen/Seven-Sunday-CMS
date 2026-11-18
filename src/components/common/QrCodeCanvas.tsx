import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeCanvasProps {
  value: string;
  size?: number;
  className?: string;
}

export const QrCodeCanvas: React.FC<QrCodeCanvasProps> = ({
  value,
  size = 84,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: '#082B59',
          light: '#FFFFFF',
        },
      },
      () => {
        // Ignore silent canvas callback
      }
    );
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded border border-slate-200 bg-white ${className}`}
      aria-label={`QR verification code for ${value}`}
    />
  );
};
