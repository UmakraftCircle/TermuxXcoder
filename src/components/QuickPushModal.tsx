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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center">
              <Github className="h-4 w-4 text-[#f0f6fc]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">Push to GitHub & Build APK</h3>
              <p className="text-xs text-[#8b949e]">Step-by-step terminal commands</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#c9d1d9]">
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] text-[11px] font-mono flex items-center justify-center border border-[#1f6feb]/40">
                  1
                </span>
                Export Project ZIP
              </span>
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#238636] hover:bg-[#2ea043] text-white font-bold rounded-lg border border-[#3fb950]/30 transition-colors shadow-sm"
              >
                <Download className="h-3 w-3" />
                <span>{isExporting ? 'Exporting...' : 'Download ZIP'}</span>
              </button>
            </div>
            <p className="text-[#8b949e] text-[11px] pl-7">
              Contains all 10 modules, `.github/workflows/android.yml`, Gradle 8.7 wrapper, and ProGuard rules.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] text-[11px] font-mono flex items-center justify-center border border-[#1f6feb]/40">
                  2
                </span>
                Initialize Git and Push to GitHub
              </span>
              <button
                onClick={() => handleCopy(fullPushScript, 'push-script')}
                className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold flex items-center gap-1 text-[11px]"
              >
                {copiedId === 'push-script' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedId === 'push-script' ? 'Copied Commands' : 'Copy Commands'}</span>
              </button>
            </div>

            <div className="bg-[#0d1117] rounded-xl p-3.5 border border-[#30363d] font-mono text-[11.5px] text-[#c9d1d9] overflow-x-auto">
              <pre className="whitespace-pre">{fullPushScript}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
            <span className="font-bold text-[#f0f6fc] flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-[#238636]/20 text-[#3fb950] text-[11px] font-mono flex items-center justify-center border border-[#238636]/40">
                3
              </span>
              Automatic APK Artifact Download
            </span>
            <p className="text-[#8b949e] text-[11px] leading-relaxed pl-7">
              Once pushed, GitHub Actions triggers automatically. Within 3-4 minutes, open your GitHub repo's{' '}
              <strong className="text-[#f0f6fc]">Actions</strong> tab &gt; click the latest workflow run &gt; scroll to{' '}
              <strong className="text-[#58a6ff]">Artifacts</strong> to download your ready-to-install{' '}
              <strong className="text-[#3fb950]">TermuxXCoder-debug-apk</strong>!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#161b22] border-t border-[#30363d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] font-medium rounded-lg text-xs border border-[#30363d] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
