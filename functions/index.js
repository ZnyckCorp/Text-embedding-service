const functions = require('firebase-functions');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const admin = require('firebase-admin');
admin.initializeApp();

const PROJECT_ID = 'oval-bot-409716'; // Replace with your Google Cloud project ID
const MODEL = 'textembedding-gecko@003'; // Replace with your AI Platform endpoint ID

exports.predictFunction = functions.https.onRequest(async (req, res) => {
  try {
    
    // Validate that the request has a body and content property
    if (!req.body || !req.body.content || !req.body.title || !req.body.secret_code || req.body.secret_code  !== functions.config().config.secret_code) {
      res.status(400).json({ error: 'Bad Request', details: 'Request body error.'});
      return;
    }

   
    const modelEndpoint = `projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/${MODEL}`;
    // const [accessTokenResponse] = await client.auth.getAccessToken();

    const API_ENDPOINT = `https://us-central1-aiplatform.googleapis.com/v1/${modelEndpoint}:predict`;

    const data = {
      instances: [{ task_type: 'RETRIEVAL_DOCUMENT', title: req.body.title, content: req.body.content }],
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${functions.config().config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    return res.status(200).send(responseData);

  } catch (error) {
    console.error('Error making prediction:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});
