const express = require("express");
const app = express();

app.use(express.json());

// Root / homepage
app.get("/", (req, res) => {
  res.send("CVR proxy kører 🎉");
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Koyeb CVR proxy kører ✔️" });
});

// Diagnostic route: Test if Koyeb can reach CVR API server
app.get("/ping-cvr", async (req, res) => {
  try {
    const result = await fetch("https://distribution.virk.dk/cvr-permanent/");
    return res.json({
      ok: true,
      status: result.status,
      message: "CVR server reachable ✔️"
    });
  } catch (err) {
    return res.json({
      ok: false,
      error: err.message,
      message: "CVR API kan ikke nås fra denne server ❌"
    });
  }
});

// Main CVR search route
app.get("/search", async (req, res) => {
  const cvr = req.query.cvr;

  if (!cvr) {
    return res.status(400).json({ error: "Mangler cvr parameter" });
  }

  const url = "https://distribution.virk.dk/cvr-permanent/virksomhed/_search";

  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  if (!user || !pass) {
    return res.status(500).json({ error: "CVR login ikke sat i miljøvariabler" });
  }

  const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

  const body = {
    query: {
      bool: {
        must: [
          { term: { "Vrvirksomhed.cvrNummer": Number(cvr) } }
        ]
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();

    return res.status(response.status).send(text);

  } catch (err) {
    return res.status(500).json({
      error: "Serverfejl",
      details: err.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("CVR proxy kører på port " + PORT);
});
