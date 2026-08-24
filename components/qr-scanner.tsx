"use client";

/**
 * Real camera-based QR scanner — decodes frames from the device camera
 * client side with jsQR (no external API, nothing leaves the browser).
 * Used on /verify so border officials, hotels and hospitals can scan a
 * printed or on-screen certificate QR directly from this device instead
 * of only relying on their phone's native camera app.
 */

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CircleX, Loader2, X } from "lucide-react";

export function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (text: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access isn't supported in this browser. Type the policy number instead.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
        tick();
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't access the camera. Check permissions, or type the policy number instead.");
        }
      });

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
          if (code && code.data) {
            onScan(code.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close scanner"
        className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X className="size-5" />
      </button>

      {error ? (
        <div className="flex max-w-xs flex-col items-center gap-3 text-center text-white">
          <CircleX className="size-8 text-red-400" />
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl">
          <video ref={videoRef} muted playsInline className="w-full" />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-sunset-300/80" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <p className="mt-5 text-sm text-white/70">Point the camera at a certificate QR code</p>
    </div>
  );
}
