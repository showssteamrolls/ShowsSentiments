import React, { useState } from 'react';
import ReactWordcloud from 'react-wordcloud';
import { scaleLinear } from 'd3-scale';
import { interpolateRdYlGn } from 'd3-scale-chromatic';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'with', 'for',
  'at', 'by', 'from', 'up', 'down', 'out', 'over', 'under', 'again', 'more',
  'most', 'some', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'this',
  'that', 'it', 'as', 'not', 'no', 'so', 'if', 'they', 'you', 'i', 'my', 'we',
  'me', 'our', 'their', 'them', 'he', 'she', 'his', 'her', 'its'
]);

export default function WordCloud({ data, aspect }) {
  const [customWord, setCustomWord] = useState('');
  const [injectedWords, setInjectedWords] = useState([]);
  const [missingSentimentMsg, setMissingSentimentMsg] = useState('');

  const filtered = data.filter(r => r[aspect] > 0);
  const freqs = {};
  const sentiments = {};

  for (const r of filtered) {
    const tokens = r.review.split(/\s+/).map(w => w.toLowerCase());
    for (const word of tokens) {
      if (STOPWORDS.has(word)) continue;
      freqs[word] = (freqs[word] || 0) + 1;
      sentiments[word] = sentiments[word] || [];
      sentiments[word].push(r[aspect]);
    }
  }

  const avgSentiment = {};
  for (const word in sentiments) {
    const scores = sentiments[word];
    avgSentiment[word] = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  const colorScale = scaleLinear()
    .domain([-1, 0, 1])
    .range([interpolateRdYlGn(0), interpolateRdYlGn(0.5), interpolateRdYlGn(1)]);

  const wordList = [];
  const seen = new Set();

  for (const [text, value] of Object.entries(freqs)) {
    const avg = avgSentiment[text];
    const color = avg === undefined ? 'rgb(128,128,128)' : colorScale(avg);
    wordList.push({ text, value, color });
    seen.add(text);
  }

  for (const w of injectedWords) {
    const word = w.toLowerCase();
    if (!seen.has(word)) {
      wordList.push({
        text: word,
        value: 1,
        color: 'rgb(128,128,128)',
        title: 'user-added'
      });
      seen.add(word);
    }
  }

  const options = {
    rotations: 2,
    rotationAngles: [-45, 0, 45],
    fontSizes: [12, 36], // keep variation
  };

  const callbacks = {
    getWordColor: word => word.color || 'gray',
    getWordTooltip: word => word.title || word.text,
  };

  const handleAddWord = () => {
    const clean = customWord.trim().toLowerCase();
    if (
      clean &&
      !injectedWords.includes(clean) &&
      clean.length <= 30
    ) {
      setInjectedWords([...injectedWords, clean]);

      if (!Object.hasOwn(sentiments, clean)) {
        setMissingSentimentMsg(`No sentiment analysis available for “${clean}”`);
        setTimeout(() => setMissingSentimentMsg(''), 3000);
      }
    }
    setCustomWord('');
  };

  const handleReset = () => {
    setInjectedWords([]);
    setMissingSentimentMsg('');
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 10, display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Add word to cloud..."
          value={customWord}
          onChange={e => setCustomWord(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddWord()}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '14px',
          }}
        />
        <button
          onClick={handleAddWord}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
        {injectedWords.length > 0 && (
          <button
            onClick={handleReset}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {missingSentimentMsg && (
        <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>
          {missingSentimentMsg}
        </div>
      )}

      <div style={{ height: 200 }}>
        <ReactWordcloud
          words={wordList}
          options={options}
          callbacks={callbacks}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12 }}>
        <span style={{ color: 'gray' }}>
          Gray words = not present in current aspect's reviews
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <svg width="100%" height="36">
          <defs>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={interpolateRdYlGn(0)} />
              <stop offset="50%" stopColor={interpolateRdYlGn(0.5)} />
              <stop offset="100%" stopColor={interpolateRdYlGn(1)} />
            </linearGradient>
          </defs>
          <rect x="20" y="2" width="90%" height="16" fill="url(#sentimentGradient)" rx="4" />
          <text x="20" y="32" fontSize="10" fill="black">Negative</text>
          <text x="50%" y="32" fontSize="10" textAnchor="middle" fill="black">Neutral</text>
          <text x="95%" y="32" fontSize="10" textAnchor="end" fill="black">Positive</text>
        </svg>
      </div>
    </div>
  );
}
