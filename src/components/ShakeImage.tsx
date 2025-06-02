"use client"

import styles from '@/styles/shakeImage.module.css';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const ShakeImage = () => {
  const [clickCount, setClickCount] = useState(0);
  const [shakeClass, setShakeClass] = useState('');
  const [isExploded, setIsExploded] = useState(false);
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState({ top: '50%', left: '50%' });

  // コンポーネントがマウントされたときにランダムな位置を設定
  useEffect(() => {
    // ランダムな位置を生成
    const randomTop = Math.floor(Math.random() * 60); // 15% ~ 75%
    const randomLeft = Math.floor(Math.random() * 60); // 15% ~ 75%
    
    setPosition({
      top: `${randomTop}%`,
      left: `${randomLeft}%`
    });
  }, []);

  const handleClick = () => {
    if (isExploded) return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    // クリック数に応じてシェイクのクラスを変更
    if (newCount >= 70) {
      setShakeClass(styles.explosion);
      setIsExploded(true);
      setMessage('💥 KABOOM! Reload to resurrect 💥');
    } else if (newCount >= 60) {
      setShakeClass(styles.shake6);
      setMessage('brrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr');
    } else if (newCount >= 50) {
      setShakeClass(styles.shake5);
      setMessage('brrrrrrrrrrrrrrrrrrr');
    } else if (newCount >= 40) {
      setShakeClass(styles.shake4);
      setMessage('brrrrrrrrrrrrrr');
    } else if (newCount >= 30) {
      setShakeClass(styles.shake3);
      setMessage('brrrrrrrrr');
    } else if (newCount >= 20) {
      setShakeClass(styles.shake2);
      setMessage('brrrrr');
    } else if (newCount >= 10) {
      setShakeClass(styles.shake1);
      setMessage('brrr');
    }
  };

  const resetImage = () => {
    window.location.reload();
  };

  // 危険度に応じてカウンターのスタイルを変更
  const getCounterClass = () => {
    if (clickCount >= 60) {
      return `${styles.clickCounter} ${styles.danger}`;
    }
    return styles.clickCounter;
  };

  return (
    <>
      <div 
        className={styles.shakeContainer}
        onClick={handleClick}
        style={{ top: position.top, left: position.left }}
      >
        <Image
          src="/images/hc.jpg"
          alt="Shake Me"
          width={200}
          height={200}
          className={`${styles.image} ${shakeClass}`}
          priority
        />
        
        {/* クリックカウンターとメッセージを画像の上に表示 */}
        {clickCount > 0 && (
          <div className={getCounterClass()} style={{ position: 'absolute', bottom: '-40px', width: '100%' }}>
            CLICKS: {clickCount}/70
            {message && <div className="text-sm mt-1">{message}</div>}
          </div>
        )}
      </div>
      
      {isExploded && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          zIndex: 100 
        }}>
          <button 
            className={`${styles.resetButton} ${styles.resetButtonVisible}`}
            onClick={resetImage}
          >
            REVIVE ME PLZ
          </button>
        </div>
      )}
    </>
  );
};

export default ShakeImage;
