"use client"

import Box from "@mui/material/Box"
import { keyframes } from "@mui/material/styles"

const PARTICLE_COUNT = 24

const fly = keyframes`
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(0.3);
    opacity: 0;
  }
`

const flash = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; }
  100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
`

interface LikeBurstProps {
  /** 値が変わるたびにエフェクトを再生する。0 のときは何も表示しない */
  burstKey: number
}

/**
 * いいねしたときに、ボタンの中心から虹色の粒をはじけさせるエフェクト。
 * 親要素は position: relative と isolation: isolate にしておくこと。
 * エフェクトはボタンの後ろに描かれるので、文字は隠れない。
 */
export default function LikeBurst({ burstKey }: LikeBurstProps) {
  if (burstKey === 0) return null

  return (
    <Box
      key={burstKey}
      aria-hidden
      data-testid="like-burst"
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: -1,
        overflow: "visible",
        "@media (prefers-reduced-motion: reduce)": { display: "none" },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)",
          filter: "blur(10px)",
          opacity: 0,
          animation: `${flash} 600ms ease-out forwards`,
        }}
      />
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const hue = Math.round((360 / PARTICLE_COUNT) * index)
        const outer = index % 2 === 0
        return (
          <Box
            key={index}
            style={
              {
                "--angle": `${hue}deg`,
                "--distance": outer ? "150px" : "95px",
              } as React.CSSProperties
            }
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: outer ? 14 : 10,
              height: outer ? 14 : 10,
              borderRadius: "50%",
              backgroundColor: `hsl(${hue}, 95%, 55%)`,
              boxShadow: `0 0 12px 2px hsl(${hue}, 95%, 60%)`,
              opacity: 0,
              animation: `${fly} ${outer ? 800 : 650}ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards`,
            }}
          />
        )
      })}
    </Box>
  )
}
