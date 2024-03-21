import cards from '../../pokemon-api-data.json' assert { type: 'json' };
import scrapeEbayImages from './scrapeEbayImages.js';
import { promises as fs } from 'fs';

async function saveToFile(data, name) {
  const dir = `./data`;
  const fileName = `${dir}/${name}.json`;

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fileName, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${fileName} with ${data.length} items.`);
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

async function scrapeEbayPokemon() {
  // const batchSize = 100;
  // const totalBatches = Math.ceil(cards.length / batchSize);

  for (const [i, card] of cards.entries()) {
    try {
      const searchQuery = `Pokemon ${card.name} ${card.number} ${card.set}`;
      const images = await scrapeEbayImages(searchQuery, 100); // Ensure this returns an array of URLs

      const newImages = [card.imageUrl, ...images];

      const data = newImages.map((imageUrl, index) => ({
        id: `${card.id}__${i}__${index}`,
        imageUrl,
      }));

      const fileName = `${i}_${card.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
      await saveToFile(data, fileName);
    } catch (err) {
      console.error(`Error processing ${card.name}:`, err);
    }
  }
}

scrapeEbayPokemon().then(() => console.log("Done scraping eBay Pokémon images."));
