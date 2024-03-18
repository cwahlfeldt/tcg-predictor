const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");
const cards = require("./data/pokemon_tcg_data_page_1.json");

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
    return resizedImage;
  } catch (error) {
    console.error(`Error fetching image for ${card.searchKeywords}:`, error);
    return null; // Return null for failed fetches
  }
}

// Parallelize image fetching and preprocessing
async function fetchAndPreprocessImages() {
  const imageFetchPromises = cards.map(card => fetchAndPreprocessImage(card));
  const images = await Promise.all(imageFetchPromises);
  const labels = cards.map(card => card.searchKeywords);

  // Filter out null images (failed fetches)
  const validImages = images.filter(img => img !== null);
  const validLabels = labels.filter((_, index) => images[index] !== null);

  return { images: validImages, labels: validLabels };
}

// Initialize and compile the model
function createModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.conv2d({
      inputShape: [100, 100, 3],
      kernelSize: 3,
      filters: 16,
      activation: "relu",
    })
  );
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.conv2d({ kernelSize: 3, filters: 32, activation: "relu" }));
  model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: cards.length, activation: "softmax" }));

  model.compile({
    optimizer: "adam",
    loss: "sparseCategoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// Train the model
async function trainModel() {
  const model = createModel();
  const { images, labels } = await fetchAndPreprocessImages();

  const xs = tf.stack(images);
  images.forEach(img => tf.dispose(img)); // Dispose images after stacking
  const ys = tf.tensor1d(
    labels.map(label =>
      cards.findIndex(card => card.searchKeywords === label)
    )
  );

  const xsNormalized = xs.div(tf.scalar(255));

  await model.fit(xsNormalized, ys, {
    epochs: 10,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1} - loss: ${logs.loss.toFixed(4)} - accuracy: ${logs.acc.toFixed(4)}`);
      },
    },
  });

  await model.save("file://./trained_pokemon_tcg_model");
  console.log("Model trained and saved successfully.");

  // Dispose the tensors
  tf.dispose([xs, ys, xsNormalized]);
}

trainModel();
