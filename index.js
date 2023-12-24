require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const urlParser = require("url");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URL);
const db = client.db("urlshort");
const urls = db.collection("short");

app.use(express.urlencoded({ extended: true }));
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const url = req.body.url;
  const urlObj = urlParser.parse(url);
  const dnslookup = dns.lookup(urlObj.hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "invalid url" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount,
      };
      const final = await urls.insertOne(urlDoc);
      res.json({ original_url: url, short_url: urlCount });
    }
  });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  const short_url = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +short_url });
  res.redirect(urlDoc.url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
