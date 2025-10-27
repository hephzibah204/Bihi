import React, { useEffect, useState } from 'react';
import { useBroadcastNotifications } from '../hooks/useBroadcastNotifications';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext';

const typeStyles: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const GlobalBroadcast: React.FC = () => {
  const { role } = useAuth();
  const { visibleBanners, visibleToasts, visibleModals, dismiss, dispatchAllToasts, recordImpression } = useBroadcastNotifications();
  const [modalOpenId, setModalOpenId] = useState<string | null>(null);

  // Fire toast notifications via global events
  useEffect(() => {
    if (visibleToasts.length > 0) {
      dispatchAllToasts();
    }
  }, [visibleToasts]);

  // Open the first modal if available
  useEffect(() => {
    if (visibleModals.length > 0) {
      const first = visibleModals[0];
      setModalOpenId(first.id);
      recordImpression(first.id);
    } else {
      setModalOpenId(null);
    }
  }, [visibleModals]);

  // Render banners and modals
  const currentModal = visibleModals.find(m => m.id === modalOpenId) || null;

  return (
    <>
      {visibleBanners.length > 0 && (
        <div className="space-y-2 p-2">
          {visibleBanners.map(n => {
            const roleCta = n.ctaByRole && role ? n.ctaByRole[role] : undefined;
            const actionText = roleCta?.text || n.ctaText;
            const actionUrl = roleCta?.url || n.ctaUrl;
            recordImpression(n.id);
            return (
              <div key={n.id} className={`border rounded-md px-4 py-2 flex items-start justify-between ${typeStyles[n.type] || typeStyles.info}`}>
                <div className="pr-4">
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm opacity-90 whitespace-pre-wrap">{n.message}</div>
                  {actionUrl && (
                    <a href={actionUrl} className="underline mt-2 inline-block">{actionText || 'Learn more'}</a>
                  )}
                </div>
                {n.dismissible !== false && (
                  <button className="btn btn-ghost" onClick={() => dismiss(n.id)}>Dismiss</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentModal && (
        <Modal isOpen={!!currentModal} onClose={() => { if (currentModal.dismissible !== false) { dismiss(currentModal.id); } setModalOpenId(null); }} title={currentModal.title} size="lg">
          <div className="p-6">
            <div className="text-slate-700 whitespace-pre-wrap">{currentModal.message}</div>
            {(() => {
              const roleCta = currentModal.ctaByRole && role ? currentModal.ctaByRole[role] : undefined;
              const actionText = roleCta?.text || currentModal.ctaText;
              const actionUrl = roleCta?.url || currentModal.ctaUrl;
              if (!actionUrl) return null;
              return <a href={actionUrl} className="btn btn-primary mt-4 inline-block">{actionText || 'Open'}</a>;
            })()}
            {currentModal.dismissible !== false && (
              <div className="mt-4">
                <button className="btn btn-ghost" onClick={() => { dismiss(currentModal.id); setModalOpenId(null); }}>Dismiss</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default GlobalBroadcast;