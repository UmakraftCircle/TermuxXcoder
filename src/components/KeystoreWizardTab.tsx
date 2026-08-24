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
  AlertCircle
} from 'lucide-react';

export const KeystoreWizardTab: React.FC = () => {
  const [alias, setAlias] = useState('termuxxcoder_key');
  const [keystoreName, setKeystoreName] = useState('release.keystore');
  const [validityDays, setValidityDays] = useState(10000);
  const [keySize, setKeySize] = useState(2048);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generatedKeytoolCommand = `keytool -genkey -v -keystore ${keystoreName} -alias ${alias} -keyalg RSA -keysize ${keySize} -validity ${validityDays} -dname "CN=TermuxXCoder, OU=Dev, O=TermuxXCoder, L=Global, S=State, C=US"`;

  const generatedBase64Command = `# On Linux / macOS:
base64 -i ${keystoreName} -o keystore_base64.txt

# On Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("${keystoreName}")) | Out-File -Encoding ASCII keystore_base64.txt
`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center">
            <KeyRound className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Production APK Keystore & Signing Generator
            </h2>
            <p className="text-xs text-slate-400">
              Volume 10 Architecture Compliance: Store keystore in GitHub Secrets, never commit passwords to git.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1: Generate Keystore */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-white">Generate Local Release Keystore</h3>
          </div>
          <span className="text-xs text-slate-400">RSA 2048-bit PKCS12</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Key Alias</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Keystore Filename</label>
            <input
              type="text"
              value={keystoreName}
              onChange={(e) => setKeystoreName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Validity (Days)</label>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              Terminal Command
            </span>
            <button
              onClick={() => handleCopy(generatedKeytoolCommand, 'keytool')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedKey === 'keytool' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'keytool' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {generatedKeytoolCommand}
          </pre>
        </div>
      </div>

      {/* Step 2: Convert to Base64 for GitHub Secrets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-white">Convert Keystore to Base64 for GitHub Actions</h3>
          </div>
          <span className="text-xs text-slate-400">Secure CI Ingestion</span>
        </div>

        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              Base64 Encoding Command
            </span>
            <button
              onClick={() => handleCopy(generatedBase64Command, 'base64')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedKey === 'base64' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'base64' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-amber-300 whitespace-pre-wrap leading-relaxed">
            {generatedBase64Command}
          </pre>
        </div>
      </div>

      {/* Step 3: Add to GitHub Repository Secrets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-6 w-6 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
            3
          </span>
          <h3 className="text-sm font-bold text-white">Save in GitHub Repository Secrets</h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <p>
            1. Open your GitHub Repository &gt; <strong>Settings</strong> &gt;{' '}
            <strong>Secrets and variables</strong> &gt; <strong>Actions</strong>.
          </p>
          <p>
            2. Click <strong>New repository secret</strong> and add the following 4 secrets:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">RELEASE_KEYSTORE_BASE64</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Content of keystore_base64.txt</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">KEYSTORE_PASSWORD</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Password entered during keytool creation</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">KEY_ALIAS</span>
              <p className="text-[10px] text-slate-400 mt-0.5">{alias}</p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold">KEY_PASSWORD</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Password for the key alias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
