import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { clientsApi, dataSourcesApi, scansApi, dmiApi, type Client, type DataSource, type Scan } from '../lib/api';

const BASE = import.meta.env.VITE_API_URL ?? 'https://3001-i43152d26u67ymnp67m3f-2a08f4a3.sg1.manus.computer';

interface ScanResult {
  id: string;
  dataset_name: string;
  row_count: number;
  column_count: number;
  completeness_pct: string;
  duplicate_pct: string;
  null_pct: string;
  consistency_score: string;
  accuracy_score: string;
  compliance_flags: string[];
}

interface DmiScore {
  overall_score: string;
  completeness_score: string;
  consistency_score: string;
  accuracy_score: string;
  duplication_score: string;
  compliance_score: string;
  grade: string;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-emerald-500 text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-yellow-500 text-black',
    D: 'bg-orange-500 text-white',
    F: 'bg-red-600 text-white',
  };
  return (
    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-2xl font-bold ${colors[grade] ?? 'bg-slate-600 text-white'}`}>
      {grade}
    </span>
  );
}

function ComplianceBadge({ flag }: { flag: string }) {
  const labels: Record<string, string> = {
    ZATCA_COMPLIANCE: 'ZATCA',
    PDPL_PERSONAL_DATA: 'PDPL Personal',
    PDPL_FINANCIAL: 'PDPL Financial',
    MISSING_HEADERS: 'Missing Headers',
    DUPLICATE_ROWS: 'Duplicate Rows',
  };
  const colors: Record<string, string> = {
    ZATCA_COMPLIANCE: 'bg-yellow-900 text-yellow-300 border border-yellow-700',
    PDPL_PERSONAL_DATA: 'bg-red-900 text-red-300 border border-red-700',
    PDPL_FINANCIAL: 'bg-red-900 text-red-300 border border-red-700',
    MISSING_HEADERS: 'bg-orange-900 text-orange-300 border border-orange-700',
    DUPLICATE_ROWS: 'bg-orange-900 text-orange-300 border border-orange-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colors[flag] ?? 'bg-slate-700 text-slate-300'}`}>
      {labels[flag] ?? flag}
    </span>
  );
}

export default function ScanDemo() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDs, setSelectedDs] = useState<DataSource | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [dmi, setDmi] = useState<DmiScore | null>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState<'select' | 'running' | 'done'>('select');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');

  useEffect(() => {
    clientsApi.list().then(setClients).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClient) return;
    dataSourcesApi.list(selectedClient.id).then(setDataSources).catch(console.error);
    setSelectedDs(null);
    setSelectedScan(null);
    setResults([]);
    setDmi(null);
    setStep('select');
  }, [selectedClient]);

  const loadExistingScan = async (ds: DataSource) => {
    try {
      const allScans = await scansApi.list(selectedClient!.id);
      const match = allScans.find(s => s.data_source_id === ds.id && s.status === 'completed');
      if (match) {
        setSelectedScan(match);
        const [resData, dmiData] = await Promise.all([
          fetch(`${BASE}/api/v1/scan-results?scan_id=${match.id}`).then(r => r.json()),
          dmiApi.getByScan(match.id),
        ]);
        setResults(resData);
        setDmi(dmiData as DmiScore);
        setStep('done');
      } else {
        setSelectedScan(null);
        setResults([]);
        setDmi(null);
        setStep('select');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runScan = async () => {
    if (!selectedDs) return;
    setRunning(true);
    setStep('running');
    setProgress(0);

    const steps = [
      { pct: 10, label: 'Connecting to data source…' },
      { pct: 25, label: 'Sampling dataset schema…' },
      { pct: 40, label: 'Profiling completeness…' },
      { pct: 55, label: 'Detecting duplicates…' },
      { pct: 70, label: 'Checking consistency rules…' },
      { pct: 82, label: 'Running compliance checks…' },
      { pct: 92, label: 'Computing DMI score…' },
      { pct: 100, label: 'Finalising report…' },
    ];

    for (const s of steps) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
      setProgress(s.pct);
      setProgressLabel(s.label);
    }

    await new Promise(r => setTimeout(r, 500));
    await loadExistingScan(selectedDs);
    setRunning(false);
  };

  const dsIcon: Record<string, string> = {
    postgres: '🐘', oracle: '🔶', sap_hana: '🔷', excel: '📊', csv: '📄', mysql: '🐬', mssql: '🪟',
  };

  const overallScore = dmi ? parseFloat(dmi.overall_score) : 0;
  const scoreColor = overallScore >= 85 ? 'text-emerald-400' : overallScore >= 70 ? 'text-blue-400' : overallScore >= 55 ? 'text-yellow-400' : 'text-red-400';
  const barColor = overallScore >= 85 ? 'bg-emerald-500' : overallScore >= 70 ? 'bg-blue-500' : overallScore >= 55 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isRtl ? 'عرض توضيحي — فحص البيانات' : 'Demo — Data Scan'}
        </h1>
        <p className="text-slate-400 text-sm">
          {isRtl
            ? 'اختر عميلاً ومصدر بيانات ثم شغّل الفحص لرؤية نتائج تحليل جودة البيانات'
            : 'Select a client and data source, then run a scan to see full data quality profiling results'}
        </p>
      </div>

      {/* Step 1 — Select Client & Data Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Client selector */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {isRtl ? 'العميل' : 'Client'}
          </label>
          <div className="space-y-2">
            {clients.length === 0 && (
              <p className="text-slate-500 text-sm">Loading clients…</p>
            )}
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClient(c)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedClient?.id === c.id
                    ? 'border-blue-500 bg-blue-900/30 text-white'
                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-semibold">{isRtl ? c.name_ar : c.name_en}</div>
                <div className="text-xs text-slate-400 mt-0.5">{c.industry} · {c.country_code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Data source selector */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {isRtl ? 'مصدر البيانات' : 'Data Source'}
          </label>
          {!selectedClient ? (
            <p className="text-slate-500 text-sm">{isRtl ? 'اختر عميلاً أولاً' : 'Select a client first'}</p>
          ) : dataSources.length === 0 ? (
            <p className="text-slate-500 text-sm">Loading data sources…</p>
          ) : (
            <div className="space-y-2">
              {dataSources.map(ds => (
                <button
                  key={ds.id}
                  onClick={() => { setSelectedDs(ds); loadExistingScan(ds); }}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedDs?.id === ds.id
                      ? 'border-blue-500 bg-blue-900/30 text-white'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dsIcon[ds.kind] ?? '🗄️'}</span>
                    <div>
                      <div className="font-semibold text-sm">{ds.name}</div>
                      <div className="text-xs text-slate-400 uppercase">{ds.kind}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Run Scan Button */}
      {selectedDs && step !== 'running' && (
        <div className="mb-6">
          <button
            onClick={runScan}
            disabled={running}
            className="flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
          >
            <span className="text-lg">▶</span>
            {step === 'done'
              ? (isRtl ? 'إعادة تشغيل الفحص' : 'Re-run Scan')
              : (isRtl ? 'تشغيل الفحص' : 'Run Scan')}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {step === 'running' && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-semibold">{isRtl ? 'جارٍ تشغيل الفحص…' : 'Running scan…'}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{progressLabel}</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'done' && dmi && (
        <>
          {/* DMI Score Card */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">
              {isRtl ? 'مؤشر نضج البيانات (DMI)' : 'Data Maturity Index (DMI)'}
            </h2>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center bg-slate-900 rounded-xl p-6 min-w-[160px]">
                <GradeBadge grade={dmi.grade} />
                <div className={`text-5xl font-black mt-3 ${scoreColor}`}>
                  {overallScore.toFixed(1)}
                </div>
                <div className="text-slate-400 text-sm mt-1">{isRtl ? 'من 100' : '/ 100'}</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-3">
                  <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${overallScore}%` }} />
                </div>
              </div>
              {/* Dimension scores */}
              <div className="flex-1">
                <ScoreBar label={isRtl ? 'الاكتمال' : 'Completeness'} value={parseFloat(dmi.completeness_score)} color="bg-emerald-500" />
                <ScoreBar label={isRtl ? 'الاتساق' : 'Consistency'} value={parseFloat(dmi.consistency_score)} color="bg-blue-500" />
                <ScoreBar label={isRtl ? 'الدقة' : 'Accuracy'} value={parseFloat(dmi.accuracy_score)} color="bg-violet-500" />
                <ScoreBar label={isRtl ? 'التكرار' : 'Duplication'} value={parseFloat(dmi.duplication_score)} color="bg-yellow-500" />
                <ScoreBar label={isRtl ? 'الامتثال' : 'Compliance'} value={parseFloat(dmi.compliance_score)} color="bg-rose-500" />
              </div>
            </div>
          </div>

          {/* Dataset Results Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">
                {isRtl ? 'نتائج الفحص — مجموعات البيانات' : 'Scan Results — Datasets'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                    <th className="px-4 py-3 text-left">{isRtl ? 'مجموعة البيانات' : 'Dataset'}</th>
                    <th className="px-4 py-3 text-right">{isRtl ? 'الصفوف' : 'Rows'}</th>
                    <th className="px-4 py-3 text-right">{isRtl ? 'الاكتمال' : 'Completeness'}</th>
                    <th className="px-4 py-3 text-right">{isRtl ? 'التكرار' : 'Duplicates'}</th>
                    <th className="px-4 py-3 text-right">{isRtl ? 'القيم الفارغة' : 'Nulls'}</th>
                    <th className="px-4 py-3 text-right">{isRtl ? 'الاتساق' : 'Consistency'}</th>
                    <th className="px-4 py-3 text-left">{isRtl ? 'تنبيهات الامتثال' : 'Compliance Flags'}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const comp = parseFloat(r.completeness_pct);
                    const compColor = comp >= 95 ? 'text-emerald-400' : comp >= 80 ? 'text-yellow-400' : 'text-red-400';
                    const dup = parseFloat(r.duplicate_pct);
                    const dupColor = dup <= 2 ? 'text-emerald-400' : dup <= 6 ? 'text-yellow-400' : 'text-red-400';
                    return (
                      <tr key={r.id} className={`border-b border-slate-700/50 ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                        <td className="px-4 py-3 font-mono text-slate-200">{r.dataset_name}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{r.row_count.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${compColor}`}>{comp.toFixed(1)}%</td>
                        <td className={`px-4 py-3 text-right font-semibold ${dupColor}`}>{dup.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-slate-300">{parseFloat(r.null_pct).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-right text-slate-300">{parseFloat(r.consistency_score).toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.compliance_flags.length === 0
                              ? <span className="text-xs text-emerald-500">✓ Clean</span>
                              : r.compliance_flags.map(f => <ComplianceBadge key={f} flag={f} />)
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scan Metadata */}
          {selectedScan && (
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-xs text-slate-400 flex flex-wrap gap-6">
              <span>🆔 Scan ID: <span className="font-mono text-slate-300">{selectedScan.id.slice(0, 8)}…</span></span>
              <span>📅 Started: <span className="text-slate-300">{selectedScan.started_at ? new Date(selectedScan.started_at).toLocaleString() : '—'}</span></span>
              <span>✅ Completed: <span className="text-slate-300">{selectedScan.completed_at ? new Date(selectedScan.completed_at).toLocaleString() : '—'}</span></span>
              <span>🔢 Datasets: <span className="text-slate-300">{results.length}</span></span>
              <span>📊 Stage: <span className="text-blue-400 uppercase font-semibold">{selectedScan.stage}</span></span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
