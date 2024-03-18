const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');
const https = require('https');
const cards = require("./data/pokemon_tcg_data_page_1.json");

const labelsIndex = cards.reduce((acc, obj, index) => {
  acc[obj.unique_id] = index;
  return acc;
}, {});

const numClasses = Object.keys(labelsIndex).length;

// Function to download images and return as a buffer
const downloadImageAsBuffer = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    const data = [];
    res.on('data', (chunk) => {
      data.push(chunk);
    });
    res.on('end', () => {
      resolve(Buffer.concat(data));
    });
  }).on('error', (e) => {
    reject(e);
  });
});

// Function to load and process images from a buffer
const loadImageFromBuffer = (buffer) => {
  let tfimage = tf.node.decodeImage(buffer, 3);
  tfimage = tf.image.resizeBilinear(tfimage, [224, 224]);
  tfimage = tfimage.toFloat().div(tf.scalar(255)).expandDims();
  return tfimage;
};

// Load the MobileNet model and fine-tune it
const loadAndPrepareModel = async () => {
  const mobilenetModel = await mobilenet.load();
  
  // Create a model that outputs MobileNet features for your data
  const featureModel = tf.model({
    inputs: mobilenetModel.inputs,
    outputs: mobilenetModel.layers[mobilenetModel.layers.length - 2].output
  });

  // Add new layers to train for your categories
  const model = tf.sequential({
    layers: [
      featureModel,
      tf.layers.dense({ units: 100, activation: 'relu' }),
      tf.layers.dense({ units: numClasses, activation: 'softmax' }),
    ],
  });

  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
};

// Function to train the model
const trainModel = async () => {
  const model = await loadAndPrepareModel();
  const xs = [];
  const ys = [];

  // Load and process each image
  for (let item of data) {
    const imageBuffer = await downloadImageAsBuffer(item.imageUrl);
    const image = await loadImageFromBuffer(imageBuffer);
    xs.push(image);
    ys.push(labelsIndex[item.unique_id]);
  }

  const xTrain = tf.concat(xs);
  const yTrain = tf.tensor1d(ys, 'int32');

  // Train the model
  await model.fit(xTrain, yTrain, {
    epochs: 10,
    batchSize: 2,
    callbacks: { onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}, Accuracy = ${logs.acc}`) }
  });

  // Save the model
  const saveResult = await model.save('file://./my-model-1');
  console.log('Model saved to ', saveResult);
};

trainModel().then(() => console.log('Model trained and saved.'));
