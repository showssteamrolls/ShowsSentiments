// src/App.jsx
import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { motion } from 'framer-motion';
import SentimentChart from './components/SentimentChart';
import WordCloud from './components/WordCloud';
import PlotlyBubble from './components/PlotlyBubble';
import ViolinPlot from './components/ViolinPlot';
import SankeyVar from './components/SankeyVar';
import { ErrorBoundary } from 'react-error-boundary';

export default function App() {
    const [data, setData] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(()=> {
        Papa.parse('/pho_rowland.csv', {
            download:true, header:true, dynamicTyping:true,
            complete: r => setData(r.data)
        })
    }, []);

    const base=['review_id','stars','sentiment_score'];
    const aspects=data.length ? Object.keys(data[0]).filter(c => typeof data[0][c]==='number' && !base.includes(c)) : [];

    useEffect(()=> {
        if (aspects.length && !keyword) setKeyword(aspects[0])
    }, [aspects, keyword]);

    if (!data.length) return <div className="p-6 text-center">Loading data…</div>;
    if (!keyword) return <div className="p-6 text-center">Detecting aspects…</div>;

    const review=data[currentIndex] || {};
    const sentimentColor=review.sentiment_score>0.2 ? 'text-green-600' : review.sentiment_score<-0.2 ? 'text-red-600' : 'text-gray-600';

    const summaryIntBubble=aspects.map(a => {
        const slice=data.filter(r => Number(r[a])>0);
        const mentions=slice.length;
        if (!mentions) return { keyword:a, mentions:0, avg_sent:0, std_sent:0 };
        const scores=slice.map(r => r.sentiment_score);
        const mean=scores.reduce((acc,s)=>acc+s,0)/mentions;
        const variance=scores.reduce((acc,s)=>acc+(s-mean)**2,0)/mentions;
        const stdDev=Math.sqrt(variance);
        return { keyword:a, mentions, avg_sent:Number((mean*100).toFixed(3)), std_sent:Number((stdDev*100).toFixed(3)) }
    }).filter(row => row.mentions>0);

    const valid=data.filter(r => r[keyword]>0);
    const avg=valid.length ? (valid.reduce((s,r)=>s+r[keyword],0)/valid.length).toFixed(2) : 'N/A';

    const reviewsDfLong=[];
    aspects.forEach(a => {
        data.forEach(r => {
            const v=r[a];
            if (v!==null && v!==undefined && !isNaN(v)) reviewsDfLong.push({ keyword:a, sentiment:v })
        })
    });

    return (
        <div className="font-sans text-gray-800 min-h-screen" style={{ backgroundColor:'#ee5f5b' }}>
            <header className="text-center py-8">
                <h1 className="text-5xl font-extrabold" style={{ color:'white' }}>Sentiment Dashboard: Pho Rowland</h1>
            </header>

            <div className="w-full overflow-hidden leading-none rotate-180">
                <svg viewBox="0 0 2560 100" preserveAspectRatio="none" className="w-full h-16">
                    <path d="M0,0 C1280,100 1280,100 2560,0 L2560,100 L0,100 Z" fill="white" />
                </svg>
            </div>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} className="bg-gray-50 rounded-2xl shadow-lg p-6 mx-8 mt-8 mb-8">
                <h2 className="text-2xl font-semibold mb-4">Review Explorer</h2>
                <div className="flex justify-between items-center mb-2">
                    <button onClick={()=>setCurrentIndex(i=>Math.max(0,i-1))} className="px-3 py-1 rounded bg-white shadow hover:shadow-md">← Prev</button>
                    <span className="text-sm text-gray-500">{currentIndex+1} / {data.length}</span>
                    <button onClick={()=>setCurrentIndex(i=>Math.min(data.length-1,i+1))} className="px-3 py-1 rounded bg-white shadow hover:shadow-md">Next →</button>
                </div>
                <p className="text-lg italic mb-2">"{review.review}"</p>
                <p className="text-sm"><span className="font-semibold">Sentiment Score:</span> <span className={sentimentColor}>{review.sentiment_score}</span></p>
                <p className="text-sm text-gray-500">{review.stars} star{review.stars===1?'':'s'}</p>
            </motion.div>

            {/* Sankey directly under Review Explorer */}
            <div className="px-8 mb-12">
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Keywords → Variability (std buckets)</h2>
                    <SankeyVar csvUrl="/cleaned_sentiment_keywords.csv" topN={15} twoStep={false} height={520} />
                </motion.div>
            </div>

            <div className="px-8 grid md:grid-cols-2 gap-8 mb-12">
                <motion.div key={keyword+'-chart'} initial={{ opacity:0, scale:0.9, rotate:-2 }} animate={{ opacity:1, scale:1, rotate:0 }} transition={{ duration:0.6 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <div className="mb-4 flex justify-between items-center">
                        <h2 className="text-2xl font-semibold">Average Sentiment: {avg}</h2>
                        <select value={keyword} onChange={e=>setKeyword(e.target.value)} className="px-3 py-2 rounded-lg bg-white shadow hover:shadow-md transition">
                            {aspects.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <SentimentChart data={data} aspect={keyword} barColor="blue" />
                    <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li>Plots frequency of sentiment scores (from –1 to +1)</li>
                        <li>+1 positive; -1 negative</li>
                    </ul>
                </motion.div>

                <motion.div key={keyword+'-cloud'} initial={{ opacity:0, scale:0.9, rotate:2 }} animate={{ opacity:1, scale:1, rotate:0 }} transition={{ duration:0.6, delay:0.2 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Word Cloud</h2>
                    <ErrorBoundary FallbackComponent={()=> <div>Word cloud failed.</div>}>
                        <WordCloud data={data} aspect={keyword} />
                    </ErrorBoundary>
                </motion.div>
            </div>

            <div className="px-8 grid md:grid-cols-2 gap-8 mb-12">
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Yelp Stars Distribution</h2>
                    <img src="/stars2.png" alt="Yelp Stars Distribution" className="w-full rounded" style={{ maxHeight:400, objectFit:'contain' }} />
                    <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li>Shows how many reviews fall into each star rating</li>
                    </ul>
                </motion.div>

                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Sentiment Score Distribution</h2>
                    <img src="/sentiment_dist.png" alt="Sentiment Score Distribution" className="w-full rounded" style={{ maxHeight:400, objectFit:'contain' }} />
                    <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li>Plots frequency of sentiment scores (from –1 to +1)</li>
                        <li>+1 positive; -1 negative</li>
                    </ul>
                </motion.div>
            </div>

            <div className="px-8 grid md:grid-cols-2 gap-8 pb-12">
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }} className="bg-gray-50 rounded-2xl shadow-lg p-6 flex">
                    <div className="w-2/3">
                        <h2 className="text-2xl font-semibold mb-4">Mentions vs. Average Sentiment</h2>
                        <PlotlyBubble summaryData={summaryIntBubble} />
                    </div>
                    <div className="w-1/3 pl-8 flex flex-col justify-center space-y-2">
                        <p className="text-gray-600">High mentions + High sentiment: Frequently mentioned & viewed very positively</p>
                        <p className="text-gray-600">High mentions + Low sentiment: Frequently mentioned but often criticized</p>
                        <p className="text-gray-600">Low mentions + High sentiment: Niche but highly praised</p>
                        <p className="text-gray-600">Low mentions + Low sentiment: Niche and viewed negatively</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }} className="bg-gray-50 rounded-2xl shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-4">Violin Plot: All Keywords</h2>
                    <ViolinPlot reviewsDfLong={reviewsDfLong} />
                    <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li>Shows how sentiment values for each keyword is distributed (width = density)</li>
                        <li>Width indicates frequency of mentions at that sentiment level</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    )
}
