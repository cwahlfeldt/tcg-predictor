import axios from "axios";
import { writeFile } from "fs";
// import scrapeEbayListingImages from "./scrape-ebay-images.js";

const PAGE_SIZE = 100;
const START_PAGE_NUM = 1;

// Function to fetch data from the Pokemon TCG API
async function fetchData(pageNumber) {
  try {
    const response = await axios.get(
      `https://api.pokemontcg.io/v2/cards?page=${pageNumber}&pageSize=${PAGE_SIZE}`,
      {
        headers: {
          'x-api-key': 'ad5d099b-3780-43c6-a1f2-ea48abf24d95',
          'Content-Type': 'application/json' // Adjust content type as per your API's requirements
        }
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Function to save data to a JSON file
function saveToFile(data, pageNum) {
  const fileName = `data/pokemon_tcg_data_page_${pageNum}.json`;
  writeFile(fileName, JSON.stringify(data), (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`Data saved to ${fileName}`);
    }
  });
}

async function processPokemonData(data) {
  // Use async/await with Promise.all to handle the asynchronous operation
  const processedData = await Promise.all(data.data.map(async (pokemon, i) => {
    // Call the async function to get the image URLs for the current pokemon

    const pokemonData = {
      id: pokemon.id, // Modify the id to ensure uniqueness
      imageUrl: pokemon.images.large, // Use the image URL from the async function
      name: pokemon.name,
      set: pokemon.set.name,
      series: pokemon.set.series,
      number: pokemon.number,
      setTotal: pokemon.set.total,
      rarity: pokemon?.rarity ? pokemon.rarity : '',
    };

    // const ebayListingImages = await scrapeEbayListingImages(pokemonData.searchKeywords);

    // Map each image URL to a new object structure
    // const ebayListings = ebayListingImages.map((imageUrl, index) => ({
    //   id: pokemon.id, // Modify the id to ensure uniqueness
    //   unique_id: `${pokemon.id}_${index}`, // Modify the id to ensure uniqueness
    //   searchKeywords: `Pokémon TCG ${pokemon.name} ${pokemon.set.series} ${pokemon.set.name} ${pokemon.number}/${pokemon.set.total} ${pokemon?.rarity ? pokemon.rarity : ''}`,
    //   name: pokemon.name,
    //   imageUrl: imageUrl, // Use the image URL from the async function
    // }));

    return [pokemonData];
  }));

  // Flatten the array since the previous step returns an array of arrays
  return processedData.flat();
}

// Main function to scrape and save data
async function scrapeAndSaveData() {

  // Fetch the first page to get metadata
  const firstPageData = await fetchData(1);
  if (!firstPageData) {
    console.error("Failed to fetch data for the first page.");
    return;
  }

  // Extract total count and calculate total pages
  const totalCount = firstPageData.totalCount;
  const pageSize = firstPageData.pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);

  console.log(`Total pages available: ${totalPages}`);

  let allData = []; // Accumulate data from all pages
  // Fetch and accumulate data for each page
  for (let i = START_PAGE_NUM; i <= totalPages; i++) {
    console.log(`Fetching data for page ${i}...`);
    const data = await fetchData(i);

    const pokemonData = await processPokemonData(data);
    allData = allData.concat(pokemonData);
  }

  saveToFile(allData, 1);
}

// Call the main function to start scraping
scrapeAndSaveData();
