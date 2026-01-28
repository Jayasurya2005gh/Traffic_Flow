
import React, { useState, useEffect, useRef } from 'react';
import { Camera, ShieldCheck, Zap, AlertTriangle, Play, Square, Loader2, RefreshCw } from 'lucide-react';
import { TrafficViolation } from '../types';

interface LiveMonitorProps {
  onViolationDetected: (violation: TrafficViolation) => void;
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ onViolationDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [objectCount, setObjectCount] = useState(0);
  const [errorType, setErrorType] = useState<'permission' | 'notfound' | 'inuse' | 'timeout' | 'generic' | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Tracking refs
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const lastPosRef = useRef<{ x: number, y: number, time: number } | null>(null);
  const lastViolationTimeRef = useRef<number>(0);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setCurrentSpeed(0);
    prevFrameRef.current = null;
    lastPosRef.current = null;
  };

  const startCamera = async () => {
    // 1. Cleanup existing session if any
    stopCamera();
    
    setIsLoading(true);
    setErrorType(null);
    setErrorDetail(null);
    
    const constraintSets = [
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let success = false;
    let lastError: any = null;

    for (const constraints of constraintSets) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("MediaDevices API is not available in this environment.");
        }

        // 2. Set a timeout for the getUserMedia call itself
        const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout starting video source')), 8000)
        );

        const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // 3. Wait for metadata with a timeout
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for video metadata')), 5000);
            if (!videoRef.current) return;
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
          });

          // 4. Attempt to play
          await videoRef.current.play();
          
          setIsActive(true);
          success = true;
          break; 
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Attempt with constraints failed:`, constraints, err);
        // Clean up current failed stream tracks immediately
        if (lastError instanceof MediaStream) {
           lastError.getTracks().forEach(t => t.stop());
        }
      }
    }

    if (!success) {
      const errName = lastError?.name || '';
      const errMsg = lastError?.message || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.toLowerCase().includes('permission')) {
        setErrorType('permission');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorType('notfound');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('Could not start video source')) {
        setErrorType('inuse');
      } else if (errMsg.includes('Timeout')) {
        setErrorType('timeout');
      } else {
        setErrorType('generic');
      }
      setErrorDetail(errMsg || "An unexpected error occurred while linking to the camera sensor.");
      setIsActive(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let animationId: number;

    const processFrame = () => {
      if (!isActive || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || canvas.width === 0) {
        animationId = requestAnimationFrame(processFrame);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = frameData.data;

      if (prevFrameRef.current && prevFrameRef.current.length === pixels.length) {
        let totalX = 0;
        let totalY = 0;
        let count = 0;
        const diffThreshold = 50;

        for (let i = 0; i < pixels.length; i += 32) {
          const rDiff = Math.abs(pixels[i] - prevFrameRef.current[i]);
          const gDiff = Math.abs(pixels[i+1] - prevFrameRef.current[i+1]);
          const bDiff = Math.abs(pixels[i+2] - prevFrameRef.current[i+2]);
          
          if (rDiff + gDiff + bDiff > diffThreshold) {
            const pixelIdx = i / 4;
            const x = pixelIdx % canvas.width;
            const y = Math.floor(pixelIdx / canvas.width);
            totalX += x;
            totalY += y;
            count++;
          }
        }

        if (count > 100) {
          const centerX = totalX / count;
          const centerY = totalY / count;
          const now = performance.now();

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = '#3b82f6';
          ctx.font = 'bold 24px monospace';
          ctx.fillText('TARGET_LOCK', centerX + 60, centerY);

          if (lastPosRef.current) {
            const dx = centerX - lastPosRef.current.x;
            const dy = centerY - lastPosRef.current.y;
            const dt = (now - lastPosRef.current.time) / 1000;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const speedKmH = Math.round((dist / dt) * 0.12);
            setCurrentSpeed(speedKmH);

            if (speedKmH > 40 && (now - lastViolationTimeRef.current > 3000)) {
              const violation: TrafficViolation = {
                id: `v-${Date.now()}`,
                type: 'speeding',
                severity: speedKmH > 80 ? 'high' : 'medium',
                timestamp: new Date().toLocaleTimeString(),
                location: 'Enforcement Zone 4',
                details: `Velocity Violation: ${speedKmH} km/h recorded.`
              };
              
              onViolationDetected(violation);
              setObjectCount(prev => prev + 1);
              lastViolationTimeRef.current = now;
              
              ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
              ctx.fillRect(0, 0, canvas.width, 150);
              ctx.fillStyle = 'white';
              ctx.font = 'bold 48px sans-serif';
              ctx.fillText('VIOLATION LOGGED', 40, 90);
            }
          }
          lastPosRef.current = { x: centerX, y: centerY, time: now };
        } else {
          setCurrentSpeed(0);
        }
      }

      prevFrameRef.current = new Uint8ClampedArray(pixels);
      animationId = requestAnimationFrame(processFrame);
    };

    if (isActive) {
      animationId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive, onViolationDetected]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700 p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Camera className="text-blue-400" /> Sensor Hub Alpha
          </h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider">AUTO_ENFORCEMENT_ENABLED</p>
        </div>
        <div className="flex gap-2">
          {isActive && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-2 py-1 rounded border border-red-500/40 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> SCANNING
            </span>
          )}
        </div>
      </div>

      <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-700 shadow-2xl group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover"
        />

        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95 backdrop-blur-md z-10 p-8 text-center">
            {errorType ? (
              <div className="max-w-xs flex flex-col items-center">
                <div className="p-3 bg-red-500/10 rounded-full mb-4">
                  <AlertTriangle className="text-red-500" size={40} />
                </div>
                <h3 className="font-bold text-red-100 mb-2">
                  {errorType === 'permission' ? "Permission Denied" : 
                   errorType === 'timeout' ? "Request Timed Out" : 
                   errorType === 'inuse' ? "Camera Already in Use" : 
                   "Connection Refused"}
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  {errorType === 'permission' ? "Please allow camera permissions in your browser settings to continue." : 
                   errorType === 'timeout' ? "The camera hardware failed to respond in time. Please refresh and try again." : 
                   errorType === 'inuse' ? "Another application is currently using the camera. Please close it and retry." : 
                   errorDetail || "Optical link could not be established."}
                </p>
                <button 
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  <RefreshCw size={16} /> Reconnect Link
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20 mb-4 transition-transform group-hover:scale-105">
                  <Camera size={48} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight">System Offline</h3>
                <p className="text-sm text-slate-400 mb-8 max-w-[240px]">Optical sensors require initialization to begin traffic flow analysis.</p>
                <button 
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-blue-900/40 uppercase tracking-widest text-xs"
                >
                  <Play size={18} fill="currentColor" /> Initialize Sensors
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
            <Loader2 className="text-blue-500 animate-spin mb-4" size={48} />
            <p className="text-[10px] font-mono text-blue-400 animate-pulse tracking-[0.2em] uppercase">Booting_Sensor_Array...</p>
          </div>
        )}

        {isActive && (
          <>
            <div className="absolute top-4 left-4 flex flex-col gap-1 text-[9px] font-mono text-blue-400 bg-black/60 p-3 rounded-lg backdrop-blur-md border border-blue-500/30">
              <div className="flex items-center gap-2">● SYSTEM_UP</div>
              <div className="flex items-center gap-2 opacity-70">● BUF_SYNC: OK</div>
              <div className="flex items-center gap-2 text-emerald-400">● DETECTION: RUNNING</div>
            </div>

            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-700 font-mono text-center shadow-2xl">
              <div className="text-[9px] text-slate-500 uppercase font-black mb-1">Velocity</div>
              <div className={`text-3xl font-black ${currentSpeed > 40 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                {currentSpeed} <span className="text-xs font-bold opacity-50">KM/H</span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 bg-blue-700/90 backdrop-blur-xl px-6 py-4 rounded-2xl border border-blue-400/30 text-center shadow-2xl">
              <div className="text-[9px] text-blue-200 uppercase font-black tracking-widest mb-1">Detections</div>
              <div className="text-3xl font-black text-white">{objectCount}</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isActive ? (
          <button 
            onClick={stopCamera}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest"
          >
            <Square size={16} fill="currentColor" /> Kill Link
          </button>
        ) : (
          <button 
            disabled={isLoading}
            onClick={startCamera}
            className="flex items-center justify-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest"
          >
            <Play size={16} fill="currentColor" /> Warm Link
          </button>
        )}
        <button 
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700 py-4 rounded-2xl font-black text-xs transition-all uppercase tracking-widest"
          onClick={() => setObjectCount(0)}
        >
          <Zap size={16} className="text-yellow-500" fill="currentColor" />
          Purge
        </button>
      </div>
    </div>
  );
};

export default LiveMonitor;
