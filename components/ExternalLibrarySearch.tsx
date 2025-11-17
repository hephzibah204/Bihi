import React, { useMemo, useState } from 'react';
import SearchIcon from './icons/SearchIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import SpinnerIcon from './icons/SpinnerIcon';

type Source = 'Open Library' | 'Internet Archive' | 'Wikipedia' | 'OER Index';

const ExternalLibrarySearch: React.FC = () => {
  const [source, setSource] = useState<Source>('Open Library');
  const [q, setQ] = useState('');
  const [year, setYear] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const placeholder = useMemo(() => {
    if (source === 'Open Library') return 'Search title, author, or subject';
    if (source === 'Internet Archive') return 'Search public domain texts';
    return 'Topic or article title';
  }, [source]);

  const handleSearch = async () => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setError('');
    try {
      if (source === 'Open Library') {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(term)}&limit=20`);
        const data = await res.json();
        setResults((data?.docs || []).map((d: any) => ({
          title: d.title,
          author: (d.author_name || []).join(', '),
          year: d.first_publish_year,
          cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
          url: d.key ? `https://openlibrary.org${d.key}` : undefined,
        })));
      } else if (source === 'Internet Archive') {
        const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(`mediatype:texts ${term}`)}&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=year&rows=20&page=1&output=json`;
        const res = await fetch(url);
        const data = await res.json();
        setResults((data?.response?.docs || []).map((d: any) => ({
          title: d.title,
          author: d.creator,
          year: d.year,
          url: d.identifier ? `https://archive.org/details/${d.identifier}` : undefined,
        })));
      } else {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error('Not found');
        const d = await res.json();
        setResults([{ title: d.title, extract: d.extract, thumbnail: d.thumbnail?.source, url: d.content_urls?.desktop?.page }]);
      }
    } catch (e: any) {
      setError(e?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="h-6 w-6 text-indigo-600" />
          <h3 className="font-semibold">Search External Catalogs</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-80">
            <input className="input-field pl-9" placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <select className="input-field w-48" value={source} onChange={e => setSource(e.target.value as Source)}>
            <option>Open Library</option>
            <option>Internet Archive</option>
            <option>Wikipedia</option>
          </select>
          <button onClick={handleSearch} className="btn btn-primary md:self-auto">Search</button>
        </div>
        {loading && (
          <div className="p-4 text-center"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></div>
        )}
        {error && (
          <div className="p-3 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => (
              <div key={i} className="card">
                <div className="p-4">
                  {r.thumbnail && <img src={r.thumbnail} alt={r.title} className="w-full h-32 object-cover rounded" />}
                  {r.cover && <img src={r.cover} alt={r.title} className="w-full h-32 object-cover rounded" />}
                  <h4 className="font-semibold mt-2">{r.title}</h4>
                  {r.author && <p className="text-sm text-gray-600">{r.author}</p>}
                  {r.year && <p className="text-xs text-gray-500">{r.year}</p>}
                  {r.extract && <p className="text-sm text-gray-700 mt-2">{r.extract}</p>}
                </div>
                <div className="border-t p-3 flex justify-end">
                  {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Open</a>}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <div className="p-2 text-xs text-gray-500">Enter a query to see results.</div>
        )}
      </div>
    </div>
  );
};

export default ExternalLibrarySearch;
