import tf from "@tensorflow/tfjs-node";
import axios from "axios";
import cards from "../../data/pokemon_tcg_data_page_1.json" assert { type: "json" };

const args = process.argv.slice(2);

// Load the saved model
async function loadModel() {
  const model = await tf.loadLayersModel("file://./models/trained_pokemon_tcg_model/model.json");
  return model;
}

// Function to preprocess input image
async function preprocessImage(imageData) {
  const imageTensor = tf.node.decodeImage(imageData, 3); // Convert to RGB format
  const resized = tf.image.resizeBilinear(imageTensor, [100, 100]);
  const expanded = resized.expandDims(); // Add batch dimension
  const normalized = expanded.div(tf.scalar(255)); // Normalize pixel values
  return normalized;
}

// Function to fetch and preprocess a single image
async function fetchAndPreprocessImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageData = new Uint8Array(response.data);
    return imageData;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

// Main function to load model, fetch image, and make predictions
async function predictCard(imageUrl) {
  const model = await loadModel();
  if (!model) {
    console.error("Error loading the model.");
    return;
  }

  const imageData = await fetchAndPreprocessImage(imageUrl);
  if (!imageData) {
    console.error("Image data is invalid.");
    return;
  }

  const preprocessedImage = await preprocessImage(imageData);
  const prediction = model.predict(preprocessedImage);
  const predictedClassIndex = prediction.argMax(tf.axis = 1).dataSync()[0];
  const predictedCard = cards[predictedClassIndex];
  console.log("Predicted card:", predictedCard);
  return predictedCard;
}

export default predictCard;

// // Usage example
// const imageUrl = "https://images.pokemontcg.io/dp3/1_hires.png"; // Replace with the actual image URL
// predictCard(args[0] || imageUrl);