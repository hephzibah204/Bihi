import React, { useEffect, useState } from 'react';
import { apiSendMessage, apiGetMessageTemplates, apiUpsertMessageTemplate, apiDeleteMessageTemplate, apiGetCommunicationLogs, apiGetActivityLog } from '../../services/api';

type View = 'broadcast' | 'templates' | 'history' | 'activity';

const NotificationCenter: React.FC = () => {
  const [view, setView] = useState<View>('broadcast');
  const [channel, setChannel] = useState<'email'|'sms'>('email');
  const [recipients, setRecipients] = useState<string>('all');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [t, h, a] = await Promise.all([
        apiGetMessageTemplates().catch(() => []),
        apiGetCommunicationLogs().catch(() => []),
        apiGetActivityLog().catch(() => [])
      ]);
      setTemplates(t || []);
      setLogs(h || []);
      setActivity(a || []);
    })();
  }, []);

  const sendBroadcast = async () => {
    if (!content.trim()) return alert('Please enter a message');
    setSending(true);
    try {
      const rec = recipients.trim() === 'all' ? 'all' : recipients.split(',').map(r => r.trim()).filter(Boolean);
      await apiSendMessage({ channel, content, recipients: rec as any, type: 'announcement' });
      setContent('');
      const h = await apiGetCommunicationLogs().catch(() => []);
      setLogs(h || []);
    } catch (e) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !templateSubject.trim() || !templateBody.trim()) {
      return alert('Please complete all template fields');
    }
    try {
      await apiUpsertMessageTemplate({
        name: templateName,
        subject: templateSubject,
        content: templateBody
      });
      const t = await apiGetMessageTemplates().catch(() => []);
      setTemplates(t || []);
      setTemplateName(''); setTemplateSubject(''); setTemplateBody('');
    } catch {
      alert('Failed to save template');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await apiDeleteMessageTemplate(id).catch(() => {});
    const t = await apiGetMessageTemplates().catch(() => []);
    setTemplates(t || []);
  };

  const applyTemplate = (tpl: any) => {
    setView('broadcast');
    setContent(`${tpl.subject}\n\n${tpl.content}`);
  };

  const TabButton = ({ id, label }: { id: View; label: string }) => (
    <button
      onClick={() => setView(id)}
      className={`px-3 py-1 rounded text-sm border ${view===id?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
    >{label}</button>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-3">Notification Center</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <TabButton id="broadcast" label="Broadcast" />
        <TabButton id="templates" label="Templates" />
        <TabButton id="history" label="History" />
        <TabButton id="activity" label="Activity Log" />
      </div>

      {view === 'broadcast' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={channel} onChange={e=>setChannel(e.target.value as any)} className="input-field">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <input
              className="input-field flex-1"
              placeholder="Recipients (comma-separated) or 'all'"
              value={recipients}
              onChange={e=>setRecipients(e.target.value)}
            />
            <button onClick={sendBroadcast} disabled={sending} className="btn btn-primary">
              {sending? 'Sending...':'Send'}
            </button>
          </div>
          <textarea className="input-field h-40" placeholder="Write your announcement..." value={content} onChange={e=>setContent(e.target.value)} />
          <p className="text-xs text-slate-500">Tip: Use Templates tab to insert saved messages.</p>
        </div>
      )}

      {view === 'templates' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Create Template</h3>
            <input className="input-field" placeholder="Name" value={templateName} onChange={e=>setTemplateName(e.target.value)} />
            <input className="input-field" placeholder="Subject" value={templateSubject} onChange={e=>setTemplateSubject(e.target.value)} />
            <textarea className="input-field h-32" placeholder="Body" value={templateBody} onChange={e=>setTemplateBody(e.target.value)} />
            <button className="btn btn-primary" onClick={saveTemplate}>Save Template</button>
          </div>
          <div>
            <h3 className="font-medium mb-2">Saved Templates</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-3 border rounded flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{tpl.name}</div>
                    <div className="text-sm text-slate-600">{tpl.subject}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={()=>applyTemplate(tpl)}>Use</button>
                    <button className="btn btn-danger" onClick={()=>deleteTemplate(tpl.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {templates.length===0 && <div className="text-slate-500 text-sm">No templates yet.</div>}
            </div>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-2">
          <h3 className="font-medium">Sent History</h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {logs.map(log => (
              <div key={log.id} className="p-3 border rounded">
                <div className="text-sm text-slate-500">{log.type.toUpperCase()} • {log.channel.toUpperCase()} • {new Date(log.sentAt).toLocaleString()}</div>
                <div className="text-slate-800 mt-1 line-clamp-2">{log.content}</div>
              </div>
            ))}
            {logs.length===0 && <div className="text-slate-500 text-sm">No communications yet.</div>}
          </div>
        </div>
      )}

      {view === 'activity' && (
        <div className="space-y-2">
          <h3 className="font-medium">Recent Activity</h3>
          <ul className="space-y-1 max-h-80 overflow-auto">
            {activity.map((a:any)=> (
              <li key={a.id} className="text-sm text-slate-700">{new Date(a.timestamp).toLocaleString()} — {a.action}</li>
            ))}
            {activity.length===0 && <li className="text-slate-500 text-sm">No activity recorded.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;