const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 8080;
const newsApiKey = process.env.NEWS_API_KEY;
const CACHE_DURATION = 1000 * 60 * 1; 
app.use(cors()); 


let cachedNews = null;
let cacheTime = null;
let fetchingNews = false;
let fetchQueue = [];

const fetchNews = async () => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`
    );
    cachedNews = response.data.articles; 
    cacheTime = Date.now(); 
    return cachedNews;
  } catch (error) {
    throw new Error("Failed to fetch news headlines");
  } finally {
    fetchingNews = false; 
    fetchQueue.forEach((resolve) => resolve(cachedNews)); 
    fetchQueue = []; 
  }
};

app.get("/api/news", async (req, res) => {
  if (cachedNews && cacheTime > Date.now() - CACHE_DURATION) {
    return res.json(cachedNews);
  }

  if (fetchingNews) {
    return new Promise((resolve) => {
      fetchQueue.push(resolve);
    }).then((news) => res.json(news));
  }

  fetchingNews = true;
  try {
    const news = await fetchNews();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});