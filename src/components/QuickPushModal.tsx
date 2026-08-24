import React, { useState } from 'react';
import {
  X,
  Github,
  Copy,
  Check,
  Terminal,
  ArrowRight,
  Sparkles,
  Download,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { exportProjectToZip, downloadBlob } from '../utils/zipExporter';
import { ProjectFile } from '../types';
import confetti from 'canvas-confetti';

interface QuickPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
}

export const QuickPushModal: React.FC<QuickPushModalProps> = ({ isOpen, onClose, files }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [repoName, setRepoName] = useState('TermuxXCoder');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fullPushScript = `# 1. Download or extract the project ZIP to a local folder
cd /path/to/extracted/TermuxXCoder

# 2. Initialize Git and commit all files
git init -b main
git add .
git commit -m "feat: initial commit for TermuxXCoder modular Android IDE"

# 3. Create public/private GitHub repository using GitHub CLI (gh)
gh repo create ${repoName} --public --source=. --remote=origin --push

# 4. Or use manual remote if repository was created in browser:
# git remote add origin https://github.com/YOUR_USERNAME/${repoName}.git
# git push -u origin main
`;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await exportProjectToZip(files, repoName);
      downloadBlob(blob, `${repoName}-GitHub-Ready.zip`);
      confetti({ particleCount: 60, spread: 45, origin: { y: 0.5 } });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center">
              <Github className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Push to GitHub & Build APK</h3>
              <p className="text-xs text-slate-400">Step-by-step terminal commands</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-mono flex items-center justify-center">
                  1
                </span>
                Export Project ZIP
              </span>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>{isExporting ? 'Exporting...' : 'Download ZIP'}</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px] pl-7">
              Contains all 10 modules, \`.github/workflows/android.yml\`, Gradle 8.7 wrapper, and ProGuard rules.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-mono flex items-center justify-center">
                  2
                </span>
                Initialize Git and Push to GitHub
              </span>
              <button
                onClick={() => handleCopy(fullPushScript, 'push-script')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                {copiedId === 'push-script' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedId === 'push-script' ? 'Copied Commands' : 'Copy Commands'}</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11.5px] text-slate-300 overflow-x-auto">
              <pre className="whitespace-pre">{fullPushScript}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-white flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-mono flex items-center justify-center">
                3
              </span>
              Automatic APK Artifact Download
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed pl-7">
              Once pushed, GitHub Actions triggers automatically. Within 3-4 minutes, open your GitHub repo's{' '}
              <strong className="text-white">Actions</strong> tab &gt; click the latest workflow run &gt; scroll to{' '}
              <strong className="text-cyan-400">Artifacts</strong> to download your ready-to-install{' '}
              <strong className="text-emerald-400">TermuxXCoder-debug-apk</strong>!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
