import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';

const datasetDirectory = './data'; // Adjust the path to your dataset directory

// Function to load cards from a specified JSON file
async function loadCardsFromJson(filePath) {
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
}

// Function to fetch and preprocess a single image
async function fetchAndPreprocessImage(card) {
  try {
    const response = await axios.get(card.imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageData = new Uint8Array(response.data);
    const imageTensor = tf.node.decodeImage(imageData, 3);
    const resizedImage = tf.image.resizeBilinear(imageTensor, [100, 100]);
    tf.dispose(imageTensor); // Dispose the unused tensor
    return resizedImage.div(tf.scalar(255)); // Normalize the image
  } catch (error) {
    console.error(`Error fetching image for ${card.id}:`, error);
    return null; // Return null for failed fetches
  }
}

// Modified function to accept file path to JSON
async function fetchAndPreprocessImages(filePath) {
  const cards = await loadCardsFromJson(filePath);
  const imageFetchPromises = cards.map(card => fetchAndPreprocessImage(card));
  const images = await Promise.all(imageFetchPromises);
  const labels = cards.map(card => cards[card.id]);

  // Filter out null images (failed fetches)
  const validImages = images.filter(img => img !== null);
  const validLabels = labels.filter((_, index) => images[index] !== null);

  return { images: validImages, labels: validLabels };
}

// Function to create the model
function createModel(numClasses) {
  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [100, 100, 3],
      kernelSize: 3,
      filters: 16,
      activation: "relu",
    })
  );
  // Additional model layers and configuration...
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: "relu" }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// Function to train the model on data from one JSON file
async function trainModelOnFile(model, filePath) {
  const { images, labels } = await fetchAndPreprocessImages(filePath);
  console.log(`Fetched ${images.length} images from ${filePath}.`);

  const xs = tf.stack(images);
  const ys = tf.tensor1d(labels, 'float32'); // Adjust according to your actual label encoding

  await model.fit(xs, ys, {
    epochs: 10,
    batchSize: 32, // Adjust based on your needs
    callbacks: [tf.callbacks.earlyStopping({ patience: 3 })],
  });

  await model.save(`file://./trained_pokemon_tcg_model`);
  console.log(`Model retrained and saved successfully after training on ${path.basename(filePath)}.`);

  tf.dispose([xs, ys]);
}

// Iterate over JSON files in the dataset directory and train sequentially
async function trainModelSequentially() {
  let files = fs.readdirSync(datasetDirectory).filter(file => file.endsWith('.json'));

  // Sort files by their leading numeric index
  files.sort((a, b) => {
    const aIndex = parseInt(a.split('_')[0], 10); // Extract the numeric index before the underscore
    const bIndex = parseInt(b.split('_')[0], 10);
    return aIndex - bIndex; // Sort numerically
  });

  // Assuming numClasses is known or computed
  const numClasses = 1252348; // Adjust based on your actual number of classes
  let model = createModel(numClasses); // Initialize model

  for (const file of files) {
    console.log(`Starting training on file: ${file}`);
    await trainModelOnFile(model, path.join(datasetDirectory, file));
    // The model is saved after each file's training
  }

  console.log('Training completed on all files.');
}

// Main function to handle the process
async function main() {
  try {
    await trainModelSequentially();
    console.log('All training sessions have been successfully completed.');
  } catch (error) {
    console.error("An error occurred during the training process:", error);
  }
}

main();
