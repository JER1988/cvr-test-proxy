const express = require("express");

const app = express();
app.use(express.json());

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Koyeb CVR proxy kører ✔️" });
});

// CVR søgning
app.get("/search", async (req, res) => {
  const cvr = req.query.cvr;

  if (!cvr) {
    return res.status(400).json({ error: "Mangler cvr parameter" });
  }

  const url = "https://distribution.virk.dk/cvr-permanent/virksomhed/_search";

  const user = process.env.CVR_USER;
  const pass = process.env.CVR_PASS;

  const authHeader = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

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
    // Node 18+ har indbygget fetch ✔
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    res.send(text);

  } catch (err) {
    return res.status(500).json({
      error: "Serverfejl",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("CVR proxy kører på port " + PORT);
});
