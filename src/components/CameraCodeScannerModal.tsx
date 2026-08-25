import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ScanLine,
  Image as ImageIcon
} from 'lucide-react';

interface CameraCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (result: {
    code: string;
    description: string;
    imageDataUrl?: string;
  }) => void;
  isAiProcessing: boolean;
  onAnalyzeImage: (image: { data: string; mimeType: string }, prompt?: string) => Promise<void>;
}

export const CameraCodeScannerModal: React.FC<CameraCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  isAiProcessing,
  onAnalyzeImage
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Read and scan all code in this photo/image. Identify any errors, extract the complete code, and format it cleanly.'
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when opened in camera mode
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment. You can upload an image/photo directly.');
      }

      // Prefer back/environment camera on phones/tablets for taking photos of code
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      let msg = 'Unable to access camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please grant permission in your browser or upload an image file instead.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera hardware found on this device. You can upload a photo of code using the file uploader.';
      } else if (err.message) {
        msg = err.message;
      }
      setCameraError(msg);
      setMode('upload');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCapturedImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeCaptured = async () => {
    if (!capturedImage) return;
    const mimeMatch = capturedImage.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = capturedImage.replace(/^data:image\/\w+;base64,/, '');

    await onAnalyzeImage(
      {
        data: base64Data,
        mimeType
      },
      customPrompt
    );
    onClose();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0d1117] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                AI Vision & Camera Code Scanner
              </h3>
              <p className="text-[11px] text-[#8b949e]">
                Capture a photo of code, diagrams, or upload an image to read and analyze with AI
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="flex border-b border-[#30363d] bg-[#161b22] px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setMode('camera');
              setCapturedImage(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-mono font-semibold transition-colors border-t border-x ${
              mode === 'camera'
                ? 'bg-[#0d1117] text-[#58a6ff] border-[#30363d] border-b-transparent'
                : 'text-[#8b949e] border-transparent hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Live Camera</span>
          </button>
          <button
            onClick={() => {
              setMode('upload');
              stopCamera();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-mono font-semibold transition-colors border-t border-x ${
              mode === 'upload'
                ? 'bg-[#0d1117] text-[#58a6ff] border-[#30363d] border-b-transparent'
                : 'text-[#8b949e] border-transparent hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Photo / Screenshot</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-[#0d1117]">
          {cameraError && (
            <div className="p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded-xl text-xs text-[#ff7b72] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Camera Access Notice:</p>
                <p className="text-[11px] mt-0.5">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Captured Image Preview Mode */}
          {capturedImage ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-black max-h-[320px] flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Captured code"
                  className="max-h-[320px] w-full object-contain"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-[#30363d] text-[10px] text-white font-mono">
                  <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
                  <span>Image Ready for AI Analysis</span>
                </div>
              </div>

              {/* Action Prompt */}
              <div>
                <label className="block text-xs font-mono text-[#8b949e] mb-1 font-semibold">
                  Instruction for AI:
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58a6ff]"
                  placeholder="E.g. Read this code, identify the bug, and provide fixed code"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleRetake}
                  disabled={isAiProcessing}
                  className="px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-[#c9d1d9] flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retake / Choose Another</span>
                </button>

                <button
                  onClick={handleAnalyzeCaptured}
                  disabled={isAiProcessing}
                  className="px-4 py-2 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>{isAiProcessing ? 'Scanning Code...' : 'Scan & Extract with AI'}</span>
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            /* Live Camera View */
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Target overlay guide */}
                <div className="absolute inset-4 border-2 border-dashed border-[#58a6ff]/50 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="flex justify-between text-[10px] font-mono text-[#58a6ff] bg-black/60 px-2 py-0.5 rounded w-fit backdrop-blur-sm">
                    <ScanLine className="h-3 w-3 mr-1 inline" /> Align code inside frame
                  </div>
                  <div className="text-[10px] font-mono text-[#8b949e] bg-black/60 px-2 py-0.5 rounded self-center backdrop-blur-sm">
                    Hold steady for sharpest text readability
                  </div>
                </div>
              </div>

              {/* Shutter Button */}
              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={handleCapturePhoto}
                  className="px-6 py-2.5 rounded-full bg-[#1f6feb] hover:bg-[#388bfd] text-white font-mono text-xs font-bold flex items-center gap-2 shadow-xl hover:shadow-[#1f6feb]/30 transition-all active:scale-95 border border-[#58a6ff]/40"
                >
                  <Camera className="h-4 w-4" />
                  <span>Capture Photo of Code</span>
                </button>
              </div>
            </div>
          ) : (
            /* File Upload View */
            <div className="space-y-4 py-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#30363d] hover:border-[#58a6ff] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#161b22]/50 hover:bg-[#161b22] transition-all group"
              >
                <div className="p-3 rounded-full bg-[#21262d] group-hover:bg-[#58a6ff]/20 text-[#8b949e] group-hover:text-[#58a6ff] transition-colors border border-[#30363d]">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white font-mono">
                    Select a Photo or Screenshot of Code
                  </p>
                  <p className="text-xs text-[#8b949e] mt-1 font-mono">
                    Supports PNG, JPG, WEBP, and camera photos
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-mono text-[#58a6ff] font-semibold border border-[#30363d]"
                >
                  Browse Files
                </button>
              </div>
            </div>
          )}

          {/* Hidden Canvas for capture rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Permission Info */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-4 py-2 flex items-center justify-between text-[10px] font-mono text-[#8b949e]">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-[#3fb950]" />
            Privacy: Photos are processed locally or via secure AI vision proxy
          </span>
          <span className="text-[#58a6ff]">TermuxXCoder Vision AI</span>
        </div>
      </div>
    </div>
  );
};
