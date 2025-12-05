const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

const ES_URL = "https://distribution.virk.dk/cvr-permanent/virksomhed/_search";

app.get("/", (req, res) => {
  res.send("CVR test-proxy kører ✅");
});

app.get("/test", async (req, res) => {
  const cvr = req.query.cvr || "10150817";
  const body = {
    query: {
      bool: {
        must: [
          { term: { "Vrvirksomhed.cvrNummer": cvr } }
        ]
      }
    }
  };

  const user = process.env.CVR_USER || "";
  const pass = process.env.CVR_PASS || "";

  const headers = {
    "Content-Type": "application/json"
  };

  if (user && pass) {
    const auth = Buffer.from(`${user}:${pass}`).toString("base64");
    headers["Authorization"] = `Basic ${auth}`;
  }

  try {
    const r = await fetch(ES_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      timeout: 20000
    });

    const text = await r.text();
    res.status(200).json({
      status: r.status,
      ok: r.ok,
      bodyPreview: text.substring(0, 300),
      raw: text
    });
  } catch (e) {
    res.status(502).json({ error: "FETCH_FAILED", detail: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server kører på port ${port}`));
