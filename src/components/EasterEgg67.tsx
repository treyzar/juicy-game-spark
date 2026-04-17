import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface Explosion {
  id: number;
  x: number;
  y: number;
}

interface HandPos {
  x: number;
  y: number;
  velocity: number;
}

export const EasterEgg67 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [leftHand, setLeftHand] = useState<HandPos | null>(null);
  const [rightHand, setRightHand] = useState<HandPos | null>(null);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const prevPosRef = useRef<{ left?: HandPos; right?: HandPos }>({});

  const startCamera = async () => {
    if (!videoRef.current) return;

    handsRef.current = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsRef.current.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    handsRef.current.onResults(onResults);

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: 1920,
      height: 1080
    });

    cameraRef.current.start();
  };

  const onResults = (results: Results) => {
    if (results.multiHandLandmarks && results.multiHandedness) {
      let newLeft: HandPos | null = null;
      let newRight: HandPos | null = null;

      results.multiHandLandmarks.forEach((landmarks, idx) => {
        const handedness = results.multiHandedness[idx].label;
        const palm = landmarks[9];
        const x = palm.x;
        const y = palm.y;

        const prevPos = handedness === 'Left' ? prevPosRef.current.left : prevPosRef.current.right;
        const velocity = prevPos ? Math.hypot(x - prevPos.x, y - prevPos.y) : 0;

        const handPos = { x, y, velocity };

        if (handedness === 'Left') {
          newLeft = handPos;
          if (velocity > 0.04) addExplosion(x, y);
        } else {
          newRight = handPos;
          if (velocity > 0.04) addExplosion(x, y);
        }
      });

      setLeftHand(newLeft);
      setRightHand(newRight);
      prevPosRef.current = { left: newLeft || undefined, right: newRight || undefined };
    } else {
      setLeftHand(null);
      setRightHand(null);
    }
  };

  const addExplosion = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setExplosions(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  const stopCamera = () => {
    cameraRef.current?.stop();
    handsRef.current?.close();
    setLeftHand(null);
    setRightHand(null);
    setExplosions([]);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    stopCamera();
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 text-6xl opacity-30 hover:opacity-100 transition-opacity cursor-pointer z-50"
        whileHover={{ scale: 1.2, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
      >
        67
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-red-500 z-10"
            >
              <X size={32} />
            </button>

            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Numbers on hands */}
              {leftHand && (
                <>
                  <motion.div
                    className="absolute text-9xl font-black text-neon-purple pointer-events-none"
                    animate={{ 
                      left: `${(1 - leftHand.x) * 100}%`,
                      top: `${leftHand.y * 100}%`,
                      scale: [1, 1.15, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ 
                      left: { type: "spring", stiffness: 150, damping: 20 },
                      top: { type: "spring", stiffness: 150, damping: 20 },
                      scale: { duration: 1, repeat: Infinity },
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                    style={{ 
                      transform: 'translate(-50%, -50%)',
                      filter: 'drop-shadow(0 0 30px rgba(168,85,247,1))'
                    }}
                  >
                    7
                  </motion.div>
                  {/* Trail effect */}
                  <motion.div
                    className="absolute w-32 h-32 pointer-events-none"
                    animate={{
                      left: `${(1 - leftHand.x) * 100}%`,
                      top: `${leftHand.y * 100}%`,
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 80, 
                      damping: 25 
                    }}
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      className="w-full h-full rounded-full bg-neon-purple/30 blur-2xl"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                </>
              )}

              {rightHand && (
                <>
                  <motion.div
                    className="absolute text-9xl font-black text-neon-cyan pointer-events-none"
                    animate={{ 
                      left: `${(1 - rightHand.x) * 100}%`,
                      top: `${rightHand.y * 100}%`,
                      scale: [1, 1.15, 1],
                      rotate: [0, -360]
                    }}
                    transition={{ 
                      left: { type: "spring", stiffness: 150, damping: 20 },
                      top: { type: "spring", stiffness: 150, damping: 20 },
                      scale: { duration: 1, repeat: Infinity },
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                    style={{ 
                      transform: 'translate(-50%, -50%)',
                      filter: 'drop-shadow(0 0 30px rgba(6,182,212,1))'
                    }}
                  >
                    6
                  </motion.div>
                  {/* Trail effect */}
                  <motion.div
                    className="absolute w-32 h-32 pointer-events-none"
                    animate={{
                      left: `${(1 - rightHand.x) * 100}%`,
                      top: `${rightHand.y * 100}%`,
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 80, 
                      damping: 25 
                    }}
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      className="w-full h-full rounded-full bg-neon-cyan/30 blur-2xl"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>
                </>
              )}

              {/* Explosions */}
              {explosions.map(exp => (
                <motion.div
                  key={exp.id}
                  className="absolute pointer-events-none"
                  style={{ 
                    left: `${(1 - exp.x) * 100}%`,
                    top: `${exp.y * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Center flash */}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 2, 4], opacity: [1, 0.5, 0] }}
                    transition={{ duration: 0.6 }}
                    className="absolute w-32 h-32 rounded-full bg-white blur-xl"
                  />
                  {/* Color burst */}
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 6, opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute w-32 h-32 rounded-full blur-3xl"
                    style={{
                      background: 'radial-gradient(circle, #eab308 0%, #ec4899 40%, #a855f7 70%, transparent 100%)'
                    }}
                  />
                  {/* Lightning bolts */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        scaleY: 0,
                        opacity: 1,
                        rotate: i * 60
                      }}
                      animate={{ 
                        scaleY: [0, 1.5, 0],
                        opacity: [1, 1, 0]
                      }}
                      transition={{ 
                        duration: 0.4,
                        delay: i * 0.05,
                        ease: "easeOut"
                      }}
                      className="absolute w-1 h-24 bg-gradient-to-b from-neon-yellow via-neon-pink to-transparent"
                      style={{ 
                        transformOrigin: 'top center',
                        left: '50%',
                        top: '50%'
                      }}
                    />
                  ))}
                  {/* Expanding rings */}
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 5, opacity: 0 }}
                      transition={{ duration: 0.8, delay }}
                      className="absolute w-32 h-32 rounded-full border-2"
                      style={{ 
                        borderColor: i === 0 ? '#eab308' : i === 1 ? '#ec4899' : '#a855f7'
                      }}
                    />
                  ))}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
