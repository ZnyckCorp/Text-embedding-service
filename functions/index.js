const functions = require('firebase-functions');
const admin = require('firebase-admin');
const aiplatform = require('@google-cloud/aiplatform');

const {PredictionServiceClient} = aiplatform.v1;

const {helpers} = aiplatform;

admin.initializeApp();

// Constants
const PROJECT_ID = 'oval-bot-409716';
const PUBLISHER = 'google';
const MODEL = 'textembedding-gecko@003'; 
const location = 'us-central1';
const TASK_TYPE = 'RETRIEVAL_DOCUMENT';

const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

const predictionServiceClient = new PredictionServiceClient(clientOptions);

async function callPredict(req,res) {
  const endpoint = `projects/${PROJECT_ID}/locations/${location}/publishers/${PUBLISHER}/models/${MODEL}`;
  const instance = { 
      task_type: TASK_TYPE, 
      title: req.body.title, 
      content: req.body.content 
   };
  const instanceValue = helpers.toValue(instance);
  const instances = [instanceValue];

  const parameter = {
    temperature: 0,
    maxOutputTokens: 256, 
    topP: 0, 
    topK: 1 
  };
  const parameters = helpers.toValue(parameter);

  const request = { endpoint, instances, parameters };

  // Predict request
  return await predictionServiceClient.predict(request).then((_res)=>{
    return res.status(200).send({data : _res});
  }).catch((err)=>{
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  });
}

exports.predictFunction = functions.https.onRequest(async (req, res) => {
  try {
    // Validate that the request method
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    //Validate that the request has a body and content property
    if (!req.body || !req.body.content || !req.body.title || !req.body.secret_code || req.body.secret_code !== functions.config().config.secret_code) {
      return res.status(400).json({ error: 'Bad Request', details: 'Request body error.' });
    }

    //length validation
    if (req.body.title.length >= 100) {
      return res.status(400).json({ error: 'Bad Request', details: 'Request body title should not contain more than 100 characters' });
    }
    
    if (req.body.content.length >= 2000) {
      return res.status(400).json({ error: 'Bad Request', details: 'Request body content should not contain more than 2000 characters.' });
    }
    
    // Call AI Platform Prediction
    return await callPredict(req,res)

  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});
