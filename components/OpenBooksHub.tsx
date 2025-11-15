import React, { useMemo, useState } from 'react';
import BookOpenIcon from './icons/BookOpenIcon';
import SearchIcon from './icons/SearchIcon';
import ExternalLibrarySearch from './ExternalLibrarySearch';

type Platform = {
  name: string;
  url: string;
  description: string;
  category: 'Public Domain' | 'Open Textbooks' | 'OER' | 'Academic';
  tags?: string[];
};

const OpenBooksHub: React.FC = () => {
  const platforms: Platform[] = useMemo(() => ([
    { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/', description: '70,000+ free public domain ebooks in multiple formats.', category: 'Public Domain', tags: ['Classics', 'EPUB', 'Kindle'] },
    { name: 'Open Library', url: 'https://openlibrary.org/', description: 'Millions of books to borrow or read; curated public domain scans.', category: 'Public Domain', tags: ['Borrow', 'Read Online'] },
    { name: 'Internet Archive: Texts', url: 'https://archive.org/details/texts', description: 'Digitized books and texts across subjects; free access.', category: 'Academic', tags: ['Scans', 'Research'] },
    { name: 'Standard Ebooks', url: 'https://standardebooks.org/', description: 'Carefully produced, modern editions of public domain literature.', category: 'Public Domain', tags: ['Typographically polished', 'EPUB', 'Kindle'] },
    { name: 'ManyBooks (Free)', url: 'https://manybooks.net/', description: 'Large catalog including free public domain and original works.', category: 'Public Domain', tags: ['Fiction', 'Nonfiction'] },
    { name: 'Wikisource', url: 'https://wikisource.org/', description: 'Free content library of source texts, translations, and documents.', category: 'Public Domain', tags: ['Primary sources'] },
    { name: 'OpenStax', url: 'https://openstax.org/', description: 'Peer-reviewed, openly licensed college textbooks, free to download.', category: 'Open Textbooks', tags: ['STEM', 'College', 'PDF'] },
    { name: 'LibreTexts', url: 'https://libretexts.org/', description: 'Open textbooks and learning resources across STEM and other fields.', category: 'Open Textbooks', tags: ['STEM', 'Textbooks'] },
    { name: 'OER Commons', url: 'https://oercommons.org/', description: 'Discover open educational resources including textbooks and courses.', category: 'OER', tags: ['K-12', 'Higher Ed'] },
    { name: 'Saylor Academy', url: 'https://www.saylor.org/', description: 'Free courses and textbooks aligned to college-level study.', category: 'OER', tags: ['Courses', 'Textbooks'] },
    { name: 'DOAB: Directory of Open Access Books', url: 'https://www.doabooks.org/', description: 'Thousands of scholarly, peer-reviewed open access books.', category: 'Academic', tags: ['Scholarly', 'Open Access'] },
    { name: 'National Academies Press', url: 'https://nap.edu/', description: 'Free PDFs of science, engineering, and health books.', category: 'Academic', tags: ['Science', 'Policy'] },
  ]), []);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | Platform['category']>('All');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return platforms.filter(p => {
      const matchesText = !q || [p.name, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(q);
      const matchesCat = category === 'All' || p.category === category;
      return matchesText && matchesCat;
    });
  }, [platforms, search, category]);

  return (
    <div>
      <ExternalLibrarySearch />
      <div className="card mb-4">
        <div className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="font-semibold text-lg">Open Books Platforms</h2>
          </div>
          <div className="flex gap-3">
            <div className="relative w-full md:w-64">
              <input className="input-field pl-9" placeholder="Search platforms" value={search} onChange={e => setSearch(e.target.value)} />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <select className="input-field w-40" value={category} onChange={e => setCategory(e.target.value as any)}>
              <option value="All">All</option>
              <option value="Public Domain">Public Domain</option>
              <option value="Open Textbooks">Open Textbooks</option>
              <option value="OER">OER</option>
              <option value="Academic">Academic</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(p => (
          <div key={p.name} className="card flex flex-col">
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold">{p.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mt-2">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-indigo-50 text-indigo-700 border border-indigo-100">{p.category}</span>
                {(p.tags || []).map(t => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">{t}</span>
                ))}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Visit</a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-6 text-center text-gray-500">No platforms match your filter.</div>
        )}
      </div>
    </div>
  );
};

export default OpenBooksHub;
