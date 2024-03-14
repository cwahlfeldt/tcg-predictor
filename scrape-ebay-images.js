const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeEbayListingImages(searchQuery) {
  try {
    const response = await axios.get(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}`);

    const $ = cheerio.load(response.data);
    const images = [];

    $('.srp-results').find('.s-item').each((index, element) => {
      if (index >= 10) return false; // Stop after 10 listings

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

// Example usage
const searchQuery = 'charizard base set psa 10';
scrapeEbayListingImages(searchQuery)
  .then(images => {
    console.log('Listing Images:', images);
  })
  .catch(error => {
    console.error('Error:', error);
  });
