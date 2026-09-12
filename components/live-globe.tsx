"use client";

import { useEffect, useRef } from "react";
import type { PresenceDot } from "@/lib/presence/store";

const YAW = -1.15;
const PITCH = 0.22;

function project(lat: number, lng: number, radius: number) {
  const la = (lat * Math.PI) / 180;
  const ln = (lng * Math.PI) / 180;
  let x = Math.cos(la) * Math.sin(ln);
  let y = Math.sin(la);
  let z = Math.cos(la) * Math.cos(ln);

  const cy = Math.cos(YAW);
  const sy = Math.sin(YAW);
  const xz = x * cy - z * sy;
  const zz = x * sy + z * cy;
  x = xz;
  z = zz;

  const cp = Math.cos(PITCH);
  const sp = Math.sin(PITCH);
  const yz = y * cp - z * sp;
  const zz2 = y * sp + z * cp;
  y = yz;
  z = zz2;

  return {
    x: x * radius,
    y: -y * radius,
    front: z > 0,
  };
}

function fibonacci(count: number) {
  const pts: { lat: number; lng: number }[] = [];
  const off = 2 / count;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = i * off - 1 + off / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * golden;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    pts.push({
      lat: (Math.asin(y) * 180) / Math.PI,
      lng: (Math.atan2(z, x) * 180) / Math.PI,
    });
  }
  return pts;
}

const MESH = fibonacci(900);

export function LiveGlobe({ dots }: { dots: PresenceDot[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 168;

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(79, 140, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const point of MESH) {
      const projected = project(point.lat, point.lng, radius);
      if (!projected.front) continue;
      ctx.fillStyle = "rgba(79, 140, 255, 0.55)";
      ctx.beginPath();
      ctx.arc(cx + projected.x, cy + projected.y, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const dot of dots) {
      const projected = project(dot.lat, dot.lng, radius);
      if (!projected.front) continue;
      ctx.fillStyle = dot.live ? "#f0b429" : "#4f8cff";
      ctx.beginPath();
      ctx.arc(cx + projected.x, cy + projected.y, dot.live ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [dots]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto h-[min(420px,80vw)] w-[min(420px,80vw)]"
      aria-hidden
    />
  );
}
