import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { apiClient } from '../../utils/apiClient';
import {
  Instagram,
  Compass,
  Sparkles,
  RefreshCw,
  Link,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Target
} from 'lucide-react';

interface GrowthViewProps {
  currentUser: User;
}

interface IntegrationData {
  state: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED' | 'DISCONNECTED';
  accountHandle?: string;
  locationName?: string;
  connectedAt?: string;
  lastSync?: string;
  followers?: number;
  likes?: number;
  comments?: number;
  reach?: number;
}

interface AnalyticsPayload {
  level1: {
    totalPatients: number;
    totalAppointments: number;
    appointmentCompletionRate: number;
    collectionEfficiencyPct: number;
    grossBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    reviewCount: number;
    instagramConnected: boolean;
    googleBusinessConnected: boolean;
  };
  level2: Array<{ category: string; observation: string; explanation: string }>;
  level3: Array<{ priority: 'high' | 'medium' | 'low'; action: string; why: string }>;
  level4: {
    weeklyFocus: string;
    objectives: string[];
    suggestedTimeline: string;
  };
  smartTips: Array<{
    id: string;
    source: string;
    condition: string;
    evidence: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
  }>;
}

export const GrowthView: React.FC<GrowthViewProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [instagram, setInstagram] = useState<IntegrationData>({ state: 'NOT_CONNECTED' });
  const [googleBusiness, setGoogleBusiness] = useState<IntegrationData>({ state: 'NOT_CONNECTED' });
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);

  // Modal / Input States
  const [isConnectIgOpen, setIsConnectIgOpen] = useState(false);
  const [igHandleInput, setIgHandleInput] = useState('');
  const [isConnectGoogleOpen, setIsConnectGoogleOpen] = useState(false);
  const [googleLocInput, setGoogleLocInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [intRes, anaRes] = await Promise.all([
        apiClient.growth.getIntegrations(),
        apiClient.growth.getAnalytics(),
      ]);

      if (intRes && (intRes as any).success) {
        setInstagram((intRes as any).instagram || { state: 'NOT_CONNECTED' });
        setGoogleBusiness((intRes as any).googleBusiness || { state: 'NOT_CONNECTED' });
      }

      if (anaRes && (anaRes as any).success) {
        setAnalytics(anaRes as any);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load growth analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConnectInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!igHandleInput.trim()) return;

    try {
      setActionLoading('connect-ig');
      const res = await apiClient.growth.connectInstagram(igHandleInput.trim());
      if (res.success && res.instagram) {
        setInstagram(res.instagram as any);
        setIsConnectIgOpen(false);
        setIgHandleInput('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect Instagram account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncInstagram = async () => {
    try {
      setActionLoading('sync-ig');
      const res = await apiClient.growth.syncInstagram();
      if (res.success && res.instagram) {
        setInstagram(res.instagram as any);
      }
    } catch (err: any) {
      alert(err.message || 'Instagram sync failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectInstagram = async () => {
    if (!confirm('Disconnect Instagram account from Oralix practice terminal?')) return;
    try {
      setActionLoading('disconnect-ig');
      await apiClient.growth.disconnectInstagram();
      setInstagram({ state: 'NOT_CONNECTED' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect Instagram.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleLocInput.trim()) return;

    try {
      setActionLoading('connect-google');
      const res = await apiClient.growth.connectGoogle(googleLocInput.trim());
      if (res.success && res.googleBusiness) {
        setGoogleBusiness(res.googleBusiness as any);
        setIsConnectGoogleOpen(false);
        setGoogleLocInput('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect Google Business Profile.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncGoogle = async () => {
    try {
      setActionLoading('sync-google');
      const res = await apiClient.growth.syncGoogle();
      if (res.success && res.googleBusiness) {
        setGoogleBusiness(res.googleBusiness as any);
      }
    } catch (err: any) {
      alert(err.message || 'Google Business sync failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Disconnect Google Business Profile from Oralix?')) return;
    try {
      setActionLoading('disconnect-google');
      await apiClient.growth.disconnectGoogle();
      setGoogleBusiness({ state: 'NOT_CONNECTED' });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to disconnect Google profile.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 text-[#C8B58D] animate-spin" />
        <p className="text-xs font-bold text-[#6F6D69]">Loading Practice Growth &amp; Analytics Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-sm font-bold text-rose-900">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const l1 = analytics?.level1;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-bold uppercase tracking-wider mb-1 border border-[#C8B58D]/30">
            <Sparkles className="w-3 h-3 text-[#C8B58D]" />
            <span>Oralix Practice Growth &amp; Intelligence Terminal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#252525] tracking-tight">
            Growth &amp; Reputation Analytics
          </h1>
          <p className="text-xs text-[#6F6D69]">
            Real social integrations, verified conversion metrics, 4-level practice insights, and condition-grounded smart tips.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="btn-secondary text-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C8B58D] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Integration Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Instagram Card */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#252525]">Instagram Practice Profile</h3>
                <p className="text-[11px] text-[#6F6D69]">
                  {instagram.state === 'NOT_CONNECTED' ? 'Account not connected' : `Connected: ${instagram.accountHandle}`}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                instagram.state === 'CONNECTED' || instagram.state === 'SYNCED'
                  ? 'bg-[#8FA88D]/20 text-[#3B4D3A] border-[#8FA88D]/40'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {instagram.state.replace('_', ' ')}
            </span>
          </div>

          {instagram.state === 'NOT_CONNECTED' ? (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/60 text-xs text-[#6F6D69] space-y-2">
              <p>Connect your verified Instagram practice account to monitor patient inquiries, content reach, and dental care engagement.</p>
              {isAdmin ? (
                <button
                  onClick={() => setIsConnectIgOpen(true)}
                  className="btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Connect Instagram</span>
                </button>
              ) : (
                <p className="text-[11px] text-[#6F6D69] italic">Administrator authorization required to link social accounts.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Followers</span>
                  <span className="font-extrabold text-[#252525] text-sm mt-0.5 block">
                    {instagram.followers !== undefined ? instagram.followers.toLocaleString() : 'Not available'}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">30-Day Reach</span>
                  <span className="font-extrabold text-[#252525] text-sm mt-0.5 block">
                    {instagram.reach !== undefined ? instagram.reach.toLocaleString() : 'Not available'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                <span className="text-[#6F6D69]">
                  Last synced: {instagram.lastSync ? new Date(instagram.lastSync).toLocaleTimeString() : 'Recently'}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncInstagram}
                      disabled={actionLoading === 'sync-ig'}
                      className="text-[#C8B58D] font-bold hover:underline cursor-pointer"
                    >
                      {actionLoading === 'sync-ig' ? 'Syncing...' : 'Sync Data'}
                    </button>
                    <span className="text-stone-300">&bull;</span>
                    <button
                      onClick={handleDisconnectInstagram}
                      disabled={actionLoading === 'disconnect-ig'}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Google Business Profile Card */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#252525]">Google Business Profile</h3>
                <p className="text-[11px] text-[#6F6D69]">
                  {googleBusiness.state === 'NOT_CONNECTED' ? 'Profile not connected' : `Location: ${googleBusiness.locationName}`}
                </p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                googleBusiness.state === 'CONNECTED' || googleBusiness.state === 'SYNCED'
                  ? 'bg-[#8FA88D]/20 text-[#3B4D3A] border-[#8FA88D]/40'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
            >
              {googleBusiness.state.replace('_', ' ')}
            </span>
          </div>

          {googleBusiness.state === 'NOT_CONNECTED' ? (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/60 text-xs text-[#6F6D69] space-y-2">
              <p>Link your clinic's Google Business Profile to track local map discovery searches, phone call requests, and clinic reviews.</p>
              {isAdmin ? (
                <button
                  onClick={() => setIsConnectGoogleOpen(true)}
                  className="btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <Link className="w-3.5 h-3.5" />
                  <span>Connect Google Profile</span>
                </button>
              ) : (
                <p className="text-[11px] text-[#6F6D69] italic">Administrator authorization required to link clinic profiles.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Search Queries</span>
                  <span className="font-extrabold text-[#252525] text-sm mt-0.5 block">Not available</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60">
                  <span className="text-[10px] text-[#6F6D69] font-bold block uppercase">Direction Requests</span>
                  <span className="font-extrabold text-[#252525] text-sm mt-0.5 block">Not available</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                <span className="text-[#6F6D69]">
                  Last synced: {googleBusiness.lastSync ? new Date(googleBusiness.lastSync).toLocaleTimeString() : 'Recently'}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncGoogle}
                      disabled={actionLoading === 'sync-google'}
                      className="text-[#C8B58D] font-bold hover:underline cursor-pointer"
                    >
                      {actionLoading === 'sync-google' ? 'Syncing...' : 'Sync Data'}
                    </button>
                    <span className="text-stone-300">&bull;</span>
                    <button
                      onClick={handleDisconnectGoogle}
                      disabled={actionLoading === 'disconnect-google'}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LEVEL 1: ANALYTICS (What happened?) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
            LEVEL 1
          </span>
          <h2 className="text-base font-extrabold text-[#252525]">Core Practice Analytics</h2>
          <span className="text-xs text-[#6F6D69]">&mdash; Empirical clinical and financial records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Active Patients</span>
            <p className="text-2xl font-black text-[#252525] mt-1">{l1?.totalPatients ?? 0}</p>
            <p className="text-[11px] text-[#6F6D69] mt-0.5">Enrolled clinic records</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Completion Rate</span>
            <p className="text-2xl font-black text-[#252525] mt-1">{l1?.appointmentCompletionRate ?? 0}%</p>
            <p className="text-[11px] text-[#3B4D3A] mt-0.5 font-bold">Of scheduled procedures</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Collection Efficiency</span>
            <p className="text-2xl font-black text-[#252525] mt-1">{l1?.collectionEfficiencyPct ?? 0}%</p>
            <p className="text-[11px] text-[#6F6D69] mt-0.5">Billed vs Settled</p>
          </div>

          <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs">
            <span className="text-[11px] font-extrabold text-[#6F6D69] uppercase tracking-wide block">Patient Reviews</span>
            <p className="text-2xl font-black text-[#252525] mt-1">{l1?.reviewCount ?? 0}</p>
            <p className="text-[11px] text-[#6F6D69] mt-0.5">Verified public feedback</p>
          </div>
        </div>
      </div>

      {/* LEVEL 2: INSIGHTS (Why did it happen?) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
            LEVEL 2
          </span>
          <h2 className="text-base font-extrabold text-[#252525]">Diagnostic Practice Insights</h2>
          <span className="text-xs text-[#6F6D69]">&mdash; Contextual causes derived from operational patterns</span>
        </div>

        {analytics?.level2 && analytics.level2.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.level2.map((item, idx) => (
              <div key={idx} className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#EDE8DE] text-[#252525] uppercase tracking-wider">
                    {item.category}
                  </span>
                  <Lightbulb className="w-4 h-4 text-[#C8B58D]" />
                </div>
                <h4 className="font-extrabold text-sm text-[#252525]">{item.observation}</h4>
                <p className="text-xs text-[#6F6D69] leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/60 text-center text-xs text-[#6F6D69]">
            <p className="font-bold text-[#252525]">Not enough data yet</p>
            <p className="mt-1">Diagnostic insights are calculated automatically as appointments and invoices are recorded.</p>
          </div>
        )}
      </div>

      {/* LEVEL 3: RECOMMENDATIONS (What should the clinic do?) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#EDE8DE] text-[#252525] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/30">
            LEVEL 3
          </span>
          <h2 className="text-base font-extrabold text-[#252525]">Actionable Recommendations</h2>
          <span className="text-xs text-[#6F6D69]">&mdash; Prioritized tactical directives with justification</span>
        </div>

        {analytics?.level3 && analytics.level3.length > 0 ? (
          <div className="space-y-3">
            {analytics.level3.map((rec, idx) => (
              <div key={idx} className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4.5 shadow-xs flex items-start gap-4">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 mt-0.5 ${
                    rec.priority === 'high'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : rec.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {rec.priority} Priority
                </span>
                <div className="flex-1">
                  <h4 className="font-extrabold text-sm text-[#252525]">{rec.action}</h4>
                  <p className="text-xs text-[#6F6D69] mt-0.5">{rec.why}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/60 text-center text-xs text-[#6F6D69]">
            <p className="font-bold text-[#252525]">No open recommendations</p>
            <p className="mt-1">All practice metrics are optimal or awaiting additional patient activity.</p>
          </div>
        )}
      </div>

      {/* LEVEL 4: GROWTH ASSISTANT & SMART TIPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Assistant Focus */}
        <div className="bg-gradient-to-br from-[#252525] via-[#2A2723] to-[#1E1D1A] text-white rounded-2xl p-6 shadow-md border border-[#C8B58D]/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8B58D]/20 text-[#E8DCC4] text-[10px] font-extrabold uppercase tracking-wider border border-[#C8B58D]/40">
              LEVEL 4 &bull; WEEKLY GROWTH ASSISTANT
            </span>
            <Target className="w-5 h-5 text-[#C8B58D]" />
          </div>

          <div>
            <h3 className="text-base font-black text-white">{analytics?.level4?.weeklyFocus || 'Practice Growth Objective'}</h3>
            <p className="text-xs text-[#E8DCC4]/80 mt-1">Suggested timeline: {analytics?.level4?.suggestedTimeline || 'Current Operational Cycle'}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-[11px] font-extrabold text-[#C8B58D] uppercase tracking-wider">Strategic Action Items:</p>
            <ul className="space-y-2 text-xs text-stone-200">
              {analytics?.level4?.objectives?.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8FA88D] shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Condition-grounded Smart Tips */}
        <div className="bg-white/85 backdrop-blur-md border border-stone-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C8B58D] block mb-0.5">
                CONDITION-DRIVEN RULES
              </span>
              <h3 className="font-extrabold text-base text-[#252525]">Smart Clinical &amp; Growth Tips</h3>
            </div>
            <Sparkles className="w-5 h-5 text-[#C8B58D]" />
          </div>

          {analytics?.smartTips && analytics.smartTips.length > 0 ? (
            <div className="space-y-3">
              {analytics.smartTips.map(tip => (
                <div key={tip.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#252525] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8FA88D]" />
                      <span>{tip.recommendation}</span>
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                      {tip.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6F6D69] leading-relaxed">
                    <strong className="text-stone-800">Evidence:</strong> {tip.evidence}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#6F6D69]">
              <Lightbulb className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-semibold text-stone-700">No condition-triggered tips active</p>
              <p className="mt-1">Smart tips only fire when evidence conditions (e.g. unanswered reviews or unpaid balances) are met.</p>
            </div>
          )}
        </div>
      </div>

      {/* Connect Instagram Modal */}
      {isConnectIgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-base text-[#252525]">Connect Instagram Profile</h3>
              </div>
              <button onClick={() => setIsConnectIgOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <form onSubmit={handleConnectInstagram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">Instagram Account Handle</label>
                <input
                  type="text"
                  placeholder="@oralixdental"
                  value={igHandleInput}
                  onChange={e => setIgHandleInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C8B58D]"
                />
                <p className="text-[10px] text-[#6F6D69] mt-1">
                  Connects to the server-side integration record for your clinic practice.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectIgOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-[#252525] rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'connect-ig'}
                  className="btn-primary text-xs font-bold"
                >
                  {actionLoading === 'connect-ig' ? 'Connecting...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Google Business Modal */}
      {isConnectGoogleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-[#252525]">Connect Google Business Profile</h3>
              </div>
              <button onClick={() => setIsConnectGoogleOpen(false)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <form onSubmit={handleConnectGoogle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252525] mb-1">Clinic Location Name</label>
                <input
                  type="text"
                  placeholder="Oralix Dental Practice - Central Branch"
                  value={googleLocInput}
                  onChange={e => setGoogleLocInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#C8B58D]"
                />
                <p className="text-[10px] text-[#6F6D69] mt-1">
                  Connects to the server-side profile record for map reviews and search discovery.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectGoogleOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-[#252525] rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'connect-google'}
                  className="btn-primary text-xs font-bold"
                >
                  {actionLoading === 'connect-google' ? 'Connecting...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
