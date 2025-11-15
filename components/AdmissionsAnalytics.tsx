import React, { useEffect, useMemo, useState } from 'react';
import { Admission } from '../types';
import { apiGetAdmissions } from '../services/api';

const AdmissionsAnalytics: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiGetAdmissions();
        setAdmissions(data);
      } catch (e: any) {
        setError('Failed to load admissions analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const byClass = useMemo(() => {
    const map = new Map<string, { enquiries: number; interested: number; paid: number; admitted: number; registered: number }>();
    admissions.forEach(a => {
      const key = a.intendedClass || 'Unspecified';
      if (!map.has(key)) map.set(key, { enquiries: 0, interested: 0, paid: 0, admitted: 0, registered: 0 });
      const bucket = map.get(key)!;
      if (a.stage === 'enquiry') bucket.enquiries++;
      else if (a.stage === 'interested') bucket.interested++;
      else if (a.stage === 'paid_application') bucket.paid++;
      else if (a.stage === 'admitted') bucket.admitted++;
      else if (a.stage === 'registered') bucket.registered++;
    });
    return Array.from(map.entries()).map(([className, stats]) => ({ className, ...stats }));
  }, [admissions]);

  const byCampaign = useMemo(() => {
    const map = new Map<string, number>();
    admissions.forEach(a => {
      const key = a.campaign || 'Unspecified';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([campaign, count]) => ({ campaign, count })).sort((a, b) => b.count - a.count);
  }, [admissions]);

  if (loading) return <div className="card p-6">Loading analytics...</div>;
  if (error) return <div className="card p-6 text-red-600">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card">
        <div className="p-6">
          <h3 className="text-xl font-semibold">Class Fill-up</h3>
          <p className="text-sm text-gray-500">Counts per stage by intended class.</p>
          <div className="table-container mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Class</th>
                  <th className="th">Enquiries</th>
                  <th className="th">Interested</th>
                  <th className="th">Paid Apps</th>
                  <th className="th">Admitted</th>
                  <th className="th">Registered</th>
                </tr>
              </thead>
              <tbody>
                {byClass.map(row => (
                  <tr key={row.className}>
                    <td className="td font-medium">{row.className}</td>
                    <td className="td">{row.enquiries}</td>
                    <td className="td">{row.interested}</td>
                    <td className="td">{row.paid}</td>
                    <td className="td">{row.admitted}</td>
                    <td className="td">{row.registered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <h3 className="text-xl font-semibold">Campaign Attribution</h3>
          <p className="text-sm text-gray-500">Admissions count by campaign.</p>
          <div className="table-container mt-4">
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Campaign</th>
                  <th className="th">Admissions</th>
                </tr>
              </thead>
              <tbody>
                {byCampaign.map(row => (
                  <tr key={row.campaign}>
                    <td className="td font-medium">{row.campaign}</td>
                    <td className="td">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionsAnalytics;
