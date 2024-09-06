function showInitialIndication() {
  const hasSeenIndication = localStorage.getItem('hasSeenIndication');
  if (!hasSeenIndication) {
  
  // Create a semi-transparent overlay
  const overlay = document.createElement('div');
  overlay.classList.add('full-page-overlay');
  document.body.appendChild(overlay);

  // Highlight elements
  const drawingArea = document.getElementById('drawingArea');
  highlightElement(drawingArea, 'Drawing Area', 'Create your design here!');

  const shapeMenu = document.getElementById('shapearea');
  highlightElement(shapeMenu, 'Shape Menu', 'Drag shapes from here to drawing area');

  const outputArea = document.getElementById('mandalaCanvas');
  highlightElement(outputArea, 'Output Area', 'Pookkalam will be displayed here');

  // Create arrow indicating drag direction
  const arrow = document.createElement('div');
  arrow.classList.add('drag-arrow');
  document.body.appendChild(arrow);

  // Position the arrow to point from shape menu to the drawing area
  const shapeMenuRect = shapeMenu.getBoundingClientRect();
  const drawingAreaRect = drawingArea.getBoundingClientRect();
  arrow.style.left = `${drawingAreaRect.right}px`;
  arrow.style.top = `${(drawingAreaRect.top + drawingAreaRect.bottom) / 2}px`;

  // Remove overlay and highlights after a delay or on user interaction
  const removeHighlights = () => {
    overlay.remove();
    document.querySelectorAll('.highlight-box, .highlight-label, .drag-arrow').forEach(el => el.remove());
    document.removeEventListener('click', removeHighlights);
  };

  setTimeout(removeHighlights, 10000); // Remove after 10 seconds
  document.addEventListener('click', removeHighlights);
  localStorage.setItem('hasSeenIndication', 'true');
}
}
function highlightElement(element, title, description) {
  if (!element) {
    console.error(`Element not found for highlighting: ${title}`);
    return;
  }

  const rect = element.getBoundingClientRect();
  
  // Create highlight box
  const highlightBox = document.createElement('div');
  highlightBox.classList.add('highlight-box');
  highlightBox.style.position = 'absolute';
  highlightBox.style.left = `${rect.left}px`;
  highlightBox.style.top = `${rect.top}px`;
  highlightBox.style.width = `${rect.width}px`;
  highlightBox.style.height = `${rect.height}px`;
  document.body.appendChild(highlightBox);

  // Create label
  const label = document.createElement('div');
  label.classList.add('highlight-label');
  label.innerHTML = `
    <h3>${title}</h3>
    <p>${description}</p>
  `;
  
  // Position label inside the highlight box
  label.style.position = 'absolute';
  label.style.left = '10px';
  label.style.top = '10px';
  label.style.maxWidth = `${rect.width - 20}px`;
  highlightBox.appendChild(label);
}