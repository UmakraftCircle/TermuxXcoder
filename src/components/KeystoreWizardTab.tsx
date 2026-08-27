import React, { useState } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Shield,
  ShieldCheck,
  Terminal,
  FileCode,
  Lock,
  Sparkles,
  AlertCircle,
  Download,
  Zap,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const KeystoreWizardTab: React.FC = () => {
  const [alias, setAlias] = useState('termuxxcoder_key');
  const [keystoreName, setKeystoreName] = useState('release.keystore');
  const [validityDays, setValidityDays] = useState(10000);
  const [keySize, setKeySize] = useState(2048);
  const [password, setPassword] = useState('SecurePass2026!');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Backend Live Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateLiveKeystore = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-keystore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alias,
          password,
          keySize,
          validityYears: Math.round(validityDays / 365) || 25
        })
      });
      const data = await res.json();
      setGeneratedResult(data);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.4 } });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadBase64Secret = () => {
    if (!generatedResult?.keystoreBase64) return;
    const blob = new Blob([generatedResult.keystoreBase64], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${alias}_base64.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRawKeystore = () => {
    if (!generatedResult?.keystoreBase64) return;
    try {
      const byteCharacters = atob(generatedResult.keystoreBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generatedResult.keystoreName || `${alias}.keystore`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download raw binary keystore', err);
    }
  };

  const generatedKeytoolCommand = `keytool -genkey -v -keystore ${keystoreName} -alias ${alias} -keyalg RSA -keysize ${keySize} -validity ${validityDays} -dname "CN=TermuxXCoder, OU=Dev, O=TermuxXCoder, L=Global, S=State, C=US"`;

  const generatedBase64Command = `# On Linux / macOS:
base64 -i ${keystoreName} -o keystore_base64.txt

# On Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("${keystoreName}")) | Out-File -Encoding ASCII keystore_base64.txt
`;

  return (
    <div className="space-y-6">
      {/* Overview Bento Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#d29922]/15 border border-[#d29922]/40 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-[#d29922]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc]">
                Production APK Keystore & Signing Generator
              </h2>
              <p className="text-xs text-[#8b949e]">
                Volume 10 Architecture Compliance: Store keystore in GitHub Secrets, never commit passwords to git.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateLiveKeystore}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs rounded-xl border border-[#3fb950]/30 transition-all shadow-sm shrink-0"
          >
            <Zap className="h-4 w-4" />
            <span>{isGenerating ? 'Generating...' : '⚡ Generate with Backend API'}</span>
          </button>
        </div>
      </div>

      {/* Live Generated Credentials & Fingerprints (If triggered) */}
      {generatedResult && (
        <div className="bg-[#161b22] border border-[#238636]/50 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#3fb950]" />
              <h3 className="text-sm font-bold text-[#f0f6fc]">
                Live Keystore Credentials Generated ({generatedResult.format})
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 font-mono">
              Ready for GitHub Actions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
              <span className="text-[#8b949e] text-[10px] uppercase font-sans">SHA-256 Fingerprint:</span>
              <p className="text-[#58a6ff] text-[11px] break-all">{generatedResult.sha256Fingerprint}</p>
            </div>
            <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
              <span className="text-[#8b949e] text-[10px] uppercase font-sans">SHA-1 Fingerprint:</span>
              <p className="text-[#d29922] text-[11px] break-all">{generatedResult.sha1Fingerprint}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleDownloadRawKeystore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#238636]/20 hover:bg-[#238636]/30 text-[#3fb950] text-xs font-semibold rounded-lg border border-[#238636]/40 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download .keystore File</span>
            </button>
            <button
              onClick={handleDownloadBase64Secret}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-lg border border-[#30363d] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#58a6ff]" />
              <span>Download Base64 Secret (.txt)</span>
            </button>
            <button
              onClick={() => handleCopy(generatedResult.keystoreBase64, 'copy-b64-secret')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-lg border border-[#30363d] transition-colors"
            >
              {copiedKey === 'copy-b64-secret' ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5 text-[#d29922]" />}
              <span>{copiedKey === 'copy-b64-secret' ? 'Copied Base64!' : 'Copy Base64 String'}</span>
            </button>
            <button
              onClick={() => handleCopy(generatedResult.gradlePropertiesSnippet, 'gradle-props')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-lg border border-[#30363d] transition-colors"
            >
              {copiedKey === 'gradle-props' ? <Check className="h-3.5 w-3.5 text-[#3fb950]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy gradle.properties</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Keystore Parameters */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] font-mono text-xs font-bold flex items-center justify-center border border-[#1f6feb]/40">
              1
            </span>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Generate Local Release Keystore</h3>
          </div>
          <span className="text-xs text-[#8b949e]">RSA 2048-bit PKCS12</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#c9d1d9] mb-1">Key Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c9d1d9] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c9d1d9] mb-1">Keystore Filename</label>
            <input
              type="text"
              value={keystoreName}
              onChange={(e) => setKeystoreName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#c9d1d9] mb-1">Validity (Days)</label>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
        </div>

        <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8b949e] flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-[#58a6ff]" />
              Terminal Command
            </span>
            <button
              onClick={() => handleCopy(generatedKeytoolCommand, 'keytool')}
              className="text-xs text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1"
            >
              {copiedKey === 'keytool' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'keytool' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-[#58a6ff] whitespace-pre-wrap leading-relaxed">
            {generatedKeytoolCommand}
          </pre>
        </div>
      </div>

      {/* Step 2: Convert to Base64 for GitHub Secrets */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] font-mono text-xs font-bold flex items-center justify-center border border-[#1f6feb]/40">
              2
            </span>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Convert Keystore to Base64 for GitHub Actions</h3>
          </div>
          <span className="text-xs text-[#8b949e]">Secure CI Ingestion</span>
        </div>

        <div className="bg-[#0d1117] rounded-xl p-3 border border-[#30363d]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-[#8b949e] flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-[#58a6ff]" />
              Base64 Encoding Command
            </span>
            <button
              onClick={() => handleCopy(generatedBase64Command, 'base64')}
              className="text-xs text-[#58a6ff] hover:text-[#79c0ff] flex items-center gap-1"
            >
              {copiedKey === 'base64' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'base64' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-[#d29922] whitespace-pre-wrap leading-relaxed">
            {generatedBase64Command}
          </pre>
        </div>
      </div>

      {/* Step 3: Add to GitHub Repository Secrets */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-6 w-6 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] font-mono text-xs font-bold flex items-center justify-center border border-[#1f6feb]/40">
            3
          </span>
          <h3 className="text-sm font-bold text-[#f0f6fc]">Save in GitHub Repository Secrets</h3>
        </div>

        <div className="space-y-2 text-xs text-[#c9d1d9]">
          <p>
            1. Open your GitHub Repository &gt; <strong className="text-[#f0f6fc]">Settings</strong> &gt;{' '}
            <strong className="text-[#f0f6fc]">Secrets and variables</strong> &gt; <strong className="text-[#f0f6fc]">Actions</strong>.
          </p>
          <p>
            2. Click <strong className="text-[#f0f6fc]">New repository secret</strong> and add the following 4 secrets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-mono">
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <span className="text-[#d29922] font-bold">RELEASE_KEYSTORE_BASE64</span>
              <p className="text-[10px] text-[#8b949e] mt-0.5">Content of keystore_base64.txt</p>
            </div>
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <span className="text-[#d29922] font-bold">KEYSTORE_PASSWORD</span>
              <p className="text-[10px] text-[#8b949e] mt-0.5">{password}</p>
            </div>
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <span className="text-[#d29922] font-bold">KEY_ALIAS</span>
              <p className="text-[10px] text-[#8b949e] mt-0.5">{alias}</p>
            </div>
            <div className="p-2.5 bg-[#0d1117] rounded-lg border border-[#30363d]">
              <span className="text-[#d29922] font-bold">KEY_PASSWORD</span>
              <p className="text-[10px] text-[#8b949e] mt-0.5">{password}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
