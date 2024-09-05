const fs = require('fs');
const path = require('path');
const axios = require('axios');



const API_URL = 'https://pookkalam-backend.amithv.xyz/api/get-published-designs';
const GALLERY_DIR = path.resolve(__dirname, 'public', 'gallery');
const DESIGNS_JSON_PATH = path.join(GALLERY_DIR, 'designs.json');

async function downloadDesigns() {
  let offset = 0;
  const limit = 100; // Adjust as needed
  let allDesignsDownloaded = false;

  // Ensure the gallery directory exists
  if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
  }

  // Load existing designs
  let designs = [];
  if (fs.existsSync(DESIGNS_JSON_PATH)) {
    designs = JSON.parse(fs.readFileSync(DESIGNS_JSON_PATH, 'utf8'));
  }

  // Get the latest design ID
  const latestId = designs.length > 0 ? Math.max(...designs.map(d => d.id)) : 0;

  while (!allDesignsDownloaded) {
    try {
      const response = await axios.get(`${API_URL}?limit=${limit}&offset=${offset}`);

      const fetchedDesigns = response.data;

      if (fetchedDesigns.length === 0) {
        allDesignsDownloaded = true;
        break;
      }

      for (const design of fetchedDesigns) {
        if (design.id > latestId) {
          const canvasPngPath = path.join(GALLERY_DIR, `${design.id}-onam-pookkalam-design-canvas.png`);
          const svgPngPath = path.join(GALLERY_DIR, `${design.id}-onam-pookkalam-design-layout.png`);

          // Save canvas PNG
          fs.writeFileSync(canvasPngPath, design.canvasPng.split(',')[1], 'base64');

          // Save SVG PNG
          fs.writeFileSync(svgPngPath, design.svgPng.split(',')[1], 'base64');

          // Add new design to the array
          designs.push({
            id: design.id,
            name: design.name,
            canvasPng: `${design.id}-onam-pookkalam-design-canvas.png`,
            svgPng: `${design.id}-onam-pookkalam-design-layout.png`,
          });

          console.log(`Downloaded new design: ${design.id}`);
        }
      }

      offset += fetchedDesigns.length;
    } catch (error) {
      console.error('Error downloading designs:', error);
      break;
    }
  }

  // Sort designs by ID in descending order (newest first)
  designs.sort((a, b) => b.id - a.id);

  // Save updated designs data to JSON file
  fs.writeFileSync(DESIGNS_JSON_PATH, JSON.stringify(designs, null, 2));
  console.log('Designs JSON updated successfully');
}

downloadDesigns();
