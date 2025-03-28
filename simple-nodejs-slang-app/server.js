require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/slang', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT term, count FROM slangs ORDER BY count DESC'
    );
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/slang/search', async (req, res) => {
  const term = req.query.term;
  if (!term) return res.status(400).json({ error: 'Term is required' });

  try {
    const [results] = await db.query(
      'SELECT * FROM slangs WHERE term = ? LIMIT 1',
      [term]
    );

    if (results.length > 0) {
      await db.query(
        'UPDATE slangs SET count = count + 1 WHERE term = ?',
        [term]
      );
      return res.json({ 
        ...results[0],
        exists: true
      });
    }
    
    const geminiResponse = await fetchGeminiDefinition(term);
    
    if (geminiResponse === null) {
      return res.status(502).json({ error: 'Failed to fetch definition from Gemini' });
    }
    
    if (!geminiResponse.includes('Slang not found!')) {
      await db.query(
        'INSERT INTO slangs (term, meaning) VALUES (?, ?)',
        [term, geminiResponse]
      );
      return res.json({
        term,
        meaning: geminiResponse,
        exists: true
      });
    }
    
    res.json({
      term,
      meaning: 'Slang not found!',
      exists: false
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { service_id, template_id, template_params, user_id } = req.body;
  
  try {
    const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id,
        template_id,
        template_params,
        user_id,
        accessToken: process.env.EMAILJS_ACCESS_TOKEN
      })
    });

    if (emailjsResponse.ok) {
      res.json({ success: true });
    } else {
      throw new Error('EmailJS request failed');
    }
  } catch (err) {
    console.error('EmailJS error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

async function fetchGeminiDefinition(term) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `What does '${term}' mean in Gen Z slang? Respond in 50 words or less. If you are confident that '${term}' is not a valid word, respond with exactly: "Slang not found!"`
          }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error('Gemini API error:', err);
    return null;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});