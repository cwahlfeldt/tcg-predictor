import axios from 'axios';
import { load } from 'cheerio';
const args = process.argv.slice(2);


async function scrapeEbayImages(searchQuery, limit = 100) {
  try {
    const response = await axios(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`);

    const $ = load(response.data);
    const images = [];

    $('.srp-results').find('.s-item').each((index, element) => {
      if (index >= limit) return false; // Stop after 10 listings

      const imageElement = $(element).find('.s-item__image-wrapper img');
      const imageUrl = imageElement.attr('src');

      if (imageUrl) {
        images.push(imageUrl);
      }
    });

    return images;
  } catch (error) {
    console.error('Error scraping eBay listings:', error);
    return [];
  }
}

export default scrapeEbayImages;
