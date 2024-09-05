function publishDesign() {
  // Show the modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center';
  modal.innerHTML = `
    <div class="bg-card p-8 rounded-lg shadow-xl max-w-md w-full">
      <h2 class="text-xl font-semibold mb-4 text-foreground">Feature Design</h2>
      <p class="text-muted-foreground mb-4">We'd love for you to share your design! It will be featured on the <a href="https://pookkalam.dev/designs" target="_blank" class="text-primary underline">designs page</a> for others to see and appreciate,if approved.</p>
      <p class="text-muted-foreground mb-4">Your name will be used for credit.</p>
      <input type="text" id="userName" placeholder="Enter your name" class="w-full p-2 mb-4 border border-input bg-background text-foreground rounded">

      
      <div class="flex justify-end">
        <button id="cancelPublish" class="px-4 py-2 bg-secondary text-secondary-foreground rounded mr-2">Cancel</button>
        <button id="confirmPublish" class="px-4 py-2 bg-primary text-primary-foreground rounded">Submit</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add event listeners to the modal buttons
  document.getElementById('cancelPublish').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  document.getElementById('confirmPublish').addEventListener('click', () => {
    let userName = document.getElementById('userName').value.trim();
    if (!userName) {
      userName = 'maveli';
    }
    document.body.removeChild(modal);
    submitDesign(userName);
  });
}

function submitDesign(userName) {
  
  const canvasCtx = canvas.getContext('2d');
  const logo = new Image();
  logo.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"></path><path d="M12 7.5V9"></path><path d="M7.5 12H9"></path><path d="M16.5 12H15"></path><path d="M12 16.5V15"></path><path d="m8 8 1.88 1.88"></path><path d="M14.12 9.88 16 8"></path><path d="m8 16 1.88-1.88"></path><path d="M14.12 14.12 16 16"></path></svg>');

  logo.onload = function () {
    const logoX = 10;
    const logoY = displayHeight - 34;
    const textX = logoX + 30; // Adjusted to align text with logo
    const textY = logoY + 18; // Adjusted to align text with logo

    canvasCtx.drawImage(logo, logoX, logoY, 24, 24);
    canvasCtx.font = '16px Arial';
    canvasCtx.fillStyle = 'black';
    canvasCtx.textAlign = 'left';
    canvasCtx.fillText(`Pookkalam.dev `, textX, textY);

    // Generate PNG image from the canvas (now with text and logo) and resize to 800x800
    const canvasPng = resizeCanvasToDataURLWithSvg(canvas, 800, 800);

    // Clone and manipulate the SVG
    const clonedSvg = mandala.cloneNode(true);
    setSVGAttributesForMandala(clonedSvg);

    // Convert the manipulated SVG to a data URL
    const serializer = new XMLSerializer();
    const manipulatedSvgString = serializer.serializeToString(clonedSvg);
    const manipulatedSvgBlob = new Blob([manipulatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const manipulatedSvgUrl = URL.createObjectURL(manipulatedSvgBlob);

    const img = new Image();
    img.onload = function () {
      // [2] Add text and logo to the manipulated SVG image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 800;
      tempCanvas.height = 800;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 800, 800); // Ensure the image is drawn within the canvas bounds
      ctx.drawImage(logo, logoX, 766, 24, 24); // Draw the logo on the SVG canvas
      ctx.font = '16px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'left';
      ctx.fillText(`Pookkalam.dev `, textX, 784); // Adjusted position to be within bounds
      const finalPng = tempCanvas.toDataURL('image/png');

      const publishData = {
        name: ` ${userName}`,
        canvasPng: canvasPng, // Includes text added in step [1]
        svgPng: finalPng,   // Includes text and logo added in step [2]
        userName: userName
      };
      console.log(publishData);

      fetch('https://pookkalam-backend.amithv.xyz/api/publish-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            console.log('Design published successfully');
            showNotification('Design published successfully!', 'success');
          } else {
            throw new Error(data.error || 'Unknown error occurred');
          }
        })
        .catch((error) => {
          console.error('Error:', error);
          showNotification(`Failed to publish design: ${error.message}. Please try again.`, 'error');
        });

      // Clean up the object URLs
      URL.revokeObjectURL(manipulatedSvgUrl);
    };

    img.onerror = function () {
      console.error('Error loading manipulated SVG');
      showNotification('Failed to process the manipulated SVG. Please try again.', 'error');
      URL.revokeObjectURL(manipulatedSvgUrl);
    };

    img.src = manipulatedSvgUrl;
  };

  // Ensure the logo is drawn even if it's already loaded
  if (logo.complete) {
    const logoX = 10;
    const logoY = displayHeight - 34;
    const textX = logoX + 30; // Adjusted to align text with logo
    const textY = logoY + 18; // Adjusted to align text with logo

    canvasCtx.drawImage(logo, logoX, logoY, 24, 24);
    canvasCtx.font = '16px Arial';
    canvasCtx.fillStyle = 'black';
    canvasCtx.textAlign = 'left';
    canvasCtx.fillText(`created by `, textX, textY);
    // Generate PNG image from the canvas (now with text and logo) and resize to 800x800
    const canvasPng = resizeCanvasToDataURLWithSvg(canvas, 800, 800);
  }

 
}

function resizeCanvasToDataURLWithSvg(canvas, newWidth, newHeight) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;
  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight);

  // Return the data URL after resizing the canvas
  return tempCanvas.toDataURL('image/png');
}

function resizeCanvasToDataURL(canvas, newWidth, newHeight) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;
  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, newWidth, newHeight);
  return tempCanvas.toDataURL('image/png');
}

function resizeImageToDataURL(img, newWidth, newHeight) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = newWidth;
  tempCanvas.height = newHeight;
  const ctx = tempCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, newWidth, newHeight);
  return tempCanvas.toDataURL('image/png');
}

function setSVGAttributesForMandala(svg) {
  if (svg.classList.contains('random-mandala')) {
    const elements = svg.querySelectorAll('*');
    elements.forEach(element => {
      element.setAttribute('stroke', 'black');
      element.removeAttribute('style');
      element.setAttribute('fill', 'white');
    });
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}