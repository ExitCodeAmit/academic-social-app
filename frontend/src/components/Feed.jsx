import React, { useEffect, useState } from 'react';
import API from '../api/axios';

export default function Feed() {
  const [papers, setPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPapers = async (query = '') => {
    try {
      setLoading(true);
      const res = await API.get(`/papers?search=${query}`);
      setPapers(res.data);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPapers(searchTerm);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Academic Research Feed</h2>
      
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by title or domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '70%', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Search</button>
      </form>

      {loading ? (
        <p>Loading research papers...</p>
      ) : papers.length === 0 ? (
        <p>No research papers found.</p>
      ) : (
        papers.map((paper) => (
          <div
            key={paper.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '15px',
            }}
          >
            <h3>{paper.title}</h3>
            <p><strong>Author:</strong> {paper.author_name} | <strong>Domain:</strong> {paper.domain}</p>
            <p>{paper.abstract}</p>
            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
              View Full PDF
            </a>
          </div>
        ))
      )}
    </div>
  );
}