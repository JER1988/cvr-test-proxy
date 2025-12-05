const express = require('express');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.post('/cvr', async (req, res) => {
  try {
    const { cvr } = req.body;
    if (!cvr) return res.status(400).json({ error: "Missing cvr in body" });

    const url = 'https://distribution.virk.dk/cvr-permanent/virksomhed/_search';

    const body = {
      query: {
        bool: {
          must: [
            { term: { "Vrvirksomhed.cvrNummer": cvr } }
          ]
        }
      }
    };

    const user = process.env.CVR_USER || '';
    const pass = process.env.CVR_PASS || '';
    const auth = Buffer.from(`${user}:${pass}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    // Forward status from upstream if you want; keep it simple:
    res.status(200).send(text);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy fejl', detail: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('CVR proxy kører 🎉');
});

app.listen(port, () => console.log(`Server kører på port ${port}`));
