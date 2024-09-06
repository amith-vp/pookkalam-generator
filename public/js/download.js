function setSVGAttributesForMandala(svg) {
  if (svg.classList.contains('random-mandala')) { // Check if it's a random mandala
    const elements = svg.querySelectorAll('*');
    elements.forEach(element => {
      element.setAttribute('stroke', 'black');
      element.removeAttribute('style'); // Remove existing fill attribute
      element.setAttribute('fill', 'white');
    });
  }
}


function addGridlinesToSVG(svg) {
  const gridSize = 20; // Size of the grid cells
  const width = svg.viewBox.baseVal.width;
  const height = svg.viewBox.baseVal.height;
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('stroke', '#e0e0e0');
  gridGroup.setAttribute('stroke-width', '0.5');

  // Draw vertical gridlines
  for (let x = 0; x <= width; x += gridSize) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', x);
    line.setAttribute('y2', height);
    gridGroup.appendChild(line);
  }

  // Draw horizontal gridlines
  for (let y = 0; y <= height; y += gridSize) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', width);
    line.setAttribute('y2', y);
    gridGroup.appendChild(line);
  }

  svg.appendChild(gridGroup);
}

function drawGridlinesOnCanvas(ctx, width, height) {
  const gridSize = 20; // Size of the grid cells
  ctx.strokeStyle = '#e0e0e0'; // Color of the gridlines
  ctx.lineWidth = 0.5; // Width of the gridlines

  // Draw vertical gridlines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal gridlines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function addLogoToCanvas(ctx, width, height) {
  const logo = new Image();
  logo.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"></path><path d="M12 7.5V9"></path><path d="M7.5 12H9"></path><path d="M16.5 12H15"></path><path d="M12 16.5V15"></path><path d="m8 8 1.88 1.88"></path><path d="M14.12 9.88 16 8"></path><path d="m8 16 1.88-1.88"></path><path d="M14.12 14.12 16 16"></path></svg>');
  
  logo.onload = function() {
    ctx.drawImage(logo, 10, height - 78, 58, 58); // Increased size to 58x58
    
    // Add text next to the logo
    ctx.fillStyle = '#000';
    ctx.font = '50px Arial'; // Increased font size to 50px
    ctx.fillText('Pookkalam.dev', 80, height - 30); // Adjusted position
  };

  // Ensure the logo is drawn even if it's already loaded
  if (logo.complete) {
    ctx.drawImage(logo, 10, height - 78, 58, 58); // Increased size to 58x58
    ctx.fillStyle = '#000';
    ctx.font = '50px Arial'; // Increased font size to 50px
    ctx.fillText('Pookkalam.dev', 80, height - 30); // Adjusted position
  }
}

function addLogoToSVG(svg, width, height) {
  const logoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const logoSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"></path>
      <path d="M12 7.5V9"></path>
      <path d="M7.5 12H9"></path>
      <path d="M16.5 12H15"></path>
      <path d="M12 16.5V15"></path>
      <path d="m8 8 1.88 1.88"></path>
      <path d="M14.12 9.88 16 8"></path>
      <path d="m8 16 1.88-1.88"></path>
      <path d="M14.12 14.12 16 16"></path>
    </svg>
  `;

  const logoContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  logoContainer.innerHTML = logoSVG;
  logoContainer.setAttribute('transform', `translate(10, ${height - 24})`);
  logoGroup.appendChild(logoContainer);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 40);
  text.setAttribute('y', height - 7);
  text.setAttribute('fill', 'black');
  text.setAttribute('font-size', '16');
  text.textContent = 'Pookkalam.dev';
  logoGroup.appendChild(text);

  svg.appendChild(logoGroup);
}


function downloadSVGFile(svgId, filename) {
  const svg = document.getElementById(svgId);
  const height = svg.viewBox.baseVal.height;
  const width = svg.viewBox.baseVal.width;
  
  // Create a clone of the SVG to avoid modifying the original
  const clonedSvg = svg.cloneNode(true);
  
  setSVGAttributesForMandala(clonedSvg);
  if (document.getElementById('gridlines').checked) {
    addGridlinesToSVG(clonedSvg);
  }
  addLogoToSVG(clonedSvg, width, height);

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clonedSvg);
  const blob = new Blob([source], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCanvas(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  
  // Create a temporary canvas to avoid modifying the original
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw the original canvas content
  tempCtx.drawImage(canvas, 0, 0);
  
  if (document.getElementById('gridlines').checked) {
    drawGridlinesOnCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
  }
  
  // Add logo and wait for it to load before creating the blob
  addLogoToCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
  
  setTimeout(() => {
    tempCanvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0); // Use PNG format with full quality
  }, 100); // Wait 100ms to ensure the logo has been drawn
}
function downloadPDF(canvasId, filename) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  
  // Create a temporary canvas to avoid modifying the original
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw the original canvas content
  tempCtx.drawImage(canvas, 0, 0);
  
  if (document.getElementById('gridlines').checked) {
    drawGridlinesOnCanvas(tempCtx, tempCanvas.width, tempCanvas.height);
  }

  // Ensure the logo is loaded before adding it to the canvas
  const logo = new Image();
  logo.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"></path><path d="M12 7.5V9"></path><path d="M7.5 12H9"></path><path d="M16.5 12H15"></path><path d="M12 16.5V15"></path><path d="m8 8 1.88 1.88"></path><path d="M14.12 9.88 16 8"></path><path d="m8 16 1.88-1.88"></path><path d="M14.12 14.12 16 16"></path></svg>');

  logo.onload = function() {
    tempCtx.drawImage(logo, 10, tempCanvas.height - 78, 58, 58); // Increased size to 58x58
    tempCtx.fillStyle = '#000';
    tempCtx.font = '50px Arial'; // Increased font size to 50px
    tempCtx.fillText('Pookkalam.dev', 80, tempCanvas.height - 30); // Adjusted position

    // Use the temporary canvas for creating the PDF
    if (tempCanvas && tempCanvas.toDataURL) {
      const imgData = tempCanvas.toDataURL('image/jpeg', 1); // Use JPEG format with reduced quality
      const pdf = new window.jspdf.jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = tempCanvas.width / tempCanvas.height;
      const pageAspectRatio = pageWidth / pageHeight;

      let imgWidth, imgHeight;
      if (canvasAspectRatio > pageAspectRatio) {
        imgWidth = pageWidth;
        imgHeight = pageWidth / canvasAspectRatio;
      } else {
        imgHeight = pageHeight;
        imgWidth = pageHeight * canvasAspectRatio;
      }

      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(filename);
    } else {
      console.error('Canvas element not found or toDataURL method not supported.');
    }
  };

  // Ensure the logo is drawn even if it's already loaded
  if (logo.complete) {
    logo.onload();
  }
}

function downloadCanvasFromSVG(svgId, filename) {
  const svg = document.getElementById(svgId);
  const clonedSvg = svg.cloneNode(true);
  
  setSVGAttributesForMandala(clonedSvg);
  if (document.getElementById('gridlines').checked) {
    addGridlinesToSVG(clonedSvg);
  }
  addLogoToSVG(clonedSvg, clonedSvg.viewBox.baseVal.width, clonedSvg.viewBox.baseVal.height);

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clonedSvg);
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(function(blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  img.src = url;
}

function downloadPDFFromSVG(svgId, filename) {
  const svg = document.getElementById(svgId);
  const clonedSvg = svg.cloneNode(true);
  
  setSVGAttributesForMandala(clonedSvg);
  if (document.getElementById('gridlines').checked) {
    addGridlinesToSVG(clonedSvg);
  }
  addLogoToSVG(clonedSvg, clonedSvg.viewBox.baseVal.width, clonedSvg.viewBox.baseVal.height);

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clonedSvg);
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function() {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const imgData = canvas.toDataURL('image/png'); // Lower quality to reduce file size
    const pdf = new window.jspdf.jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = pageWidth / pageHeight;

    let imgWidth, imgHeight;
    if (canvasAspectRatio > pageAspectRatio) {
      imgWidth = pageWidth;
      imgHeight = pageWidth / canvasAspectRatio;
    } else {
      imgHeight = pageHeight;
      imgWidth = pageHeight * canvasAspectRatio;
    }

    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = (pageHeight - imgHeight) / 2;
    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
    pdf.save(filename);
  };

  img.src = url;
}