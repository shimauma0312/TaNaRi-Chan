"use client"

import Box from "@mui/material/Box"
import Portal from "@mui/material/Portal"
import { keyframes } from "@mui/material/styles"
import type { CSSProperties } from "react"

const PARTICLE_COUNT = 72
const HEART_COUNT = 36
const RAINBOW = "red, orange, yellow, lime, cyan, blue, magenta, red"

/** 粒ごとに見た目をばらけさせるための決まった乱数（0〜1） */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const fly = keyframes`
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1.4);
    opacity: 1;
  }
  70% { opacity: 1; }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0.4);
    opacity: 0;
  }
`

const screenFlash = keyframes`
  0% { opacity: 0; filter: hue-rotate(0deg); }
  15% { opacity: 0.55; }
  100% { opacity: 0; filter: hue-rotate(360deg); }
`

const shockwave = keyframes`
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`

const fall = keyframes`
  0% { transform: translateY(-10vh) rotate(0deg) scale(0.6); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(115vh) rotate(var(--spin)) scale(1.2); opacity: 0.9; }
`

const shakeA = keyframes`
  0% { transform: scale(1); }
  15% { transform: scale(1.45) rotate(-8deg); }
  30% { transform: scale(0.9) rotate(7deg); }
  45% { transform: scale(1.2) rotate(-5deg); }
  60% { transform: scale(0.97) rotate(3deg); }
  80% { transform: scale(1.05) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
`

// 同じアニメーション名だと再生し直されないので、交互に使う
const shakeB = keyframes`
  0% { transform: scale(1); }
  15% { transform: scale(1.45) rotate(-8deg); }
  30% { transform: scale(0.9) rotate(7deg); }
  45% { transform: scale(1.2) rotate(-5deg); }
  60% { transform: scale(0.97) rotate(3deg); }
  80% { transform: scale(1.05) rotate(-1deg); }
  100% { transform: scale(1) rotate(0deg); }
`

const reducedMotion = "@media (prefers-reduced-motion: reduce)"

/** いいねボタンを包む要素に付けるスタイル。burstKey が変わるたびに揺れて弾む */
export function likeButtonBounceSx(burstKey: number) {
  if (burstKey === 0) return {}
  return {
    animation: `${burstKey % 2 === 0 ? shakeA : shakeB} 700ms cubic-bezier(0.3, 1.6, 0.5, 1)`,
    [reducedMotion]: { animation: "none" },
  }
}

export interface BurstOrigin {
  x: number
  y: number
}

interface LikeBurstProps {
  /** 値が変わるたびにエフェクトを再生する。0 のときは何も表示しない */
  burstKey: number
  /** 爆発の中心。画面上の座標 */
  origin: BurstOrigin | null
}

/**
 * いいねしたときの虹色の爆発エフェクト。
 * 画面全体の虹色フラッシュ、衝撃波、画面の端まで飛ぶ粒、降ってくるハートを重ねて表示する。
 * 操作の邪魔にならないよう、クリックはすべて下の要素に通す。
 */
export default function LikeBurst({ burstKey, origin }: LikeBurstProps) {
  if (burstKey === 0 || !origin) return null

  return (
    <Portal>
      <Box
        key={burstKey}
        aria-hidden
        data-testid="like-burst"
        sx={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 2000,
          [reducedMotion]: { display: "none" },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `conic-gradient(from 0deg at ${origin.x}px ${origin.y}px, ${RAINBOW})`,
            mixBlendMode: "screen",
            opacity: 0,
            animation: `${screenFlash} 900ms ease-out forwards`,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            left: origin.x,
            top: origin.y,
            width: "180vmax",
            height: "180vmax",
            borderRadius: "50%",
            background: `conic-gradient(${RAINBOW})`,
            mask: "radial-gradient(circle, transparent 64%, #000 66%, #000 69%, transparent 71%)",
            opacity: 0,
            animation: `${shockwave} 1100ms cubic-bezier(0.25, 0.6, 0.4, 1) forwards`,
          }}
        />

        {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
          const hue = Math.round((360 / PARTICLE_COUNT) * index)
          const size = 8 + Math.round(noise(index + 1) * 16)
          const distance = 35 + Math.round(noise(index + 101) * 75)
          const duration = 900 + Math.round(noise(index + 201) * 700)
          return (
            <Box
              key={`p${index}`}
              style={
                {
                  "--angle": `${hue + noise(index + 301) * 10}deg`,
                  "--distance": `${distance}vmax`,
                } as CSSProperties
              }
              sx={{
                position: "absolute",
                left: origin.x,
                top: origin.y,
                width: size,
                height: size,
                borderRadius: index % 3 === 0 ? "2px" : "50%",
                backgroundColor: `hsl(${hue}, 100%, 55%)`,
                boxShadow: `0 0 14px 3px hsl(${hue}, 100%, 60%)`,
                opacity: 0,
                animation: `${fly} ${duration}ms cubic-bezier(0.15, 0.8, 0.3, 1) forwards`,
              }}
            />
          )
        })}

        {Array.from({ length: HEART_COUNT }, (_, index) => {
          const hue = Math.round((360 / HEART_COUNT) * index)
          const delay = 150 + Math.round(noise(index + 401) * 900)
          const duration = 1600 + Math.round(noise(index + 501) * 1200)
          const spin = Math.round((noise(index + 601) - 0.5) * 720)
          return (
            <Box
              key={`h${index}`}
              component="span"
              style={{ "--spin": `${spin}deg` } as CSSProperties}
              sx={{
                position: "absolute",
                top: 0,
                left: `${Math.round(noise(index + 701) * 100)}%`,
                fontSize: 18 + Math.round(noise(index + 801) * 30),
                color: `hsl(${hue}, 100%, 60%)`,
                textShadow: `0 0 10px hsl(${hue}, 100%, 65%)`,
                opacity: 0,
                animation: `${fall} ${duration}ms ease-in ${delay}ms forwards`,
              }}
            >
              ♥
            </Box>
          )
        })}
      </Box>
    </Portal>
  )
}
