import tf from "@tensorflow/tfjs-node";
import axios from "axios";
import theCards1 from "../../data/0_ampharos.json" assert { type: "json" };

// console.log(theCards.length)
trainModel(theCards1);

// Function to fetch and preprocess a single image
async function fetchAndPreprocessImage(card) {
  try {
    const response = await axios.get(card.imageUrl, {
      responseType: "arraybuffer",
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

// Parallelize image fetching and preprocessing
async function fetchAndPreprocessImages(cards) {
  const imageFetchPromises = cards.map((card) => fetchAndPreprocessImage(card));
  const images = await Promise.all(imageFetchPromises);
  const labels = cards.map((card) => card.id);

  // Filter out null images (failed fetches)
  const validImages = images.filter((img) => img !== null);
  const validLabels = labels.filter((_, index) => images[index] !== null);

  return { images: validImages, labels: validLabels };
}

// Function to load or create the model
async function loadOrCreateModel(cards) {
  try {
    const model = await tf.loadLayersModel(
      "file://./trained_pokemon_tcg_model/model.json"
    );
    console.log("Model loaded successfully.");
    // The model is loaded, but we need to compile it again before training or evaluation.
    model.compile({
      optimizer: "adam",
      loss: "sparseCategoricalCrossentropy",
      metrics: ["accuracy"],
    });
    return model;
  } catch (error) {
    console.log("Model not found, creating a new one.");
    return createModel(cards.length); // This model will be compiled in the function
  }
}

// Initialize and compile the model
async function createModel(unitSize) {
  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [100, 100, 3],
      kernelSize: 3,
      filters: 16,
      activation: "relu",
    })
  );
  // Additional model layers and configuration as before...
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(
    tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: "relu" })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: unitSize, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// Train the model
async function trainModel(cards) {
  const model = await loadOrCreateModel(cards);
  const { images, labels } = await fetchAndPreprocessImages(cards);

  console.log(`Fetched ${images.length} images.`);

  const xs = tf.stack(images);
  const ys = tf.tensor1d(
    labels.map((label) => cards.findIndex((card) => card.id === label))
  );

  await model.fit(xs, ys, {
    epochs: 20,
    callbacks: tf.callbacks.earlyStopping({ patience: 3 }),
  });

  await model.save("file://./trained_pokemon_tcg_model");
  console.log("Model retrained and saved successfully.");

  // Dispose the tensors
  tf.dispose([xs, ys]);
}
