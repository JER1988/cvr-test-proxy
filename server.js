import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.post("/cvr", async (req, res) => {
  try {
    const { cvr } = req.body;

    const url = "https://distribution.virk.dk/cvr-permanent/virksomhed/_search";

    const body = {
      query: {
        bool: {
          must: [
            { term: { "Vrvirksomhed.cvrNummer": cvr } }
          ]
        }
      }
    };

    const auth = Buffer.from(
      process.env.CVR_USER + ":" + process.env.CVR_PASS
    ).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + auth,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.text();
    res.status(200).send(data);

  } catch (err) {
    res.status(500).json({ error: "Proxy fejl", detail: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("CVR proxy kører 🎉");
});

app.listen(port, () => console.log("Server kører på port", port));
