const axios = require("axios");
const fs = require("fs");

// Function to fetch data from the Pokemon TCG API
async function fetchData(pageNumber) {
  try {
    const response = await axios.get(
      `https://api.pokemontcg.io/v2/cards?page=${pageNumber}&pageSize=100`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Function to save data to a JSON file
function saveToFile(data) {
  const fileName = `data/pokemon_tcg_all_pages.json`;
  fs.writeFile(fileName, JSON.stringify(data), (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log(`Data saved to ${fileName}`);
    }
  });
}

// Main function to scrape and save data
async function scrapeAndSaveData() {
  let allData = []; // Accumulate data from all pages

  // Fetch the first page to get metadata
  const firstPageData = await fetchData(1);
  if (!firstPageData) {
    console.error("Failed to fetch data for the first page.");
    return;
  }

  // Extract total count and calculate total pages
  const totalCount = firstPageData.totalCount;
  const pageSize = firstPageData.pageSize;
  // const totalPages = Math.ceil(totalCount / pageSize);
  const totalPages = 2;

  console.log(`Total pages available: ${totalPages}`);

  // Fetch and accumulate data for each page
  for (let i = 1; i <= totalPages; i++) {
    console.log(`Fetching data for page ${i}...`);
    const data = await fetchData(i);
    if (data) {
      const processedData = data.data.map((pokemon) => {
        return {
          id: pokemon.id,
          listingName: `${pokemon.name} | ${pokemon.set.series} - ${pokemon.set.name} | ${pokemon.number}/${pokemon.set.total} | ${pokemon.rarity}`,
          name: pokemon.name,
          imageUrl: pokemon.images.large,
          superType: pokemon.supertype,
          subTypes: pokemon.subtypes,
          level: pokemon.level,
          hp: pokemon.hp,
          types: pokemon.types,
          setName: pokemon.set.name,
          seriesName: pokemon.set.series,
          setTotal: pokemon.set.total,
          numberInSet: pokemon.number,
          rarity: pokemon.rarity,
          artist: pokemon.artist,
          attacks: pokemon.attacks,
          weaknesses: pokemon.weaknesses,
          flavorText: pokemon.flavorText,
          nationalPokedexNumbers: pokemon.nationalPokedexNumbers,
        };
      });
      allData = allData.concat(processedData); // Append data from current page
    }
  }

  // Save all accumulated data to a single file
  saveToFile(allData);
}

// Call the main function to start scraping
scrapeAndSaveData();
