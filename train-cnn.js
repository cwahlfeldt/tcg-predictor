const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");
const fs = require("fs").promises;

// Load the JSON data containing card images and labels
const cards = require("./data/pokemon_tcg_data.json");

// Function to fetch and preprocess images
async function fetchAndPreprocessImages() {
  const images = [];
  const labels = [];
  for (const card of cards) {
    try {
      const response = await axios.get(card.imageUrl, {
        responseType: "arraybuffer",
      });
      const imageData = new Uint8Array(response.data);
      const imageTensor = tf.node.decodeImage(imageData, 3); // Convert to RGB format
      const resized = tf.image.resizeBilinear(imageTensor, [100, 100]);
      images.push(resized);
      labels.push(card.searchKeywords);
    } catch (error) {
      console.error(`Error fetching image for ${card.searchKeywords}:`, error);
    }
  }
  return { images, labels };
}

// Define the model
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

// Compile the model
model.compile({
  optimizer: "adam",
  loss: "sparseCategoricalCrossentropy",
  metrics: ["accuracy"],
});

// Train the model
async function trainModel() {
  const { images, labels } = await fetchAndPreprocessImages();
  const xs = tf.stack(images);
  const ys = tf.tensor1d(
    labels.map((label) => cards.findIndex((card) => card.searchKeywords === label))
  );

  // Normalize the pixel values
  const xsNormalized = xs.div(tf.scalar(255));

  await model.fit(xsNormalized, ys, {
    epochs: 10,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1} - loss: ${logs.loss.toFixed(
            4
          )} - accuracy: ${logs.acc.toFixed(4)}`
        );
      },
    },
  });

  // Save the model
  await model.save("file://./trained_pokemon_tcg_model");
  console.log("Model trained and saved successfully.");
}

trainModel();
