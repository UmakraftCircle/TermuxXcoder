import React, { useState } from 'react';
import {
  Shield,
  Camera,
  HardDrive,
  FolderLock,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Zap,
  Info,
  ChevronRight,
  Eye
} from 'lucide-react';

interface AndroidPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
}

export const AndroidPermissionsModal: React.FC<AndroidPermissionsModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner
}) => {
  const [cameraState, setCameraState] = useState<'granted' | 'prompt'>('granted');
  const [storageState, setStorageState] = useState<'granted' | 'prompt'>('granted');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#0d1117] border-b border-[#30363d] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                Application Permissions & Scopes
              </h3>
              <p className="text-[11px] text-[#8b949e]">
                Why this app requests Storage (Read/Write) and Camera permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 font-mono text-xs text-[#c9d1d9] bg-[#0d1117]/80">
          {/* Permission 1: Storage Read & Write */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs">Storage: Read & Write</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30">
                    Active
                  </span>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
            </div>

            <div className="text-[11px] text-[#8b949e] leading-relaxed pl-8 space-y-1">
              <p>
                <strong className="text-[#c9d1d9]">Why Storage?</strong> Enables loading, saving, editing, and exporting your local Android project code, Gradle configurations, ZIP archives, and User Sandbox files.
              </p>
              <p className="text-[10px] text-[#58a6ff]">
                &bull; Scoped Storage Isolation: User files are kept safe in sandbox and project workspace directories without altering app system files.
              </p>
            </div>
          </div>

          {/* Permission 2: Camera & Vision Scanning */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/30">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs">Camera: AI Vision & Code Photo Scanner</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-[#bc8cff]/20 text-[#bc8cff] border border-[#bc8cff]/30">
                    Vision Active
                  </span>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#bc8cff]" />
            </div>

            <div className="text-[11px] text-[#8b949e] leading-relaxed pl-8 space-y-1.5">
              <p>
                <strong className="text-[#c9d1d9]">Why Camera?</strong> You can take a photo of physical printed code, textbook examples, whiteboard architecture diagrams, or screen snippets, and the integrated AI vision model instantly reads, analyzes, debugs, and extracts the code into your active IDE editor!
              </p>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenScanner) onOpenScanner();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#bc8cff]/20 hover:bg-[#bc8cff]/30 text-[#bc8cff] font-bold text-xs border border-[#bc8cff]/40 flex items-center gap-1.5 transition-all"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Try Camera Code Scanner Now</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy and Security Seal */}
          <div className="p-3 bg-[#21262d]/70 rounded-xl border border-[#30363d] flex items-start gap-2.5 text-[11px]">
            <Info className="h-4 w-4 text-[#58a6ff] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-white">Zero Unauthorized Access Guarantee</p>
              <p className="text-[#8b949e]">
                Camera and Storage access are strictly user-triggered on-demand. Captured frames and files are never stored or shared externally without your explicit consent.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#161b22] border-t border-[#30363d] px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#8b949e]">
            Android API 29-34 Compliant
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-mono text-xs font-bold transition-all active:scale-95 shadow-md"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
