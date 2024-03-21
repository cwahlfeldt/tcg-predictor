const fs = require('fs');
const path = require('path');

// Directory containing JSON files
const directoryPath = path.join(__dirname, './data'); // Adjust 'jsonFiles' to your directory name
// Output file path
const outputFile = path.join(__dirname, 'all-training-pokemon-data.json');

// Read the directory
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error('Could not list the directory.', err);
  }

  const allData = [];

  files.forEach(file => {
    // Make sure to process only JSON files
    if (path.extname(file) === '.json') {
      const filePath = path.join(directoryPath, file);
      // Read and parse each JSON file
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      // Merge the data into the allData array
      allData.push(...data);
    }
  });

  // Save the merged data to a new file
  fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2), 'utf8');
  console.log('All data has been merged and saved to:', outputFile);
});
