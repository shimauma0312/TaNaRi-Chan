// components/Loader.tsx
import React, { useEffect } from "react"
import loader from "../styles/loader.module.css"
import fede from "../styles/fede.module.css"
import noise from "../styles/noise.module.css"

interface LoaderProps {
  onTimeout: () => void
  timeout: number
}

const Loader: React.FC<LoaderProps> = ({ onTimeout, timeout }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout()
    }, timeout)

    return () => clearTimeout(timer)
  }, [onTimeout, timeout])

  return (
    <section className={(loader.container, fede.fadeinout)}>
      <div className={loader.loader}> </div>
      <div className={noise.glitch} data-text="Loading...">
        Loading
      </div>
    </section>
  )
}

export default Loader
