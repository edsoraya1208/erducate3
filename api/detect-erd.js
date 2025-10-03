// api/detect-erd.js - IMPROVED VERSION
export const config = {
  maxDuration: 10,
};

export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://erducate.vercel.app',
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing imageUrl' });
    }

    console.log('🔍 Analyzing ERD:', imageUrl);

    // Optimize image
    const optimizedUrl = imageUrl.replace('/upload/', '/upload/w_1200,q_auto/');

    // Download image
    const imageResponse = await fetch(optimizedUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Call OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an ERD analysis expert. Analyze this Entity-Relationship Diagram.

IF THIS IS NOT AN ERD DIAGRAM, return:
{
  "isERD": false,
  "reason": "This appears to be [what it actually is]"
}

IF THIS IS AN ERD, return:
{
  "isERD": true,
  "entities": [
    {"name": "Student", "type": "strong"},
    {"name": "Enrollment", "type": "weak"}
  ],
  "relationships": [
    {
      "name": "enrolls",
      "from": "Student",
      "to": "Course",
      "cardinality": "many-to-many"
    }
  ],
  "attributes": [
    {
      "entity": "Student",
      "name": "studentID",
      "type": "primary_key"
    }
  ]
}

RULES:
- Entity types: "strong" or "weak"
- Cardinality: "one-to-one", "one-to-many", "many-to-many"
- Attribute types: "primary_key", "foreign_key", "regular", "derived", "multivalued"
- Return ONLY valid JSON, no extra text`
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${base64Image}` }
            }
          ]
        }]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    const result = JSON.parse(content);

    console.log('✅ Detection complete');
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'AI detection failed',
      details: error.message 
    });
  }
}