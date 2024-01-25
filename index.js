const functions = require('@google-cloud/functions-framework');
const aiplatform = require('@google-cloud/aiplatform');
const {PredictionServiceClient} = aiplatform.v1;
const {helpers} = aiplatform;

const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

const publisher = 'google';
const model = 'textembedding-gecko@001';

const predictionServiceClient = new PredictionServiceClient(clientOptions);


const project = 'oval-bot-409716';
const location = 'asia-south1';

async function getEmbeddings(instance) {
  // Configure the parent resource
  const endpoint = `projects/${project}/locations/${location}/publishers/${publisher}/models/${model}`;

  const instanceValue = helpers.toValue(instance);
  const instances = [instanceValue];

  const parameter = {
    temperature: 0,
    maxOutputTokens: 256,
    topP: 0,
    topK: 1,
  };
  const parameters = helpers.toValue(parameter);

  const request = {
    endpoint,
    instances,
    parameters,
  };

  const [response] = await predictionServiceClient.predict(request);
  const predictions = response.predictions;
  return predictions;
}

functions.http('generate', (req, res) => {
  if(req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  res.set('Access-Control-Allow-Origin', '*');

  if(req.body.productTile === undefined || req.body.content === undefined) {
    res.status(400).send('Bad Request');
    return;
  }
  const _title =req.body.productTile;
  const _content = req.body.content;
  const instance = {
    task_type: 'RETRIEVAL_DOCUMENT',
    title: _title,
    content: _content,
  };
  const result = getEmbeddings(instance);

  return result.then((data) => {
    res.status(200).send(data);
  }).catch((err) => {
    console.error(err);
    res.status(500).send(err);
  });
});