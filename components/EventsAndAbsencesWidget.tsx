import React, { useEffect, useState } from 'react';
import { apiGetEvents, apiGetAbsenceReports } from '../services/api';
import CalendarIcon from './icons/CalendarIcon';
import UserMinusIcon from './icons/UserMinusIcon';
import { logger } from '../utils/logger';

type UpcomingEvent = { id: string; date: string; title: string };
type RecentAbsence = { id: string; date: string; reason: string };

const EventsAndAbsencesWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [absences, setAbsences] = useState<RecentAbsence[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [allEvents, allAbsences] = await Promise.all([
          apiGetEvents(),
          apiGetAbsenceReports(),
        ]);
        const today = new Date();
        const upcoming = allEvents
          .filter(e => new Date(e.date).getTime() >= today.getTime())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const recent = allAbsences
          .filter(r => new Date(r.date).getTime() >= sevenDaysAgo.getTime())
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map(r => ({ id: r.id, date: r.date, reason: r.reason }));

        setEvents(upcoming);
        setAbsences(recent);
      } catch (e) {
        logger.error('Failed to load events/absences', { error: e as unknown });
        setEvents([]);
        setAbsences([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="card mt-6">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-indigo-500"/>Upcoming Events</h3>
              <span className="text-xs text-gray-500">Next 5</span>
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-gray-500">Loading events...</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {events.length === 0 && (<li className="text-sm text-gray-500">No upcoming events</li>)}
                {events.map(ev => (
                  <li key={ev.id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{ev.title}</span>
                    <span className="text-gray-500">{new Date(ev.date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center"><UserMinusIcon className="w-5 h-5 mr-2 text-rose-500"/>Recent Absences</h3>
              <span className="text-xs text-gray-500">Last 7 days</span>
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-gray-500">Loading absence reports...</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {absences.length === 0 && (<li className="text-sm text-gray-500">No recent absences</li>)}
                {absences.map(a => (
                  <li key={a.id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{a.reason}</span>
                    <span className="text-gray-500">{new Date(a.date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsAndAbsencesWidget;