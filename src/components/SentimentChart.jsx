import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function SentimentChart({ data, aspect, barColor }) {
  const valid = data.filter(r => r[aspect] > 0);
  const avg = valid.length
    ? valid.reduce((s, r) => s + r[aspect], 0) / valid.length
    : 0;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={[{ name: aspect, value: avg }]}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[-1, 1]} />
        <Tooltip
          contentStyle={{ borderRadius: '0.5rem', padding: '0.5rem' }}
          itemStyle={{ color: '#333' }}
        />
        <Bar dataKey="value" fill={barColor === 'blue' ? '#3b82f6' : '#f97316'} />
      </BarChart>
    </ResponsiveContainer>
  );
}
