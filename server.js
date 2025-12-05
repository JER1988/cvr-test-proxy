const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// ENV variables fra Koyeb
const ES_ENDPOINT = process.env.ES_ENDPOINT || "http://distribution.virk.dk/cvr-permanent/virksomhed/_search";
const CVR_USER = process.env.CVR_USER;
const CVR_PASS = process.env.CVR_PASS;

function authHeader() {
  if (!CVR_USER || !CVR_PASS) return {};
  const token = Buffer.from(`${CVR_USER}:${CVR_PASS}`).toString("base64");
  return { "Authorization": `Basic ${token}` };
}

// Health check
app.get("/_health", (req, res) => res.json({ ok: true, message: "CVR proxy kører" }));

// CVR endpoint
app.get("/cvr", async (req, res) => {
  const cvr = (req.query.nummer || "").replace(/\D/g, "");

  if (!cvr || cvr.length !== 8) {
    return res.status(400).json({ error: "Ugyldigt CVR-nummer" });
  }

  const body = {
    query: {
      bool: {
        must: [
          { term: { "Vrvirksomhed.cvrNummer": cvr } }
        ]
      }
    }
  };

  try {
    const response = await fetch(ES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader()
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data;

    try { data = JSON.parse(text); }
    catch { data = text; }

    res.json({
      status: response.status,
      ok: response.ok,
      data
    });

  } catch (err) {
    res.status(500).json({ error: "FETCH_FAILED", detail: err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`CVR proxy kører på port ${PORT}`));
