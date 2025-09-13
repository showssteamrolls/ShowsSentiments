import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import Papa from "papaparse"

function welfordStats(arr) {
    let n=0, mean=0, M2=0
    for (const x of arr) { n+=1; const d=x-mean; mean+=d/n; M2+=d*(x-mean) }
    const variance = n>1 ? M2/(n-1) : 0
    return { count:n, mean, std: Math.sqrt(variance) }
}

function quartileBuckets(values) {
    const idx = [...values].map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(([,i])=>i)
    const n=values.length
    const labelFor = k => k < n*0.25 ? "Very Low" : k < n*0.5 ? "Low" : k < n*0.75 ? "High" : "Very High"
    const out = new Array(n)
    idx.forEach((colIdx,rank)=>{ out[colIdx]=labelFor(rank) })
    return out
}

export default function SankeyVar({ csvUrl="/cleaned_sentiment_keywords.csv", topN=15, twoStep=false, height=520, title="Keywords → Variability" }) {
    const [table, setTable] = useState(null)

    useEffect(()=> {
        Papa.parse(csvUrl, { download:true, header:true, dynamicTyping:true, skipEmptyLines:true,
            complete: res => setTable(res.data)
        })
    }, [csvUrl])

    const { nodes, links } = useMemo(()=> {
        if (!table || table.length===0) return { nodes:[], links:[] }

        const cols = Object.keys(table[0]).filter(c => c!=="review_id" && c!=="review" && c!=="stars" && c!=="sentiment_score" && c!=="sentiment_label" && c!=="sentence_scores" && c!=="emotion")
        const stats = cols.map(col => {
            const vals=[]
            for (const row of table) { const v=row[col]; if (typeof v==="number" && !Number.isNaN(v)) vals.push(v) }
            const { count, mean, std } = welfordStats(vals)
            return { keyword: col, count, mean, std }
        }).filter(r => r.count>0)

        stats.sort((a,b)=>b.count-a.count)
        const top = stats.slice(0, topN)
        const stdBuckets = quartileBuckets(top.map(r=>r.std))
        const meanBuckets = top.map(r => r.mean < -0.05 ? "Negative" : r.mean > 0.05 ? "Positive" : "Neutral")

        if (!twoStep) {
            const left = top.map(r=>r.keyword)
            const right = Array.from(new Set(stdBuckets))
            const nodeNames = [...left, ...right]
            const idx = new Map(nodeNames.map((n,i)=>[n,i]))
            const nodes = nodeNames.map(n=>({ name:n }))
            const links = top.map((r,i)=>({ source: idx.get(r.keyword), target: idx.get(stdBuckets[i]), value: r.count }))
            return { nodes, links }
        } else {
            const left = top.map(r=>r.keyword)
            const mid = Array.from(new Set(stdBuckets))
            const right = Array.from(new Set(meanBuckets))
            const nodeNames = [...left, ...mid, ...right]
            const idx = new Map(nodeNames.map((n,i)=>[n,i]))
            const nodes = nodeNames.map(n=>({ name:n }))
            const links = []
            top.forEach((r,i)=> {
                links.push({ source: idx.get(r.keyword), target: idx.get(stdBuckets[i]), value: r.count })
            })
            const agg = {}
            top.forEach((r,i)=> {
                const k = stdBuckets[i]+"||"+meanBuckets[i]
                agg[k] = (agg[k]||0) + r.count
            })
            for (const k of Object.keys(agg)) {
                const [s,m] = k.split("||")
                links.push({ source: idx.get(s), target: idx.get(m), value: agg[k] })
            }
            return { nodes, links }
        }
    }, [table, topN, twoStep])

    const labels = nodes.map(n=>n.name)
    const bucketSet = new Set(labels.filter(l => ["Very Low","Low","High","Very High","Negative","Neutral","Positive"].includes(l)))
    const nodeColors = labels.map(l => {
        if (l==="Very Low") return "rgba(33,150,243,0.8)"
        if (l==="Low") return "rgba(76,175,80,0.8)"
        if (l==="High") return "rgba(255,193,7,0.9)"
        if (l==="Very High") return "rgba(244,67,54,0.9)"
        if (l==="Positive") return "rgba(76,175,80,0.9)"
        if (l==="Neutral") return "rgba(158,158,158,0.9)"
        if (l==="Negative") return "rgba(244,67,54,0.9)"
        return bucketSet.size ? "rgba(100,100,255,0.3)" : "rgba(120,120,120,0.3)"
    })

    return (
        <Plot
            data={[{
                type:"sankey",
                node:{ label:labels, pad:12, thickness:14, color:nodeColors },
                link:{
                    source: links.map(l=>l.source),
                    target: links.map(l=>l.target),
                    value: links.map(l=>l.value)
                }
            }]}
            layout={{ title: { text: twoStep ? "Keywords → Variability → Mean" : title }, height, autosize:true, font:{ size:12 } }}
            style={{ width:"100%" }}
            useResizeHandler
        />
    )
}
