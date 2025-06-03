// src/components/PlotlyBubble.jsx
import React from 'react';
import Plot from 'react-plotly.js';

export default function PlotlyBubble({ summaryData }) {
  // summaryData is an array of objects:
  // [{ keyword: 'pho', mentions: 12, avg_sent: 85.3, std_sent: 5.4 }, …]

  const maxStd = Math.max(...summaryData.map((d) => d.std_sent));

  const traces = summaryData.map((d) => ({
    x: [d.mentions],
    y: [d.avg_sent],
    name: d.keyword,
    mode: 'markers',
    marker: {
      size: d.std_sent,
      sizemode: 'area',
      sizeref: (2 * maxStd) / (40 * 40),
      sizemin: 4,
      opacity: 0.6,
    },
    hovertemplate:
      `<b>${d.keyword}</b><br>` +
      `Mentions: %{x}<br>` +
      `Avg Sentiment: %{y}<extra></extra>`,
  }));

  const layout = {
    title: 'Mentions vs. Avg Sentiment',
    xaxis: {
      title: 'Number of Mentions',
      zeroline: false,
    },
    yaxis: {
      title: 'Average Sentiment',
      zeroline: false,
    },
    showlegend: true,
    legend: {
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.2,
      font: { size: 10 },
    },
    annotations: [
      {
        text: 'bubble size = stdev',
        xref: 'paper',
        yref: 'paper',
        x: 0.5,
        y: -0.20,
        showarrow: false,
        font: { size: 12, color: 'gray' },
      },
    ],
    margin: {
      l: 50,
      r: 50,
      t: 60,
      b: 100,
    },
    width: 600,
    height: 400,
  };

  return <Plot data={traces} layout={layout} config={{ responsive: true }} />;
}
