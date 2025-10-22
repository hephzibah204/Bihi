import React, { useEffect, useState } from 'react';
import { initializeSemanticCache, getCacheStats, clearSemanticCache, exportSemanticCache, importSemanticCache } from '../../services/semanticSearchUtils';
import { testDomainConfiguration, runDomainTests, getCurrentDomainStatus } from '../../utils/domainTest';

const SystemTools: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [exported, setExported] = useState<string>('');
  const [importText, setImportText] = useState<string>('');
  const [domainResults, setDomainResults] = useState<any[]>([]);
  const [domainStatus, setDomainStatus] = useState<any | null>(null);

  const refreshStats = () => {
    try {
      const s = getCacheStats();
      setStats(s);
    } catch (e) {
      setStats(null);
    }
  };

  useEffect(() => { refreshStats(); }, []);

  const handleInitialize = () => {
    initializeSemanticCache();
    refreshStats();
  };

  const handleClear = () => {
    clearSemanticCache();
    refreshStats();
  };

  const handleExport = () => {
    const data = exportSemanticCache();
    setExported(JSON.stringify(data, null, 2));
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      importSemanticCache(data);
      alert('Cache imported successfully');
      refreshStats();
    } catch (e) {
      alert('Invalid JSON provided for import');
    }
  };

  const handleRunDomainTests = () => {
    const results = testDomainConfiguration();
    setDomainResults(results);
    runDomainTests();
  };

  const handleDomainStatus = () => {
    const status = getCurrentDomainStatus();
    setDomainStatus(status);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-200 space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">System Tools</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Semantic Cache</h3>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">Documents: {stats?.documentCount ?? 0}</div>
            <div className="text-sm text-slate-600">Vocabulary Size: {stats?.vocabularySize ?? 0}</div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary" onClick={handleInitialize}>Initialize</button>
              <button className="btn btn-secondary" onClick={refreshStats}>Refresh Stats</button>
              <button className="btn btn-danger" onClick={handleClear}>Clear</button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-secondary" onClick={handleExport}>Export</button>
              <button className="btn btn-secondary" onClick={handleImport}>Import</button>
            </div>
            <div className="mt-3">
              <label className="label">Import JSON</label>
              <textarea className="input-field h-28" value={importText} onChange={e=>setImportText(e.target.value)} placeholder="Paste exported cache JSON here" />
            </div>
            {exported && (
              <div className="mt-3">
                <label className="label">Exported Cache</label>
                <pre className="bg-slate-50 border rounded p-2 text-xs max-h-40 overflow-auto">{exported}</pre>
              </div>
            )}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold mb-2">Domain Tests</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleRunDomainTests}>Run Tests</button>
              <button className="btn btn-secondary" onClick={handleDomainStatus}>Current Status</button>
            </div>
            {domainStatus && (
              <div className="mt-3">
                <label className="label">Current Domain Status</label>
                <pre className="bg-slate-50 border rounded p-2 text-xs max-h-40 overflow-auto">{JSON.stringify(domainStatus, null, 2)}</pre>
              </div>
            )}
            {domainResults.length>0 && (
              <div className="mt-3">
                <label className="label">Test Results</label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {domainResults.map(r => (
                    <div key={`${r.domain}-${r.message}`} className={`p-2 border rounded text-sm ${r.status==='pass'?'border-green-300 bg-green-50':'border-red-300 bg-red-50'}`}>
                      <div className="font-medium">{r.message}</div>
                      <div className="text-slate-600">Domain: {r.domain} • Detected: {r.subdomain ?? 'null'} • Production: {String(r.isProduction)}</div>
                      {r.portalUrl && <div className="text-slate-600">Portal URL: {r.portalUrl}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTools;