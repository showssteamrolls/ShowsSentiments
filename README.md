# PhoRowland-Yelp-Analysis
Sentiment analysis of a friend's successful restaurant's Yelp reviews with VADER, aspect‑based scoring, and interactive visualizations

This repository implements an end‐to‐end sentiment‐analysis pipeline for Pho Rowland’s Yelp reviews. 
It scrapes review text, computes overall and sentence‐level sentiment with VADER, performs aspect‐based
sentiment extraction (food, service, price, etc), and produces a suite of interactive plots
(violin‐plots, bubble charts, co‐occurrence maps) to find some actionable insights.

## Tools Used
- Python (Jupyter Notebook)
- VADER Sentiment
- NRC Emotion Lexicon
- Dash / Altair for Visualization
- Selenium (for scraping)

## Files
- `sentiment_analysis.ipynb`: Main analysis
- `scraper.py`: Pulls reviews from Yelp
- `requirements.txt`: Dependencies