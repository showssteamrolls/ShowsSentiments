// src/components/SankeyVar.jsx
import React, { useEffect, useMemo, useState } from "react"
import Plot from "react-plotly.js"
import Papa from "papaparse"

function welfordStats(arr){
    let n=0,mean=0,M2=0
    for(const x of arr){ n+=1; const d=x-mean; mean+=d/n; M2+=d*(x-mean) }
    const variance=n>1?M2/(n-1):0
    return {count:n,mean,std:Math.sqrt(variance)}
}
function quartileBuckets(values){
    const ord=values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]).map(([,i])=>i)
    const n=values.length,lab=k=>k<n*0.25?"Very Low":k<n*0.5?"Low":k<n*0.75?"High":"Very High"
    const out=new Array(n); ord.forEach((idx,rank)=>{ out[idx]=lab(rank) }); return out
}

export default function SankeyVar({ rows, csvUrl="/cleaned_sentiment_keywords.csv", topN=15, twoStep=false, height=520, title="Keywords → Variability" }){
    const [table,setTable]=useState(null)

    useEffect(()=> {
        if(rows&&rows.length){ setTable(rows); return }
        Papa.parse(csvUrl,{ download:true, header:true, dynamicTyping:true, skipEmptyLines:true, complete:r=>setTable(r.data) })
    },[rows,csvUrl])

    const {nodes,links}=useMemo(()=> {
        const data=table||[]
        if(!data.length) return {nodes:[],links:[]}
        const cols=Object.keys(data[0]||{})

        const looksLikeSummary=["keyword","count","std"].every(k=>cols.includes(k))
        if(looksLikeSummary){
            let s=[...data].map(r=>({
                keyword:String(r.keyword),
                count:Number(r.count||0),
                mean:Number(r.mean||0),
                std:Number(r.std||0),
                std_bucket:r.std_bucket?String(r.std_bucket):null,
                mean_bucket:r.mean_bucket?String(r.mean_bucket):null
            })).filter(r=>r.keyword&&r.count>0)
            s.sort((a,b)=>b.count-a.count)
            s=s.slice(0,topN)
            if(!s.length) return {nodes:[],links:[]}
            if(!s[0].std_bucket){
                const qb=quartileBuckets(s.map(r=>r.std))
                s=s.map((r,i)=>({...r,std_bucket:qb[i]}))
            }
            if(twoStep&&(!s[0].mean_bucket)){
                s=s.map(r=>({...r,mean_bucket:r.mean<-0.05?"Negative":r.mean>0.05?"Positive":"Neutral"}))
            }
            if(!twoStep){
                const left=s.map(r=>r.keyword)
                const right=[...new Set(s.map(r=>r.std_bucket))]
                const names=[...left,...right], idx=new Map(names.map((n,i)=>[n,i]))
                return {
                    nodes:names.map(n=>({name:n})),
                    links:s.map(r=>({source:idx.get(r.keyword),target:idx.get(r.std_bucket),value:r.count}))
                }
            }else{
                const left=s.map(r=>r.keyword)
                const mid=[...new Set(s.map(r=>r.std_bucket))]
                const right=[...new Set(s.map(r=>r.mean_bucket))]
                const names=[...left,...mid,...right], idx=new Map(names.map((n,i)=>[n,i]))
                const links=[]
                s.forEach(r=>links.push({source:idx.get(r.keyword),target:idx.get(r.std_bucket),value:r.count}))
                const agg={}
                s.forEach(r=>{ const k=r.std_bucket+"||"+r.mean_bucket; agg[k]=(agg[k]||0)+r.count })
                Object.entries(agg).forEach(([k,v])=>{ const [sb,mb]=k.split("||"); links.push({source:idx.get(sb),target:idx.get(mb),value:v}) })
                return {nodes:names.map(n=>({name:n})),links}
            }
        }

        const base=new Set(["review_id","review","stars","sentiment_score","sentiment_label","sentence_scores","emotion"])
        const keywordCols=cols.filter(c=>!base.has(c))
        if(!keywordCols.length) return {nodes:[],links:[]}

        const stats=keywordCols.map(col=>{
            const vals=[]
            for(const r of data){ const v=r[col]; if(typeof v==="number"&&!Number.isNaN(v)) vals.push(v) }
            const {count,mean,std}=welfordStats(vals)
            return {keyword:col,count,mean,std}
        }).filter(r=>r.count>0)
        if(!stats.length) return {nodes:[],links:[]}

        stats.sort((a,b)=>b.count-a.count)
        const top=stats.slice(0,topN)
        const stdBuckets=quartileBuckets(top.map(r=>r.std))
        const meanBuckets=top.map(r=>r.mean<-0.05?"Negative":r.mean>0.05?"Positive":"Neutral")

        if(!twoStep){
            const left=top.map(r=>r.keyword)
            const right=[...new Set(stdBuckets)]
            const names=[...left,...right], idx=new Map(names.map((n,i)=>[n,i]))
            return {
                nodes:names.map(n=>({name:n})),
                links:top.map((r,i)=>({source:idx.get(r.keyword),target:idx.get(stdBuckets[i]),value:r.count}))
            }
        }else{
            const left=top.map(r=>r.keyword)
            const mid=[...new Set(stdBuckets)]
            const right=[...new Set(meanBuckets)]
            const names=[...left,...mid,...right], idx=new Map(names.map((n,i)=>[n,i]))
            const links=[]
            top.forEach((r,i)=>links.push({source:idx.get(r.keyword),target:idx.get(stdBuckets[i]),value:r.count}))
            const agg={}
            top.forEach((r,i)=>{ const k=stdBuckets[i]+"||"+meanBuckets[i]; agg[k]=(agg[k]||0)+r.count })
            Object.entries(agg).forEach(([k,v])=>{ const [sb,mb]=k.split("||"); links.push({source:idx.get(sb),target:idx.get(mb),value:v}) })
            return {nodes:names.map(n=>({name:n})),links}
        }
    },[table,topN,twoStep])

    const labels=nodes.map(n=>n.name)
    return (
        <Plot
            data={[{ type:"sankey", node:{ label:labels, pad:12, thickness:14 },
                link:{ source:links.map(l=>l.source), target:links.map(l=>l.target),
