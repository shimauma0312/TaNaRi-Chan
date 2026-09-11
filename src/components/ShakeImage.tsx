"use client"

import { Box, Button, ButtonBase, Typography } from "@mui/material"
import { keyframes } from "@mui/system"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

const shakes = [1, 2, 3, 5, 7, 10].map((distance) =>
  keyframes({
    "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
    "25%": { transform: `translate(${distance}px, ${distance}px) rotate(${distance / 2}deg)` },
    "50%": { transform: `translate(-${distance}px, -${distance}px) rotate(-${distance / 2}deg)` },
    "75%": { transform: `translate(${distance}px, -${distance}px) rotate(${distance / 2}deg)` },
  }),
)

const explode = keyframes({
  "0%": { transform: "scale(1)", opacity: 1 },
  "20%": { transform: "scale(1.2)", opacity: 1 },
  "50%": { transform: "scale(1.5)", opacity: 0.8, filter: "brightness(1.5) contrast(1.5)" },
  "100%": { transform: "scale(2)", opacity: 0, filter: "brightness(2) contrast(2)" },
})

function getMessage(clickCount: number) {
  if (clickCount >= 70) return "💥 KABOOM! Reload to resurrect 💥"
  if (clickCount >= 60) return "brrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
  if (clickCount >= 50) return "brrrrrrrrrrrrrrrrrrr"
  if (clickCount >= 40) return "brrrrrrrrrrrrrr"
  if (clickCount >= 30) return "brrrrrrrrr"
  if (clickCount >= 20) return "brrrrr"
  if (clickCount >= 10) return "brrr"
  return ""
}

export default function ShakeImage() {
  const [clickCount, setClickCount] = useState(0)
  const [position, setPosition] = useState({ top: 20, left: 20 })
  const isExploded = clickCount >= 70

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      setPosition({
        top: 5 + Math.floor(Math.random() * 31),
        left: 5 + Math.floor(Math.random() * 56),
      })
    })
    return () => window.cancelAnimationFrame(animationFrame)
  }, [])

  const animation = useMemo(() => {
    if (isExploded) return `${explode} 1s forwards`
    if (clickCount < 10) return "none"
    const level = Math.min(Math.floor(clickCount / 10) - 1, shakes.length - 1)
    const durations = [0.3, 0.25, 0.2, 0.15, 0.1, 0.08]
    return `${shakes[level]} ${durations[level]}s infinite`
  }, [clickCount, isExploded])

  return (
    <Box aria-label="Shake image playground">
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: 320, sm: 360, md: 420 },
          overflow: "hidden",
        }}
      >
        <ButtonBase
          aria-label={`Shake image. ${clickCount} of 70 clicks${isExploded ? ". Exploded" : ""}`}
          aria-describedby={clickCount > 0 ? "shake-image-status" : undefined}
          disabled={isExploded}
          onClick={() => setClickCount((count) => Math.min(count + 1, 70))}
          sx={{
            position: "absolute",
            top: `${position.top}%`,
            left: `${position.left}%`,
            width: { xs: 128, sm: 160, md: 200 },
            height: { xs: 128, sm: 160, md: 200 },
            zIndex: 10,
            transition: "transform 0.2s",
            "&:focus-visible": {
              outline: "3px solid",
              outlineColor: "primary.main",
              outlineOffset: 3,
            },
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
          <Box
            component="span"
            sx={{
              position: "relative",
              display: "block",
              width: "100%",
              height: "100%",
              animation,
              overflow: "hidden",
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
                opacity: isExploded ? 0 : 1,
              },
            }}
          >
            <Image
              src="/images/hc.jpg"
              alt=""
              fill
              sizes="200px"
              priority
              style={{ objectFit: "cover" }}
            />
          </Box>
        </ButtonBase>

        {isExploded && (
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}
          >
            Revive me
          </Button>
        )}
      </Box>

      {clickCount > 0 && (
        <Box id="shake-image-status" role="status" sx={{ mt: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>CLICKS: {clickCount}/70</Typography>
          {getMessage(clickCount) && (
            <Typography variant="body2">{getMessage(clickCount)}</Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
