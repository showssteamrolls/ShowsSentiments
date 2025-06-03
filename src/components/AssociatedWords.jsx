// src/components/AssociatedWords.jsx
import React, { useMemo } from 'react';

const stopwords = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on', 'with', 'to', 'of',
  'for', 'is', 'it', 'this', 'that', 'these', 'those', 'are', 'was', 'were',
  'be', 'been', 'have', 'has', 'had', 'i', 'you', 'he', 'she', 'they', 'we',
  'at', 'by', 'from', 'as', 'so', 'too', 'very', 'its', 'my', 'your'
]);

export default function AssociatedWords({ data, selectedWord }) {
  const topThree = useMemo(() => {
    const freq = {};
    const kw = selectedWord.toLowerCase();
    data.forEach((r) => {
      if (!r.review) return;
      const text = r.review.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      const tokens = text.split(/\s+/).filter((w) => w && w !== kw && !stopwords.has(w));
      if (!text.includes(kw)) return;
      tokens.forEach((w) => {
        freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);
  }, [data, selectedWord]);

  return (
    <div>
      {topThree.length ? (
        <ul className="list-disc list-inside">
          {topThree.map((w) => (
            <li key={w} className="text-gray-700">
              {w}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No associations found.</p>
      )}
    </div>
  );
}
