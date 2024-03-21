import axios from "axios";

async function fetchPokemon(id) {
  try {
    const response = await axios.get(
      `https://api.pokemontcg.io/v2/cards/${id}`,
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

export default fetchPokemon;