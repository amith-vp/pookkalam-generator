self.onmessage = function(event) {
  const { rgba, width, height, x, y, color, tolerance } = event.data;
  floodfill(rgba, width, height, x, y, color, tolerance || 10);
  self.postMessage(rgba);
};

function floodfill(rgba, width, height, x, y, color, tolerance = 10) {
  var visited = new Uint8Array(width * height);
  var queue = new Int32Array(2 * width * height);

  var startColor = [
    rgba[(y * width + x) * 4 + 0],
    rgba[(y * width + x) * 4 + 1],
    rgba[(y * width + x) * 4 + 2],
    rgba[(y * width + x) * 4 + 3]
  ];

  // Don't fill if clicking on the same color (with tolerance)
  if (colorsMatch(startColor, color, tolerance)) {
    return;
  }

  var n = 0;
  queue[n++] = x;
  queue[n++] = y;

  var i = x + y * width;
  visited[i] = 1;
  rgba[i * 4 + 0] = color[0];
  rgba[i * 4 + 1] = color[1];
  rgba[i * 4 + 2] = color[2];
  rgba[i * 4 + 3] = 255;

  while (n > 0) {
    var currentY = queue[--n];
    var currentX = queue[--n];

    // Scan left
    var x1 = currentX;
    while (x1 > 0 && !visited[x1 - 1 + currentY * width] && colorsMatch(startColor, getPixelColor(rgba, x1 - 1, currentY, width), tolerance)) x1--;

    // Scan right
    var x2 = currentX;
    while (x2 < width - 1 && !visited[x2 + 1 + currentY * width] && colorsMatch(startColor, getPixelColor(rgba, x2 + 1, currentY, width), tolerance)) x2++;

    // Fill the horizontal line
    for (var fillX = x1; fillX <= x2; fillX++) {
      var i = fillX + currentY * width;
      visited[i] = 1;
      rgba[i * 4 + 0] = color[0];
      rgba[i * 4 + 1] = color[1];
      rgba[i * 4 + 2] = color[2];
      rgba[i * 4 + 3] = 255;
    }

    // Check pixels above
    if (currentY + 1 < height) {
      for (var fillX = x1; fillX <= x2; fillX++) {
        var i = fillX + (currentY + 1) * width;
        if (!visited[i] && colorsMatch(startColor, getPixelColor(rgba, fillX, currentY + 1, width), tolerance)) {
          visited[i] = 1;
          queue[n++] = fillX;
          queue[n++] = currentY + 1;
        }
      }
    }

    // Check pixels below
    if (currentY > 0) {
      for (var fillX = x1; fillX <= x2; fillX++) {
        var i = fillX + (currentY - 1) * width;
        if (!visited[i] && colorsMatch(startColor, getPixelColor(rgba, fillX, currentY - 1, width), tolerance)) {
          visited[i] = 1;
          queue[n++] = fillX;
          queue[n++] = currentY - 1;
        }
      }
    }
  }

  // Perform a second pass with slightly higher tolerance to catch remaining edge pixels
  performSecondPass(rgba, width, height, startColor, color, tolerance + 5, visited);
  
  // Final cleanup pass for stubborn boundary pixels
  performFinalCleanup(rgba, width, height, startColor, color, tolerance, visited);
}

function performSecondPass(rgba, width, height, startColor, fillColor, tolerance, visited) {
  var changed = false;
  var maxIterations = 5; // Increased iterations for better edge coverage
  
  for (var iteration = 0; iteration < maxIterations; iteration++) {
    changed = false;
    var currentTolerance = tolerance + (iteration * 3); // Gradually increase tolerance
    
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var i = x + y * width;
        
        // Skip if already filled or visited
        if (visited[i]) continue;
        
        var currentColor = getPixelColor(rgba, x, y, width);
        
        // Check if this pixel should be filled based on multiple criteria
        var shouldFill = false;
        
        // Method 1: Direct color matching with increasing tolerance
        if (colorsMatch(startColor, currentColor, currentTolerance)) {
          // Check if any neighboring pixel is already filled
          var hasFilledNeighbor = checkForFilledNeighbors(rgba, x, y, width, height, fillColor, visited);
          if (hasFilledNeighbor) {
            shouldFill = true;
          }
        }
        
        // Method 2: Boundary pixel detection - more aggressive for edge pixels
        if (!shouldFill && iteration >= 2) {
          shouldFill = isBoundaryPixelThatShouldBeFilled(rgba, x, y, width, height, startColor, fillColor, visited, currentTolerance);
        }
        
        if (shouldFill) {
          visited[i] = 1;
          rgba[i * 4 + 0] = fillColor[0];
          rgba[i * 4 + 1] = fillColor[1];
          rgba[i * 4 + 2] = fillColor[2];
          rgba[i * 4 + 3] = 255;
          changed = true;
        }
      }
    }
    
    // If no changes were made, we're done
    if (!changed) break;
  }
}

function checkForFilledNeighbors(rgba, x, y, width, height, fillColor, visited) {
  // Check 8-directional neighbors
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      var nx = x + dx;
      var ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        var ni = nx + ny * width;
        if (visited[ni]) {
          var neighborColor = getPixelColor(rgba, nx, ny, width);
          if (colorsMatch(fillColor, neighborColor, 8)) { // Tolerance for fill color check
            return true;
          }
        }
      }
    }
  }
  return false;
}

function isBoundaryPixelThatShouldBeFilled(rgba, x, y, width, height, startColor, fillColor, visited, tolerance) {
  var currentColor = getPixelColor(rgba, x, y, width);
  
  // Check if this pixel is "similar enough" to the start color
  var colorSimilarity = calculateColorSimilarity(startColor, currentColor);
  if (colorSimilarity > tolerance + 10) return false; // Too different
  
  var filledNeighborCount = 0;
  var totalNeighbors = 0;
  var neighborColors = [];
  
  // Analyze all neighbors
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      var nx = x + dx;
      var ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        totalNeighbors++;
        var ni = nx + ny * width;
        var neighborColor = getPixelColor(rgba, nx, ny, width);
        neighborColors.push(neighborColor);
        
        if (visited[ni] && colorsMatch(fillColor, neighborColor, 8)) {
          filledNeighborCount++;
        }
      }
    }
  }
  
  // If majority of neighbors are filled, this pixel should be filled too
  if (filledNeighborCount >= Math.ceil(totalNeighbors * 0.4)) { // 40% threshold
    return true;
  }
  
  // Additional check: if this pixel is very similar to start color and has filled neighbors
  if (colorsMatch(startColor, currentColor, tolerance * 1.5) && filledNeighborCount > 0) {
    return true;
  }
  
  return false;
}

function calculateColorSimilarity(color1, color2) {
  // Calculate Euclidean distance in RGB space
  var rDiff = color1[0] - color2[0];
  var gDiff = color1[1] - color2[1];
  var bDiff = color1[2] - color2[2];
  var aDiff = color1[3] - color2[3];
  
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff);
}

function performFinalCleanup(rgba, width, height, startColor, fillColor, tolerance, visited) {
  // Final aggressive pass to fill any remaining edge pixels
  var changed = true;
  var iteration = 0;
  var maxIterations = 3;
  
  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;
    
    for (var y = 1; y < height - 1; y++) {
      for (var x = 1; x < width - 1; x++) {
        var i = x + y * width;
        
        if (visited[i]) continue;
        
        var currentColor = getPixelColor(rgba, x, y, width);
        
        // Count filled neighbors in a 3x3 grid
        var filledCount = 0;
        var totalCount = 0;
        var nearestFilledDistance = Infinity;
        
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            var nx = x + dx;
            var ny = y + dy;
            var ni = nx + ny * width;
            
            totalCount++;
            
            if (visited[ni]) {
              var neighborColor = getPixelColor(rgba, nx, ny, width);
              if (colorsMatch(fillColor, neighborColor, 10)) {
                filledCount++;
                var distance = Math.sqrt(dx * dx + dy * dy);
                nearestFilledDistance = Math.min(nearestFilledDistance, distance);
              }
            }
          }
        }
        
        // If surrounded by filled pixels or very close to start color, fill it
        var shouldFill = false;
        
        if (filledCount >= 5) { // Surrounded by filled pixels
          shouldFill = true;
        } else if (filledCount >= 3 && colorsMatch(startColor, currentColor, tolerance * 2)) {
          shouldFill = true;
        } else if (filledCount >= 2 && colorsMatch(startColor, currentColor, tolerance)) {
          shouldFill = true;
        }
        
        if (shouldFill) {
          visited[i] = 1;
          rgba[i * 4 + 0] = fillColor[0];
          rgba[i * 4 + 1] = fillColor[1];
          rgba[i * 4 + 2] = fillColor[2];
          rgba[i * 4 + 3] = 255;
          changed = true;
        }
      }
    }
  }
}

function getPixelColor(data, x, y, width) {
  const index = (y * width + x) * 4;
  return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function colorsMatch(color1, color2, tolerance = 10) {
  // Use tolerance-based matching to handle antialiasing and slight color variations
  var rDiff = Math.abs(color1[0] - color2[0]);
  var gDiff = Math.abs(color1[1] - color2[1]);
  var bDiff = Math.abs(color1[2] - color2[2]);
  var aDiff = Math.abs(color1[3] - color2[3]);
  
  // Use both individual channel tolerance and overall color distance
  var channelMatch = rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance && aDiff <= tolerance;
  
  // Also check using Euclidean distance for better color similarity
  var colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff + aDiff * aDiff);
  var distanceMatch = colorDistance <= tolerance * 1.5;
  
  return channelMatch || distanceMatch;
}