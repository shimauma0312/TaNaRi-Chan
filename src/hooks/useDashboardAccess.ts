import { useState, useEffect, useRef } from "react"
import { app } from "@/app/firebaseConfig"
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  increment,
  update,
  off,
} from "firebase/database"

// Realtime Database を取得
const db = getDatabase(app)

export const useDashboardAccess = () => {
  const [accessCount, setAccessCount] = useState<number>(0)
  const eventFiredRef = useRef(false)

  useEffect(() => {
    if (!eventFiredRef.current) {
      // アクセス数を取得する
      const accessCountRef = ref(db, "dashboard/accessCount")
      onValue(accessCountRef, (snapshot) => {
        const data = snapshot.val()
        if (data && data.count !== undefined) {
          setAccessCount(data.count)
        } else {
          setAccessCount(0)
        }
      })

      eventFiredRef.current = true
    }
  }, [])

  return accessCount
}

export default useDashboardAccess
