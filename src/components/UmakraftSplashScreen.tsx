import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, Code2, Cpu, Zap, ArrowRight, CheckCircle2, Bot } from 'lucide-react';
import { offlinePreloadService } from '../utils/offlinePreloadService';
import { ProjectFile } from '../types';

interface UmakraftSplashScreenProps {
  onComplete: () => void;
  files?: ProjectFile[];
}

export const UmakraftSplashScreen: React.FC<UmakraftSplashScreenProps> = ({ onComplete, files = [] }) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const bootSteps = [
    '📁 Extracting & Verifying /models/default.gguf...',
    '⚡ Initializing Termux POSIX (/usr/bin/bash, Node, Python, Git)...',
    '🧠 Hardcoded Local AI Ready (/models/default.gguf)...',
    '📦 Pre-caching Turso Local Memory & RAG...',
    '📝 Loading Sora Editor 0.23.5 Syntaxes...',
    '✓ Embedded Offline IDE & Brain Active.'
  ];

  useEffect(() => {
    // Kick off real background preloading for Terminal and Offline AI
    offlinePreloadService.preloadAll(files);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(onComplete, 400);
          }, 200);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 18) + 12;
        return next > 100 ? 100 : next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [onComplete, files]);

  useEffect(() => {
    if (progress < 25) setStepIndex(0);
    else if (progress < 45) setStepIndex(1);
    else if (progress < 65) setStepIndex(2);
    else if (progress < 85) setStepIndex(3);
    else if (progress < 98) setStepIndex(4);
    else setStepIndex(5);
  }, [progress]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0d1117] flex flex-col items-center justify-center p-4 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1f6feb]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-[#238636]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm sm:max-w-md w-full flex flex-col items-center text-center space-y-7">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-tr from-[#1f6feb] via-[#388bfd] to-[#238636] p-1 shadow-2xl shadow-[#1f6feb]/30 animate-bounce transition-transform">
            <div className="h-full w-full bg-[#0d1117] rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <span className="font-mono font-black text-4xl sm:text-5xl bg-gradient-to-r from-[#58a6ff] via-[#79c0ff] to-[#3fb950] bg-clip-text text-transparent">
                U
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="absolute -bottom-2 -right-2 bg-[#238636] text-white p-1.5 rounded-xl shadow-lg border border-[#3fb950]/50">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-[#f0f6fc] tracking-tight">
            <span className="bg-gradient-to-r from-[#f0f6fc] via-[#e6edf3] to-[#8b949e] bg-clip-text text-transparent">
              Umakraft
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8b949e] font-medium tracking-wide">
            Next-Gen AI Coder & Android Modular Studio
          </p>
        </div>

        {/* Progress Bar & Boot Step */}
        <div className="w-full space-y-3 bg-[#161b22]/90 border border-[#30363d] p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#58a6ff] flex items-center gap-1.5 truncate max-w-[240px]">
              <span className="h-2 w-2 rounded-full bg-[#3fb950] animate-ping" />
              {bootSteps[stepIndex]}
            </span>
            <span className="text-[#f0f6fc] font-bold ml-2">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d] p-0.5">
            <div
              className="h-full bg-gradient-to-r from-[#1f6feb] via-[#58a6ff] to-[#3fb950] rounded-full transition-all duration-300 shadow-sm shadow-[#1f6feb]/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Feature Chips */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-[#8b949e]">
            <div className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]/60 truncate">
              <Bot className="h-3 w-3 text-[#3fb950]" />
              <span>Local Brain</span>
            </div>
            <div className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]/60 truncate">
              <Terminal className="h-3 w-3 text-[#58a6ff]" />
              <span>Termux PTY</span>
            </div>
            <div className="flex items-center justify-center gap-1 p-1.5 rounded-lg bg-[#0d1117] border border-[#30363d]/60 truncate">
              <Code2 className="h-3 w-3 text-[#bc8cff]" />
              <span>Sora 0.23</span>
            </div>
          </div>
        </div>

        {/* Skip / Launch Button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#58a6ff]/50 text-xs font-semibold text-[#c9d1d9] hover:text-[#f0f6fc] transition-all active:scale-95 shadow-md group"
        >
          <span>Launch AI Coder</span>
          <ArrowRight className="h-3.5 w-3.5 text-[#58a6ff] group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Footer System Specs */}
        <div className="text-[11px] text-[#8b949e]/80 font-mono flex items-center justify-center gap-3">
          <span>Android 10+ (API 29–34)</span>
          <span>•</span>
          <span>Open Source</span>
        </div>
      </div>
    </div>
  );
};
