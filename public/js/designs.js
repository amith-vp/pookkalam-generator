document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayDesigns();
  setupModal();
});

let designs = [];
let currentIndex = 0;
const itemsPerPage = 10;

function fetchAndDisplayDesigns() {
  fetch('/public/gallery/designs.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      designs = data;
      shuffleDesigns(); // Shuffle the designs array
      displayDesigns();
    })
    .catch(error => {
      console.error('Error fetching designs:', error);
      document.getElementById('gallery-container').innerHTML = '<p>Error loading designs. Please try again later.</p>';
    });
}

function shuffleDesigns() {
  for (let i = designs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [designs[i], designs[j]] = [designs[j], designs[i]];
  }
}

function displayDesigns() {
  const galleryContainer = document.getElementById('gallery-container');
  const endIndex = Math.min(currentIndex + itemsPerPage, designs.length);

  for (let i = currentIndex; i < endIndex; i++) {
    const design = designs[i];
    const designElement = createDesignElement(design);
    galleryContainer.appendChild(designElement);
  }

  currentIndex = endIndex;

  // Initialize lazy loading for new images
  initLazyLoad();

  // Check if all designs have been displayed
  if (currentIndex >= designs.length) {
    window.removeEventListener('scroll', scrollHandler);
  }
}

function createDesignElement(design) {
  const element = document.createElement('div');
  element.className = 'relative group overflow-hidden rounded-lg shadow-md cursor-pointer';
  element.onclick = () => viewDesign(design.id, design.name, design.canvasPng, design.svgPng);
  element.innerHTML = `
    <img data-src="/public/gallery/${design.canvasPng}" alt="Pookkalam design, athapookkalm design , pookkalam layout,onam" class="lazy object-cover w-full h-64 transition-transform duration-300 group-hover:scale-105">
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4">
      <span class="text-white text-xs mb-2">Created by: ${design.name}</span> <!-- Added created by -->
      <span class="bg-white text-amber-900 px-4 py-2 rounded-md">View Design</span>
    </div>
  `;
  return element;
}

function initLazyLoad() {
  const lazyImages = document.querySelectorAll('img.lazy');
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => {
    observer.observe(img);
  });
}

function scrollHandler() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    displayDesigns();
  }
}

window.addEventListener('scroll', scrollHandler);

function setupModal() {
  const modal = document.getElementById('designModal');
  const closeBtn = document.getElementById('closeModal');
  
  closeBtn.onclick = function() {
    modal.classList.add('hidden');
  }
  
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.classList.add('hidden');
    }
  }
}

function viewDesign(id, name, canvasPng, svgPng) {
  const modal = document.getElementById('designModal');
  const modalContent = document.getElementById('modalContent');
  
  modalContent.innerHTML = `
    <div class="flex justify-center mb-4">
      <img src="/public/gallery/${canvasPng}" alt="Pookkalam design, athapookkalm design , pookkalam layout,onam" class="max-w-full h-auto">
    </div>
        <span class="text-sm font-bold mb-4">Created by: ${name}</span> 

    <div class="flex justify-center space-x-4">
      <button onclick="downloadPNG('/public/gallery/${canvasPng}', 'pookkalam.png')" class="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">Download Pookkalam</button>
      <button onclick="downloadPNG('/public/gallery/${svgPng}', 'layout.png')" class="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">Download Layout</button>
    </div>
  `;  
  modal.classList.remove('hidden');
}

function downloadPNG(pngUrl, fileName) {
  const a = document.createElement('a');
  a.href = pngUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

