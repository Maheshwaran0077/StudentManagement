import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import Badge from '../../components/Badge';
import { Search, Network, Sparkles } from 'lucide-react';

const EXAMPLE_QUERIES = [
  'Recurring hostel Wi-Fi problems during evening',
  'Food quality complaints in canteen',
  'Safety concerns near library',
  'Transport delays in the morning',
  'Harassment issues in department',
];

export default function SemanticSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSearch = async (q = query) => {
    if (!q.trim() || q.trim().length < 3) return setError('Enter at least 3 characters.');
    setError('');
    setLoading(true);
    setSearched(false);
    try {
      const { data } = await api.post('/search/semantic', { query: q.trim() });
      setResults(data.results || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.');
    } finally { setLoading(false); }
  };

  const handleExample = (ex) => { setQuery(ex); handleSearch(ex); };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Semantic Pattern Search"
        subtitle="Search patterns using natural language — powered by all-MiniLM-L6-v2 embeddings"
      />

      {/* Search box */}
      <div className="card mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input pl-9 pr-4 py-2.5"
              placeholder="e.g. recurring hostel issues during evening…"
            />
          </div>
          <button onClick={() => handleSearch()} disabled={loading} className="btn-primary px-6">
            {loading ? <Spinner size="sm" /> : <><Sparkles className="w-4 h-4" /> Search</>}
          </button>
        </div>

        {/* Example queries */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400">Try:</span>
          {EXAMPLE_QUERIES.map(ex => (
            <button key={ex} onClick={() => handleExample(ex)}
              className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-600 rounded-full transition-colors">
              {ex}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="card text-center py-10 text-gray-500">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p>No matching patterns found for "<strong>{query}</strong>".</p>
              <p className="text-sm text-gray-400 mt-1">Try a different query or run pattern discovery first.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">{results.length} pattern{results.length !== 1 ? 's' : ''} found</p>
              {results.map(r => {
                const p = r.pattern;
                return (
                  <Link key={r.id} to={`/admin/patterns/${r.id}`}
                    className="card flex items-start gap-4 hover:shadow-md transition-shadow group">
                    {/* Similarity badge */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm
                        ${r.score > 0.7 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                        {(r.score * 100).toFixed(0)}%
                      </div>
                      <span className="text-xs text-gray-400">match</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Network className="w-4 h-4 text-primary-500 shrink-0" />
                        <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                          {p?.title || `Pattern #${r.rank}`}
                        </p>
                        <span className="text-xs text-gray-400">#{r.rank}</span>
                      </div>
                      {p && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge label={p.category} variant="neutral" />
                          {p.location && <Badge label={p.location} variant="neutral" />}
                          {p.severity && <Badge label={p.severity} variant={p.severity} />}
                          {p.prediction?.trend && <Badge label={p.prediction.trend} variant={p.prediction.trend} />}
                          <span className="text-xs text-gray-400">{p.grievanceCount} grievances</span>
                        </div>
                      )}
                      {p?.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.keywords.slice(0,6).map(kw=>(
                            <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
