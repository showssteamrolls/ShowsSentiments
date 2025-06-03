import React from 'react'
import Plot from 'react-plotly.js'

const ViolinPlot = ({ reviewsDfLong }) => {
  const keywords = Array.from(
    new Set(reviewsDfLong.map((row) => row.keyword))
  )

  const traces = keywords.map((kw) => {
    const subset = reviewsDfLong.filter((r) => r.keyword === kw)
    return {
      type: 'violin',
      x: subset.map(() => kw),
      y: subset.map((r) => r.sentiment),
      name: kw,
      box: { visible: true },
      meanline: { visible: true },
      opacity: 0.6,
      visible: true,
    }
  })

  const layout = {
    title: 'Violin Plot: All Keywords',
    xaxis: { title: 'Keyword' },
    yaxis: { title: 'Sentiment Score' },
    width: 700,
    height: 400,
    margin: { l: 50, r: 50, t: 80, b: 50 },
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
      <div style={{ width: '700px', margin: '0 auto' }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ responsive: false }}
          style={{ width: '700px', height: '400px' }}
        />
      </div>
    </div>
  )
}

export default ViolinPlot
