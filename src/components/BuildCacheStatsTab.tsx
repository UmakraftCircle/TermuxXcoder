import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  RefreshCw,
  Trash2,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  Folder,
  Sliders,
  Sparkles,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CacheBucket {
  id: string;
  name: string;
  type: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
  status: string;
  hitRate: string;
  description: string;
}

interface CacheActivity {
  id: string;
  task: string;
  outcome: string;
  timeAgo: string;
  durationSaved: string;
  size: string;
}

interface BuildCacheData {
  totalSizeBytes: number;
  formattedTotalSize: string;
  totalFilesCount: number;
  cacheHitRatio: number;
  hitsCount: number;
  missesCount: number;
  timeSavedSeconds: number;
  formattedTimeSaved: string;
  remoteCacheEnabled: boolean;
  lastCleanedTime: string;
  buckets: CacheBucket[];
  recentActivity: CacheActivity[];
}

export const BuildCacheStatsTab: React.FC = () => {
  const [data, setData] = useState<BuildCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleaningBucket, setCleaningBucket] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchCacheStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/build-cache/stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch build cache stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const handleCleanCache = async (bucketId?: string) => {
    setIsCleaning(true);
    setCleaningBucket(bucketId || 'all');
    try {
      const res = await fetch('/api/build-cache/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId: bucketId || 'all' })
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackMsg(json.message);
        confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
        await fetchCacheStats();
      }
    } catch (err) {
      console.error('Failed to clean cache:', err);
    } finally {
      setIsCleaning(false);
      setCleaningBucket(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleToggleRemote = async () => {
    try {
      const res = await fetch('/api/build-cache/toggle-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !data?.remoteCacheEnabled })
      });
      const json = await res.json();
      if (json.success) {
        setFeedbackMsg(json.message);
        await fetchCacheStats();
      }
    } catch (err) {
      console.error('Failed to toggle remote cache:', err);
    } finally {
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const filteredBuckets = data?.buckets.filter((b) => {
    if (filterType === 'all') return true;
    return b.type === filterType;
  }) || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-4 font-sans" id="build-cache-stats-container">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#388bfd] to-[#1f6feb] p-0.5 shadow shrink-0">
            <div className="h-full w-full bg-[#0d1117] rounded-[10px] flex items-center justify-center text-[#58a6ff]">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">Build Cache Statistics & Storage</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 font-semibold">
                AGP 8.4 + Gradle 8.7 Engine
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Inspects task outputs, bytecode transforms, Kotlin symbol tables, and resource caches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={fetchCacheStats}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-[#c9d1d9] border border-[#30363d] flex items-center gap-1.5 transition-all active:scale-95"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#58a6ff] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleToggleRemote}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
              data?.remoteCacheEnabled
                ? 'bg-[#1f6feb]/15 text-[#58a6ff] border-[#1f6feb]/40 hover:bg-[#1f6feb]/25'
                : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:bg-[#30363d]'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-[#e3b341]" />
            <span>{data?.remoteCacheEnabled ? 'Remote Cache: ON' : 'Remote Cache: OFF'}</span>
          </button>

          <button
            onClick={() => handleCleanCache('all')}
            disabled={isCleaning}
            className="px-3 py-1.5 rounded-xl bg-[#da3633] hover:bg-[#f85149] text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isCleaning && cleaningBucket === 'all' ? 'Purging...' : 'Purge All Cache'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/30 rounded-xl p-3 text-xs text-[#58a6ff] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Metric Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Total Cached Size</span>
            <HardDrive className="h-4 w-4 text-[#58a6ff]" />
          </div>
          <p className="text-xl font-bold text-white mt-1.5">{data?.formattedTotalSize || '396.00 MB'}</p>
          <div className="flex items-center gap-1 text-[11px] text-[#8b949e] mt-1">
            <span>Across {data?.totalFilesCount || 1122} blobs</span>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Cache Hit Ratio</span>
            <Activity className="h-4 w-4 text-[#3fb950]" />
          </div>
          <p className="text-xl font-bold text-[#3fb950] mt-1.5">{data?.cacheHitRatio || 87.0}%</p>
          <div className="w-full bg-[#21262d] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#3fb950] h-full rounded-full transition-all duration-500"
              style={{ width: `${data?.cacheHitRatio || 87}%` }}
            />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Build Time Saved</span>
            <Clock className="h-4 w-4 text-[#e3b341]" />
          </div>
          <p className="text-xl font-bold text-[#e3b341] mt-1.5">{data?.formattedTimeSaved || '8m 23s'}</p>
          <div className="flex items-center gap-1 text-[11px] text-[#8b949e] mt-1">
            <span>~3.4s saved per cache hit</span>
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 shadow-sm hover:border-[#8b949e]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Task Invocations</span>
            <Zap className="h-4 w-4 text-[#bc8cff]" />
          </div>
          <p className="text-xl font-bold text-white mt-1.5">
            <span className="text-[#3fb950]">{data?.hitsCount || 148} Hits</span>
            <span className="text-[#8b949e] text-sm ml-1.5">/ {data?.missesCount || 22} Miss</span>
          </p>
          <div className="flex items-center gap-1 text-[11px] text-[#8b949e] mt-1">
            <span>{data?.remoteCacheEnabled ? 'Remote cluster synced' : 'Local disk mode'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Cache Buckets & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Cache Buckets Table & Management */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#58a6ff]" />
                <span>Active Cache Buckets & Subsystems</span>
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0d1117] p-0.5 rounded-lg border border-[#30363d] overflow-x-auto scrollbar-none">
                {['all', 'gradle', 'kotlin', 'android', 'node', 'python'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-2 py-1 rounded text-[11px] font-mono capitalize transition-all whitespace-nowrap ${
                      filterType === type
                        ? 'bg-[#21262d] text-white font-bold'
                        : 'text-[#8b949e] hover:text-[#c9d1d9]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Buckets List */}
            <div className="space-y-2.5">
              {filteredBuckets.map((bucket) => {
                const isThisCleaning = isCleaning && cleaningBucket === bucket.id;
                const sizeMb = (bucket.sizeBytes / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={bucket.id}
                    className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-[#8b949e]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Folder className="h-4 w-4 text-[#58a6ff] shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{bucket.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                          {bucket.path}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e] mt-1">{bucket.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="text-[#3fb950] font-mono font-semibold">Hit Rate: {bucket.hitRate}</span>
                        <span className="text-[#8b949e]">•</span>
                        <span className="text-[#c9d1d9] font-mono">{bucket.fileCount} files</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="text-xs font-mono font-bold text-[#f0f6fc] bg-[#21262d] px-2.5 py-1 rounded-lg border border-[#30363d]">
                        {sizeMb} MB
                      </span>
                      <button
                        onClick={() => handleCleanCache(bucket.id)}
                        disabled={isThisCleaning}
                        className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] text-[#8b949e] border border-[#30363d] transition-all active:scale-95"
                        title={`Purge ${bucket.name}`}
                      >
                        <Trash2 className={`h-3.5 w-3.5 ${isThisCleaning ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Recent Cache Activity & Recommendations */}
        <div className="space-y-3">
          {/* Live Activity Stream */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[#3fb950]" />
              <span>Recent Task Cache Events</span>
            </h3>

            <div className="space-y-2">
              {data?.recentActivity?.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] font-bold text-white block truncate">{act.task}</span>
                    <span className="text-[10px] text-[#8b949e]">
                      Saved {act.durationSaved} • {act.timeAgo}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ml-2 ${
                      act.outcome === 'FROM-CACHE'
                        ? 'bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30'
                        : act.outcome === 'UP-TO-DATE'
                        ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30'
                        : 'bg-[#ffa657]/15 text-[#ffa657] border border-[#ffa657]/30'
                    }`}
                  >
                    {act.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cache Optimization Guidance */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[#e3b341]" />
              <span>Gradle Caching Best Practices</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-[#8b949e]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] shrink-0 mt-0.5" />
                <span>Keep `org.gradle.caching=true` enabled in gradle.properties</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] shrink-0 mt-0.5" />
                <span>Declare explicit `@InputFiles` on custom Kotlin build tasks</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3fb950] shrink-0 mt-0.5" />
                <span>Use actions/setup-java with `cache: gradle` in GitHub Actions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
