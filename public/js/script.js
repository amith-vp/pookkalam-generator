const freeformBtn = document.getElementById('freeformBtn');
const dragModeBtn = document.getElementById('dragModeBtn');
const triangleTemplate = document.getElementById('triangleTemplate');
const drawingLayer = document.getElementById('drawingLayer');
const mandala = document.getElementById('mandala');
const clearBtn = document.getElementById('clearBtn');
const slicesSlider = document.getElementById('sectors');
const slicesValue = document.getElementById('sectorValue');
const radiusSlider = document.getElementById('radius');
const radiusValue = document.getElementById('radiusValue');

let isDrawing = false;
let currentPath = null;
let paths = [];
let undoStack = [];
let redoStack = [];
let currentMode = 'drag';
let segments = 7;
let currentTool = 'pencil';
let currentColor = '#000000';
let currentLineWidth = 1;
let startPoint = null;
let isDrawingMode = false;
let selectedColor = '#000000';

const canvas = document.getElementById('mandalaCanvas');
const ctx = canvas.getContext('2d');
const gridCanvas = document.getElementById('gridCanvas');
const gridCtx = gridCanvas.getContext('2d');

const scaleFactor = 2;
const displayWidth = window.innerWidth > 640 ? 600 : 300;
const displayHeight = window.innerWidth > 640 ? 600 : 300;

canvas.width = displayWidth * scaleFactor;
canvas.height = displayHeight * scaleFactor;
canvas.style.width = `${displayWidth}px`;
canvas.style.height = `${displayHeight}px`;
ctx.scale(scaleFactor, scaleFactor);

// canvas.width = 500;
// canvas.height = 500;
// document.body.appendChild(canvas);
// const ctx = canvas.getContext('2d');

function getPointInSVG(e) {
  const pt = triangleTemplate.createSVGPoint();
  if (e.touches) {
    pt.x = e.touches[0].clientX;
    pt.y = e.touches[0].clientY;
  } else {
    pt.x = e.clientX;
    pt.y = e.clientY;
  }
  return pt.matrixTransform(triangleTemplate.getScreenCTM().inverse());
}


function updatePaths() {
  paths = Array.from(drawingLayer.children).map(child => {
    const clone = child.cloneNode(true);
    const transform = child.getAttribute('transform');
    if (transform) {
      clone.setAttribute('transform', transform);
    }
    return clone.outerHTML;
  });
  undoStack.push(paths.slice());
  redoStack = [];
}


function updateTriangleTemplate() {
  const angle = 360 / segments;
  const radians = (angle * Math.PI) / 180;
  const height = parseInt(radiusSlider.value);
  const width = 2 * height * Math.tan(radians / 2);
  const arcHeight = height * (1 - Math.cos(radians / 2));
  const extraSpace = 30;
  const viewBoxWidth = Math.max(width, 96);
  const viewBoxHeight = height + arcHeight + extraSpace;
  const xOffset = (viewBoxWidth - width) / 2;

  triangleTemplate.setAttribute('width', viewBoxWidth);
  triangleTemplate.setAttribute('height', viewBoxHeight);
  triangleTemplate.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);

  const pathD = `M${xOffset + width / 2},${viewBoxHeight} L${xOffset},${arcHeight + extraSpace} A${height},${height} 0 0,1 ${xOffset + width},${arcHeight + extraSpace} Z`;
  triangleTemplate.querySelector('path').setAttribute('d', pathD);

  // Create or update the clipPath
  let clipPath = triangleTemplate.querySelector('#triangleClip');
  if (!clipPath) {
    clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.id = 'triangleClip';
    triangleTemplate.appendChild(clipPath);
  }
  let clipPathPath = clipPath.querySelector('path');
  if (!clipPathPath) {
    clipPathPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    clipPath.appendChild(clipPathPath);
  }
  clipPathPath.setAttribute('d', pathD);

  // Remove existing gridGroup if it exists
  const existingGridGroup = triangleTemplate.querySelector('#gridGroup');
  if (existingGridGroup) {
    existingGridGroup.remove();
  }

  // Create new gridGroup
  const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gridGroup.id = 'gridGroup';
  gridGroup.setAttribute('clip-path', 'url(#triangleClip)');

  // Horizontal gridlines
  const numHorizontalLines = 10;
  for (let i = 1; i < numHorizontalLines; i++) {
    const y = i * (viewBoxHeight / numHorizontalLines);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', 0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', viewBoxWidth);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e0e0e0');
    line.setAttribute('stroke-width', '0.5');
    gridGroup.appendChild(line);
  }

  // Vertical gridlines
  const numVerticalLines = 10;
  for (let i = 1; i < numVerticalLines; i++) {
    const x = i * (viewBoxWidth / numVerticalLines);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute('x1', x);
    line.setAttribute('y1', 0);
    line.setAttribute('x2', x);
    line.setAttribute('y2', viewBoxHeight);
    line.setAttribute('stroke', '#e0e0e0');
    line.setAttribute('stroke-width', '0.5');
    gridGroup.appendChild(line);
  }

  // Central line from triangle angle
  const centralLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  centralLine.setAttribute('x1', xOffset + width / 2);
  centralLine.setAttribute('y1', 0);
  centralLine.setAttribute('x2', xOffset + width / 2);
  centralLine.setAttribute('y2', viewBoxHeight);
  centralLine.setAttribute('stroke', '#e0e0e0');
  centralLine.setAttribute('stroke-width', '0.5');
  gridGroup.appendChild(centralLine);

  triangleTemplate.appendChild(gridGroup);
}

function generateMandala() {
  ctx.clearRect(0, 0, displayWidth, displayHeight);
  const angle = 360 / segments;
  const overlap = 0.1; // Small overlap to hide gaps
  const shapesHTML = Array(segments).fill('').map((_, i) => {
    const rotation = i * angle - overlap;
    const translateX = 300 - triangleTemplate.width.baseVal.value / 2;
    const translateY = 300 - triangleTemplate.height.baseVal.value;
    return `<g stroke="black" stroke-width="2" fill="none" transform="rotate(${rotation} 300 300) translate(${translateX} ${translateY})" clip-path="url(#mandalaClip)">${paths.join('')}</g>`;
  }).join('');

  mandala.innerHTML = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="600" fill="#ffffff" />
      <defs>
        <clipPath id="mandalaClip">
          <path d="${triangleTemplate.querySelector('path').getAttribute('d')}" />
        </clipPath>
      </defs>
      ${shapesHTML}
    </svg>
  `;
  // Draw the mandala on the canvas
  const svgData = new XMLSerializer().serializeToString(mandala.querySelector('svg'));
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.src = url;
  img.onload = () => {
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    URL.revokeObjectURL(url);
  };
  canvas.addEventListener('click', (e) => {
    const x = Math.floor(e.offsetX * scaleFactor);
    const y = Math.floor(e.offsetY * scaleFactor);
    floodFill(x, y);
  });
}


function drawGridlines() {
  const gridSize = 20;
  gridCtx.strokeStyle = '#e0e0e0';
  gridCtx.lineWidth = 0.5;

  // Clear the grid canvas
  gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

  // Draw vertical gridlines
  for (let x = 0; x <= gridCanvas.width; x += gridSize) {
    gridCtx.beginPath();
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, gridCanvas.height);
    gridCtx.stroke();
  }

  // Draw horizontal gridlines
  for (let y = 0; y <= gridCanvas.height; y += gridSize) {
    gridCtx.beginPath();
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(gridCanvas.width, y);
    gridCtx.stroke();
  }
}

// Call drawGridlines when the checkbox is toggled
document.getElementById('gridlines').addEventListener('change', (e) => {
  if (e.target.checked) {
    drawGridlines();
  } else {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
  }
});

function floodFill(x, y) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelData = imageData.data;
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const startColor = getPixelColor(pixelData, x, y);
  const fillColor = hexToRgb(selectedColor);

  if (!colorsMatch(startColor, fillColor)) {
    const pixelStack = [[x, y]];

    while (pixelStack.length) {
      let newPos, x, y, pixelPos, reachLeft, reachRight;
      newPos = pixelStack.pop();
      x = newPos[0];
      y = newPos[1];

      pixelPos = (y * canvasWidth + x) * 4;
      while (y-- >= 0 && matchStartColor(pixelPos, startColor, pixelData)) {
        pixelPos -= canvasWidth * 4;
      }
      pixelPos += canvasWidth * 4;
      ++y;
      reachLeft = false;
      reachRight = false;
      while (y++ < canvasHeight - 1 && matchStartColor(pixelPos, startColor, pixelData)) {
        colorPixel(pixelPos, fillColor, pixelData);

        if (x > 0) {
          if (matchStartColor(pixelPos - 4, startColor, pixelData)) {
            if (!reachLeft) {
              pixelStack.push([x - 1, y]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x < canvasWidth - 1) {
          if (matchStartColor(pixelPos + 4, startColor, pixelData)) {
            if (!reachRight) {
              pixelStack.push([x + 1, y]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        pixelPos += canvasWidth * 4;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }
}

function getPixelColor(data, x, y) {
  const index = (y * canvas.width + x) * 4;
  return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
}

function colorsMatch(color1, color2) {
  return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[2] && color1[3] === color2[3];
}

function matchStartColor(pixelPos, startColor, data) {
  return (
    data[pixelPos] === startColor[0] &&
    data[pixelPos + 1] === startColor[1] &&
    data[pixelPos + 2] === startColor[2] &&
    data[pixelPos + 3] === startColor[3]
  );
}

function colorPixel(pixelPos, fillColor, data) {
  data[pixelPos] = fillColor[0];
  data[pixelPos + 1] = fillColor[1];
  data[pixelPos + 2] = fillColor[2];
  data[pixelPos + 3] = fillColor[3];
}

// Update the event listener


function eraseAtPoint(clientX, clientY) {
  const clickedElement = document.elementFromPoint(clientX, clientY);
  if (clickedElement && clickedElement.parentNode === drawingLayer) {
    drawingLayer.removeChild(clickedElement);
    updatePaths();
    generateMandala();
  }
}


let curvePoints = [];
let currentCurve = null;
let clickState = 0;

function Curve(parent, x1, y1) {
  this.parent = parent;
  this.origin = { x: x1, y: y1 };
  this.target = { x: x1, y: y1 };
  this.control = { x: x1, y: y1 };
  this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  this.path.setAttribute("fill", "none");
  this.path.setAttribute("stroke", currentColor);
  this.path.setAttribute("stroke-width", currentLineWidth);
  drawingLayer.appendChild(this.path);

  this.to = function (x, y) {
    this.target.x = x;
    this.target.y = y;
    this.updatePath();
  };

  this.arc = function (x, y) {
    // Interpolate the control point
    const t = 1.5; // Adjust this value to change how closely the curve follows the mouse
    this.control.x = this.origin.x + (x - this.origin.x) * t;
    this.control.y = this.origin.y + (y - this.origin.y) * t;
    this.updatePath();
  };

  this.preview = function () {
    this.path.setAttribute("stroke", COLORS.preview);
    this.updatePath();
  };

  this.updatePath = function () {
    this.path.setAttribute("d", `M${this.origin.x},${this.origin.y} Q${this.control.x},${this.control.y} ${this.target.x},${this.target.y}`);
  };

  this.finalize = function () {
    this.path.setAttribute("stroke", currentColor);
  };
}

function handleCurveDrawing(e, point) {
  if (e.type === 'mousedown' || e.type === 'touchstart') {
    if (clickState === 0) {
      // First touch: start a new curve
      currentCurve = new Curve(this, point.x, point.y);
      curvePoints = [point];
      clickState++;
    }
  } else if (e.type === 'mousemove' || e.type === 'touchmove') {
    if (clickState === 1) {
      // Preview end point
      currentCurve.to(point.x, point.y);
      currentCurve.preview();
    } else if (clickState === 2) {
      // Preview control point
      currentCurve.arc(point.x, point.y);
      currentCurve.preview();
    }
  } else if (e.type === 'mouseup' || e.type === 'touchend') {
    if (clickState === 1) {
      // Set end point
      currentCurve.to(point.x, point.y);
      curvePoints.push(point);
      clickState++;
    } else if (clickState === 2) {
      // Set control point and finish curve
      currentCurve.arc(point.x, point.y);
      currentCurve.finalize();
      curvePoints.push(point);
      clickState = 0;
      updatePaths();
      generateMandala();
      currentCurve = null;
      curvePoints = [];
    }
  } else if (e.type === 'mouseleave' || e.type === 'touchcancel') {
    if (clickState === 2) {
      // Finish curve on touch leave
      currentCurve.arc(point.x, point.y);
      currentCurve.finalize();
      curvePoints.push(point);
      clickState = 0;
      updatePaths();
      generateMandala();
      currentCurve = null;
      curvePoints = [];
    }
  }
}

const COLORS = {
  preview: "#0c8",
  stroke: "#363636",
  anchor: "#0cc"
};

// Update handleDrawing function

// ... existing code ...

let lastTouchPoint = null;

function handleDrawing(e) {
  if (!isDrawingMode) return;

  let point;
  if (e.type.startsWith('touch')) {
    if (e.touches.length > 0) {
      point = getPointInSVG(e.touches[0]);
    } else if (e.changedTouches.length > 0) {
      point = getPointInSVG(e.changedTouches[0]);
    } else {
      point = lastTouchPoint;
    }
  } else {
    point = getPointInSVG(e);
  }

  if (e.type === 'touchmove') {
    lastTouchPoint = point;
  }

  if (currentTool === 'rotate') {
    handleRotation(e, point);
  } else if (currentTool === 'eraser') {
    handleEraser(e);
  } else if (currentTool === 'curve') {
    handleCurveDrawing(e, point);
  } else {
    handleShapeDrawing(e, point);
  }

  if ((e.type === 'mouseup' ) && currentTool === 'curve' && clickState === 0) {
    updatePaths();
    generateMandala();
  }
}
// ... existing code ...

function handleRotation(e, point) {
  if (e.type === 'mousedown' || e.type === 'touchstart') {
    const target = e.target;
    if (isDraggableShape(target)) {
      isDrawing = true;
      startRotation(target, point);
      document.addEventListener('mousemove', handleRotationMove);
      document.addEventListener('mouseup', handleRotationEnd);
      document.addEventListener('touchmove', handleRotationMove);
      document.addEventListener('touchend', handleRotationEnd);
    }
  }
}

function handleEraser(e) {
  let clientX, clientY;

  if (e.type.startsWith('touch')) {
    const touch = e.touches[0] || e.changedTouches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  if (e.type === 'mousedown' || e.type === 'touchstart') {
    isDrawing = true;
    eraseAtPoint(clientX, clientY);
  } else if ((e.type === 'mousemove' || e.type === 'touchmove') && isDrawing) {
    eraseAtPoint(clientX, clientY);
  } else if (['mouseup', 'mouseleave', 'touchend', 'touchcancel'].includes(e.type)) {
    isDrawing = false;
  }
}

function handleShapeDrawing(e, point) {
  if (e.type === 'mousedown' || e.type === 'touchstart') {
    isDrawing = true;
    startPoint = currentTool === 'circle' ? getTriangleAnglePoint() : point;
    currentPath = document.createElementNS("http://www.w3.org/2000/svg", getShapeElement());
    setShapeAttributes(currentPath, startPoint);
    drawingLayer.appendChild(currentPath);
  } else if (e.type === 'mousemove' || (e.type === 'touchmove' && isDrawing)) {
    updateShape(currentPath, startPoint, point);
  } else if (['mouseup', 'mouseleave', 'touchend', 'touchcancel'].includes(e.type) && isDrawing) {
    isDrawing = false;
    updateShape(currentPath, startPoint, point);
    updatePaths();
    generateMandala();
  }
}

function handleRotationMove(e) {
  if (isDrawing && currentTool === 'rotate') {
    const point = getPointInSVG(e);
    const shape = document.querySelector('[data-rotating="true"]');
    if (shape) {
      continueRotation(shape, point);
    }
  }
}

function handleRotationEnd(e) {
  if (isDrawing && currentTool === 'rotate') {
    isDrawing = false;
    const shape = document.querySelector('[data-rotating="true"]');
    if (shape) {
      endRotation(shape);
      updatePaths();
      generateMandala();
    }
    document.removeEventListener('mousemove', handleRotationMove);
    document.removeEventListener('mouseup', handleRotationEnd);
  }
}

function startRotation(shape, startPoint) {
  const bbox = shape.getBBox();
  const centerX = bbox.x + bbox.width / 2;
  const centerY = bbox.y + bbox.height / 2;

  shape.setAttribute('data-center-x', centerX);
  shape.setAttribute('data-center-y', centerY);

  const startAngle = Math.atan2(startPoint.y - centerY, startPoint.x - centerX);
  shape.setAttribute('data-start-angle', startAngle);

  const currentRotation = getCurrentRotation(shape);
  shape.setAttribute('data-start-rotation', currentRotation);
  shape.setAttribute('data-rotating', 'true');
}

function continueRotation(shape, currentPoint) {
  const centerX = parseFloat(shape.getAttribute('data-center-x'));
  const centerY = parseFloat(shape.getAttribute('data-center-y'));
  const startAngle = parseFloat(shape.getAttribute('data-start-angle'));
  const startRotation = parseFloat(shape.getAttribute('data-start-rotation') || 0);

  const currentAngle = Math.atan2(currentPoint.y - centerY, currentPoint.x - centerX);
  let rotation = (currentAngle - startAngle) * (180 / Math.PI);
  rotation = (rotation + startRotation + 360) % 360;

  const currentTransform = shape.getAttribute('transform') || '';
  const newTransform = removeRotation(currentTransform) + ` rotate(${rotation.toFixed(2)} ${centerX.toFixed(2)} ${centerY.toFixed(2)})`;
  shape.setAttribute('transform', newTransform.trim());
  shape.setAttribute('data-rotation', rotation.toFixed(2));
}

function removeRotation(transform) {
  return transform.replace(/\s*rotate\([^)]*\)/, '');
}

function getCurrentRotation(shape) {
  const transform = shape.getAttribute('transform');
  if (!transform) return 0;
  const match = transform.match(/rotate\(([^,\s]+)[^)]*\)/);
  return match ? parseFloat(match[1]) : 0;
}

function endRotation(shape) {
  const rotation = getCurrentRotation(shape);
  shape.setAttribute('data-rotation', rotation);
  shape.removeAttribute('data-rotating');
}

function getShapeElement() {
  switch (currentTool) {
    case 'pencil':
    case 'line':
      return 'path';
    case 'circle':
      return 'circle';
    default:
      return 'path';
  }
}

function setShapeAttributes(shape, point) {
  shape.setAttribute("fill", "none");
  shape.setAttribute("stroke", currentColor);
  shape.setAttribute("stroke-width", currentLineWidth);

  switch (currentTool) {
    case 'pencil':
    case 'line':
      shape.setAttribute("d", `M${point.x},${point.y}`);
      break;
    case 'circle':
      shape.setAttribute("cx", point.x);
      shape.setAttribute("cy", point.y);
      shape.setAttribute("r", 0);
      break;
  }
}

function updateShape(shape, start, end) {
  switch (currentTool) {
    case 'pencil':
      const d = shape.getAttribute("d");
      shape.setAttribute("d", `${d} L${end.x},${end.y}`);
      break;
    case 'line':
      shape.setAttribute("d", `M${start.x},${start.y} L${end.x},${end.y}`);
      break;
    case 'circle':
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      shape.setAttribute("r", radius);
      break;
  }
}

function getTriangleAnglePoint() {
  const path = triangleTemplate.querySelector('path');
  const pathData = path.getAttribute('d');
  const match = pathData.match(/M([\d.]+),([\d.]+)/);
  if (match) {
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  }
  return { x: 0, y: 0 };
}

function clearShapes() {
  paths = [];
  drawingLayer.innerHTML = '';
  generateMandala();
}

function undo() {
  if (undoStack.length > 0) {
    redoStack.push(paths.slice());
    undoStack.pop();
    paths = undoStack.length > 0 ? undoStack[undoStack.length - 1] : [];
    drawingLayer.innerHTML = paths.join('');
    generateMandala();
    updateShapeInteractivity();
  }
}

function redo() {
  if (redoStack.length > 0) {
    paths = redoStack.pop();
    undoStack.push(paths.slice());
    drawingLayer.innerHTML = paths.join('');
    generateMandala();
    updateShapeInteractivity();
  }
}

function toggleMode() {
  document.querySelectorAll('[data-tool]').forEach(t => t.classList.remove('bg-accent'));

  const isDrawingMode = currentMode === 'drawing' || currentMode === 'eraser';
  toggleButtonStyles(freeformBtn, isDrawingMode);
  toggleButtonStyles(dragModeBtn, !isDrawingMode);

  triangleTemplate.style.cursor = currentMode === 'eraser' ? 'crosshair' : (isDrawingMode ? 'crosshair' : 'default');

  if (isDrawingMode) {
    addDrawingEventListeners();
  } else {
    removeDrawingEventListeners();
  }

  updateShapeInteractivity();
}

function toggleButtonStyles(button, isActive) {
  button.classList.toggle('bg-primary', isActive);
  button.classList.toggle('text-primary-foreground', isActive);
  button.classList.toggle('border', !isActive);
  button.classList.toggle('border-input', !isActive);
  button.classList.toggle('bg-background', !isActive);
  button.classList.toggle('hover:bg-accent', !isActive);
  button.classList.toggle('hover:text-accent-foreground', !isActive);
}

function addDrawingEventListeners() {
  ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(event =>
    triangleTemplate.addEventListener(event, handleDrawing)
  );
}

function removeDrawingEventListeners() {
  ['mousedown', 'mousemove', 'mouseup', 'mouseleave', 'touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(event =>
    triangleTemplate.removeEventListener(event, handleDrawing)
  );
}


function updateShapeInteractivity() {
  Array.from(drawingLayer.children).forEach(shape => {
    const interactable = interact(shape);

    if (currentMode === 'drag') {
      interactable.draggable({
        inertia: true,
        listeners: {
          move(event) {
            const target = event.target;
            const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
            const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
            const currentScaleX = parseFloat(target.getAttribute('data-scale-x') || 1);
            const currentScaleY = parseFloat(target.getAttribute('data-scale-y') || 1);
            const currentRotation = getCurrentRotation(target);

            const centerX = target.getAttribute('data-center-x') || (target.getBBox().x + target.getBBox().width / 2);
            const centerY = target.getAttribute('data-center-y') || (target.getBBox().y + target.getBBox().height / 2);
            target.setAttribute('data-center-x', centerX);
            target.setAttribute('data-center-y', centerY);

            target.setAttribute('transform', `translate(${x}, ${y}) scale(${currentScaleX}, ${currentScaleY}) rotate(${currentRotation} ${centerX} ${centerY})`);
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          },
          end() {
            updatePaths();
            generateMandala();
          }
        }
      });

      interactable.resizable({
        edges: { left: true, right: true, bottom: true, top: true },
        margin: 5,
        listeners: {
          start(event) {
            const target = event.target;
            target.setAttribute('data-start-scale-x', target.getAttribute('data-scale-x') || 1);
            target.setAttribute('data-start-scale-y', target.getAttribute('data-scale-y') || 1);
            target.setAttribute('data-start-width', event.rect.width);
            target.setAttribute('data-start-height', event.rect.height);
            target.setAttribute('data-start-x', target.getAttribute('data-x') || 0);
            target.setAttribute('data-start-y', target.getAttribute('data-y') || 0);
          },
          move(event) {
            const target = event.target;
            const startX = parseFloat(target.getAttribute('data-start-x'));
            const startY = parseFloat(target.getAttribute('data-start-y'));
            const startScaleX = parseFloat(target.getAttribute('data-start-scale-x'));
            const startScaleY = parseFloat(target.getAttribute('data-start-scale-y'));
            const startWidth = parseFloat(target.getAttribute('data-start-width'));
            const startHeight = parseFloat(target.getAttribute('data-start-height'));

            let newScaleX = startScaleX;
            let newScaleY = startScaleY;
            let newX = startX;
            let newY = startY;

            if (event.edges.left) {
              const widthChange = startWidth - event.rect.width;
              newScaleX = startScaleX * (event.rect.width / startWidth);
              newX = startX + widthChange * startScaleX;
            } else if (event.edges.right) {
              newScaleX = startScaleX * (event.rect.width / startWidth);
            }

            if (event.edges.top) {
              const heightChange = startHeight - event.rect.height;
              newScaleY = startScaleY * (event.rect.height / startHeight);
              newY = startY + heightChange * startScaleY;
            } else if (event.edges.bottom) {
              newScaleY = startScaleY * (event.rect.height / startHeight);
            }

            const currentRotation = getCurrentRotation(target);

            const centerX = target.getAttribute('data-center-x') || (target.getBBox().x + target.getBBox().width / 2);
            const centerY = target.getAttribute('data-center-y') || (target.getBBox().y + target.getBBox().height / 2);
            target.setAttribute('data-center-x', centerX);
            target.setAttribute('data-center-y', centerY);

            target.setAttribute('transform', `translate(${newX}, ${newY}) scale(${newScaleX}, ${newScaleY}) rotate(${currentRotation} ${centerX} ${centerY})`);
            target.setAttribute('data-x', newX);
            target.setAttribute('data-y', newY);
            target.setAttribute('data-scale-x', newScaleX);
            target.setAttribute('data-scale-y', newScaleY);
          },
          end() {
            updatePaths();
            generateMandala();
          }
        }
      });
    } else {
      interactable.draggable(false);
      interactable.resizable(false);
    }
  });
}

function addShapeToDrawingLayer(x, y, shapeType) {
  const shapeAttributes = {
    custom1: { tag: 'path', attrs: { d: "M107.532 90.1785C83.7449 96.6751 66.3493 104.347 55.0435 113.566C43.7426 104.351 26.3571 96.6817 2.58549 90.1869C-0.772028 61.8199 9.45296 24.6334 55.022 2.23499C76.3402 13.2042 90.7708 26.1434 99.2105 40.8475C107.558 55.3905 110.148 71.8385 107.532 90.1785Z" } },
    custom2: { tag: 'path', attrs: { d: "M69.6646 3C-10.1141 56.1561 -0.783584 108.38 10.1799 124H130.545C139.642 108.613 151.538 59.6532 69.6646 3Z" } },
    custom3: { tag: 'path', attrs: { d: "M49.4247 52.7852C59.8994 36.2386 70.2865 19.8303 78.2537 4.26678C84.9538 14.4935 91.8836 24.6367 98.7163 34.6378L99.8471 36.2929C107.698 47.7854 115.395 59.0846 122.476 70.146C136.656 92.2989 148.252 113.335 153.601 132.815C158.931 152.229 158.012 169.906 147.414 185.616C136.808 201.338 116.289 215.426 81.6443 227.149C42.7707 217.246 21.0576 203.315 10.613 187.099C0.170573 170.886 0.690247 151.902 7.45753 131.18C14.2331 110.434 27.1612 88.2975 41.0375 66.0915C43.8096 61.6552 46.6203 57.2152 49.4247 52.7852Z" } },
    custom4: { tag: 'path', attrs: { d: "M45 10 Q18 55 45 100 Q72 55 45 10" } },
    custom5: { tag: 'circle', attrs: { cx: "89.5", cy: "89.5", r: "87.5" } },
    custom6: { tag: 'rect', attrs: { x: "2", y: "2", width: "166", height: "166" } },
    custom7: { tag: 'path', attrs: { d: "M79.5 3.48483C82.9034 1.51987 87.0966 1.51987 90.5 3.48483L162.37 44.9793C165.774 46.9442 167.87 50.5756 167.87 54.5056V137.494C167.87 141.424 165.774 145.056 162.37 147.021L90.5 188.515C87.0966 190.48 82.9034 190.48 79.5 188.515L7.62951 147.021C4.22609 145.056 2.12951 141.424 2.12951 137.494V54.5056C2.12951 50.5756 4.2261 46.9442 7.62951 44.9793L79.5 3.48483Z" } },
    custom8: { tag: 'path', attrs: { d: "M99.1422 29.4261L99.1639 29.4423L99.1861 29.4579C110.283 37.2743 122.272 44.6607 134.319 50.7799C128.365 62.7557 122.871 75.2107 118.695 88.1303C114.535 101.002 111.249 114.326 109.262 127.688C95.8562 125.479 82.4056 124.162 68.5 124.162C54.5734 124.162 41.103 125.483 27.6767 127.698C25.3253 114.398 22.4828 101.057 18.3044 88.1303C14.1313 75.2196 8.64254 62.7728 2.69364 50.8045C15.153 44.6702 26.6955 37.2611 36.9044 29.4175C48.0147 21.1304 58.2467 12.4005 68.0174 2.81136C77.7916 12.4039 88.0274 21.1364 99.1422 29.4261Z" } },
    custom9: { tag: 'path', attrs: { d: "M102.298 131.087C101.832 130.869 101.302 130.625 100.713 130.36C98.2522 129.252 94.7547 127.777 90.5954 126.302C82.3086 123.363 71.2582 120.374 60.5001 120.374C50.9418 120.374 40.4871 123.379 32.5287 126.311C28.5268 127.785 25.1099 129.259 22.6913 130.365C22.0937 130.638 21.5567 130.889 21.0864 131.112L2.23029 55.1762L60.5001 2.69168L118.799 55.2026L102.298 131.087Z" } },
    custom10: { tag: 'path', attrs: { d: "M75.3023 6.64393C77.1152 1.15134 84.8848 1.15133 86.6977 6.64395L94.1938 29.3558C96.1086 35.1573 102.732 37.9009 108.188 35.1526L129.549 24.3935C134.715 21.7915 140.209 27.2854 137.607 32.4512L126.847 53.8115C124.099 59.2677 126.843 65.8914 132.644 67.8062L155.356 75.3023C160.849 77.1152 160.849 84.8848 155.356 86.6977L132.644 94.1938C126.843 96.1086 124.099 102.732 126.847 108.189L137.607 129.549C140.209 134.715 134.715 140.209 129.549 137.607L108.188 126.847C102.732 124.099 96.1086 126.843 94.1938 132.644L86.6977 155.356C84.8848 160.849 77.1152 160.849 75.3023 155.356L67.8062 132.644C65.8914 126.843 59.2677 124.099 53.8115 126.847L32.4512 137.607C27.2854 140.209 21.7915 134.715 24.3935 129.549L35.1526 108.188C37.9009 102.732 35.1573 96.1086 29.3558 94.1938L6.64393 86.6977C1.15134 84.8848 1.15133 77.1152 6.64395 75.3023L29.3558 67.8062C35.1573 65.8914 37.9009 59.2677 35.1526 53.8115L24.3935 32.4512C21.7915 27.2854 27.2854 21.7915 32.4512 24.3935L53.8115 35.1526C59.2677 37.9009 65.8914 35.1573 67.8062 29.3558L75.3023 6.64393Z" } },
    custom11: { tag: 'path', attrs: { d: "M89.9318 6.12863C94.1569 -2.04288 105.843 -2.04288 110.068 6.12863L136.973 58.1644C138.051 60.2496 139.75 61.9486 141.836 63.0268L193.871 89.9318C202.043 94.1569 202.043 105.843 193.871 110.068L141.836 136.973C139.75 138.051 138.051 139.75 136.973 141.836L110.068 193.871C105.843 202.043 94.1569 202.043 89.9318 193.871L63.0268 141.836C61.9486 139.75 60.2496 138.051 58.1644 136.973L6.12863 110.068C-2.04288 105.843 -2.04288 94.1569 6.12863 89.9318L58.1644 63.0268C60.2496 61.9486 61.9486 60.2496 63.0268 58.1644L89.9318 6.12863Z" } },
    custom12: { tag: 'path', attrs: { d: "M4.03989 140.397C-10.3154 77.7553 54.6099 24.0316 88.867 5C64.0713 61.1165 92.6734 143.66 110.074 177.917C80.7106 191.511 18.3952 203.039 4.03989 140.397Z" } },
    custom13: { tag: 'path', attrs: { d: "M69.7793 3.67984C63.873 24.6197 22.7988 58.4907 3 72.8087L35.8863 255.362C49.6449 162.743 75.6856 -17.26 69.7793 3.67984Z" } },
    custom14: { tag: 'path', attrs: { d: "M94 6.47214L114.1 68.3344L114.549 69.7163H116.002L181.048 69.7163L128.425 107.949L127.249 108.803L127.698 110.185L147.799 172.048L95.1756 133.815L94 132.961L92.8244 133.815L40.2013 172.048L60.3015 110.185L60.7506 108.803L59.575 107.949L6.95183 69.7163L71.9976 69.7163H73.4507L73.8997 68.3344L94 6.47214Z" } },
    custom15: { tag: 'path', attrs: { d: "M50.7143 0H0.71429V50C0.71429 75.462 19.7466 96.4788 44.361 99.6002C19.4015 102.402 4.22025e-06 123.578 2.18557e-06 149.286L0 199.286H50C75.462 199.286 96.4788 180.253 99.6002 155.639C102.402 180.599 123.578 200 149.286 200H199.286V150C199.286 124.538 180.253 103.521 155.639 100.4C180.599 97.5984 200 76.422 200 50.7143V0.714286L150 0.714284C124.538 0.714282 103.521 19.7466 100.4 44.361C97.5984 19.4015 76.422 0 50.7143 0Z" } },
    custom16: { tag: 'path', attrs: { d: "M100.387 91.8532C96.2415 40.435 53.2 0 0.714282 0C0.714282 52.2424 40.7753 95.1281 91.8532 99.6128C40.435 103.758 -5.33517e-06 146.8 -7.62939e-06 199.286C52.2424 199.286 95.1281 159.225 99.6128 108.147C103.758 159.565 146.8 200 199.286 200C199.286 147.758 159.225 104.872 108.147 100.387C159.565 96.2416 200 53.2 200 0.714286C147.758 0.714283 104.872 40.7753 100.387 91.8532ZM99.9975 100.002C99.9991 100.002 100.001 100.003 100.002 100.003L100.003 99.9975C100.001 99.9975 99.9992 99.9975 99.9975 99.9975C99.9975 99.9991 99.9975 100.001 99.9975 100.002Z" } },
    custom17: { tag: 'path', attrs: { d: "M123.344 200C100 200 100 143.969 76.6558 143.969C49.7872 143.969 0 150.205 0 123.338C0 99.9951 56.0242 99.995 56.0242 76.652C56.0242 49.7946 49.7872 0 76.6558 0C100 0 100 56.0313 123.344 56.0313C150.213 56.0313 200 49.7946 200 76.652C200 99.995 143.966 99.9951 143.966 123.338C143.966 150.205 150.213 200 123.344 200Z" } }
  };

  const { tag, attrs } = shapeAttributes[shapeType];
  const shape = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => shape.setAttribute(key, value));

  shape.setAttribute('fill', 'none');
  shape.setAttribute('stroke', 'black');
  shape.setAttribute('stroke-width', '2');

  const initialScale = 0.3;
  const offsetX = 20;
  const offsetY = 20;
  shape.setAttribute('transform', `translate(${x - offsetX}, ${y - offsetY}) scale(${initialScale})`);
  shape.setAttribute('data-x', x - offsetX);
  shape.setAttribute('data-y', y - offsetY);
  shape.setAttribute('data-original-width', 30);
  shape.setAttribute('data-original-height', 30);
  shape.classList.add('resizable');
  shape.setAttribute('data-scale-x', initialScale);
  shape.setAttribute('data-scale-y', initialScale);

  drawingLayer.appendChild(shape);
  makeShapeInteractive(shape);
  updatePaths();
  generateMandala();

  currentMode = 'drag';
  toggleMode();
}

function makeShapeInteractive(shape) {
  let originalTransform = shape.getAttribute('transform') || '';
  let scale = 1;

  interact(shape)
    .draggable({
      inertia: true,
      listeners: {
        start(event) {
          currentMode = 'drag';
          toggleMode();
        },
        move(event) {
          if (currentMode !== 'drag') return;
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
          const currentScaleX = parseFloat(target.getAttribute('data-scale-x') || scale);
          const currentScaleY = parseFloat(target.getAttribute('data-scale-y') || scale);
          const currentRotation = parseFloat(target.getAttribute('data-rotation') || 0);

          target.setAttribute('transform', `translate(${x}, ${y}) scale(${currentScaleX}, ${currentScaleY}) rotate(${currentRotation})`);
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
        },
        end() {
          if (currentMode !== 'drag') return;
          updatePaths();
          generateMandala();
        }
      }
    })
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      margin: 5,
      listeners: {
        start(event) {
          const target = event.target;
          target.setAttribute('data-start-scale-x', target.getAttribute('data-scale-x') || scale);
          target.setAttribute('data-start-scale-y', target.getAttribute('data-scale-y') || scale);
          target.setAttribute('data-start-width', event.rect.width);
          target.setAttribute('data-start-height', event.rect.height);
          target.setAttribute('data-start-x', target.getAttribute('data-x') || 0);
          target.setAttribute('data-start-y', target.getAttribute('data-y') || 0);
        },
        move(event) {
          const target = event.target;
          const startX = parseFloat(target.getAttribute('data-start-x'));
          const startY = parseFloat(target.getAttribute('data-start-y'));
          const startScaleX = parseFloat(target.getAttribute('data-start-scale-x'));
          const startScaleY = parseFloat(target.getAttribute('data-start-scale-y'));
          const startWidth = parseFloat(target.getAttribute('data-start-width'));
          const startHeight = parseFloat(target.getAttribute('data-start-height'));

          let newScaleX = startScaleX;
          let newScaleY = startScaleY;
          let newX = startX;
          let newY = startY;

          if (event.edges.left) {
            const widthChange = startWidth - event.rect.width;
            newScaleX = startScaleX * (event.rect.width / startWidth);
            newX = startX + widthChange * startScaleX;
          } else if (event.edges.right) {
            newScaleX = startScaleX * (event.rect.width / startWidth);
          }

          if (event.edges.top) {
            const heightChange = startHeight - event.rect.height;
            newScaleY = startScaleY * (event.rect.height / startHeight);
            newY = startY + heightChange * startScaleY;
          } else if (event.edges.bottom) {
            newScaleY = startScaleY * (event.rect.height / startHeight);
          }

          const currentRotation = getCurrentRotation(target);

          target.setAttribute('transform', `translate(${newX}, ${newY}) scale(${newScaleX}, ${newScaleY}) rotate(${currentRotation} ${target.getAttribute('data-center-x')} ${target.getAttribute('data-center-y')})`);
          target.setAttribute('data-x', newX);
          target.setAttribute('data-y', newY);
          target.setAttribute('data-scale-x', newScaleX);
          target.setAttribute('data-scale-y', newScaleY);
        },
        end() {
          updatePaths();
          generateMandala();
        }
      }
    })
    .gesturable({
      listeners: {
        start(event) {
          if (currentTool === 'rotate' && isDraggableShape(event.target)) {
            const point = getPointInSVG(event);
            startRotation(event.target, point);
            document.addEventListener('mousemove', handleRotationMove);
            document.addEventListener('mouseup', handleRotationEnd);
          }
        }
      }
    });

  shape.classList.add('resizable');
  shape.style.cursor = 'default';
  shape.style.pointerEvents = 'all';
}

function isDraggableShape(element) {
  return element.parentNode === drawingLayer && element.classList.contains('resizable');
}

function initializeEventListeners() {
  ['mousedown', 'mousemove', 'mouseup', 'mouseleave'].forEach(event =>
    triangleTemplate.addEventListener(event, handleDrawing)
  );

  document.querySelector('div[data-tool="undo"]').addEventListener('click', undo);
  document.querySelector('div[data-tool="redo"]').addEventListener('click', redo);

  clearBtn.addEventListener('click', clearShapes);

  document.querySelectorAll('[data-tool]').forEach(tool => {
    tool.addEventListener('click', (e) => {
      const clickedTool = e.currentTarget.getAttribute('data-tool');

      if (clickedTool === 'random') {
        generateRandomMandala();
        return;
      } else if (['pencil', 'circle', 'line', 'eraser', 'rotate', 'curve'].includes(clickedTool)) {
        currentTool = clickedTool;
        currentMode = clickedTool === 'eraser' ? 'eraser' : 'drawing';
        isDrawingMode = true;
        if (clickedTool === 'curve') {
          curvePoints = [];
          currentCurve = null;
          clickState = 0;
        }
        toggleMode();
      } else if (clickedTool === 'undo' || clickedTool === 'redo') {
        return;
      } else {
        isDrawingMode = false;
      }

      document.querySelectorAll('[data-tool]').forEach(t => t.classList.remove('bg-accent'));
      e.currentTarget.classList.add('bg-accent');
    });
  });
  interact('.shape-menu').draggable({
    listeners: {
      move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      },
      end(event) {
        const dropPoint = getPointInSVG(event);
        if (dropPoint.x >= 0 && dropPoint.x <= triangleTemplate.width.baseVal.value && dropPoint.y >= 0 && dropPoint.y <= triangleTemplate.height.baseVal.value) {
          const shapeType = event.target.getAttribute('data-shape');
          addShapeToDrawingLayer(dropPoint.x, dropPoint.y, shapeType);

          currentMode = 'drag';
          toggleMode();
        }
        event.target.style.transform = '';
        event.target.removeAttribute('data-x');
        event.target.removeAttribute('data-y');
      }
    }
  });

  slicesSlider.addEventListener('input', (e) => {
    segments = parseInt(e.target.value);
    slicesValue.textContent = segments;
    updateTriangleTemplate();
    generateMandala();
  });

  radiusSlider.addEventListener('input', (e) => {
    radiusValue.textContent = e.target.value;
    updateTriangleTemplate();
    generateMandala();
  });

  document.querySelectorAll('.color-circle').forEach(circle => {
    circle.addEventListener('click', handleColorSelection);
  });

  document.querySelectorAll('.color-circle').forEach(circle => {
    circle.addEventListener('click', handleColorSelection);
  });

  // Add event listener for custom color input
  const customColorInput = document.getElementById('custom-color');
  customColorInput.addEventListener('input', handleColorSelection);

  const publishBtn = document.getElementById('publishBtn');
  publishBtn.addEventListener('click', publishDesign);

}

function handleColorSelection(e) {
  const isCustomColor = e.target.type === 'color';
  selectedColor = isCustomColor ? e.target.value : e.target.getAttribute('data-color');
  console.log(`${isCustomColor ? 'Custom color' : 'Color'} selected:`, selectedColor);

  document.querySelectorAll('.color-circle, #custom-color').forEach(element => {
    element.classList.remove('ring-2', 'ring-offset-2', 'ring-black');
  });
  e.target.classList.add('ring-2', 'ring-offset-2', 'ring-black');

  // Update currentColor for drawing operations
  currentColor = selectedColor;
}


freeformBtn.addEventListener('click', () => {
  currentMode = 'drawing';
  toggleMode();
});




dragModeBtn.addEventListener('click', () => {
  currentMode = 'drag';
  toggleMode();
});

document.querySelectorAll('input[type="range"]').forEach(function (input) {
  input.style.setProperty('--range-progress', '0%');

  input.addEventListener('input', function () {
    var progress = (this.value - this.min) / (this.max - this.min) * 100;
    this.style.setProperty('--range-progress', `${progress}%`);
  });

  var progress = (input.value - input.min) / (input.max - input.min) * 100;
  input.style.setProperty('--range-progress', `${progress}%`);
});




function generateRandomMandala() {
  clearShapes();

  // Generate a random number of sectors
  const randomSectors = rndInt(5, 10);
  segments = randomSectors;
  updateSegmentsUI();
  updateTriangleTemplate();

  const trianglePath = triangleTemplate.querySelector('path');
  const trianglePathD = trianglePath.getAttribute('d');
  const match = trianglePathD.match(/M([\d.]+),([\d.]+)/);

  if (match) {
    const triangleBottomX = parseFloat(match[1]);
    const triangleBottomY = parseFloat(match[2]);

    // Generate flower with size information
    const { flower, totalRadius } = generateFlower(randomSectors);

    // Position the flower at the bottom center of the triangle
    const xPosition = triangleBottomX - totalRadius;
    const yPosition = triangleBottomY - totalRadius;
    // Adjust this multiplier to move the flower up or down

    flower.setAttribute('transform', `translate(${xPosition}, ${yPosition})`);
    drawingLayer.appendChild(flower);

    drawingLayer.appendChild(flower);

    updatePaths();
    generateMandala();
    mandala.classList.add('random-mandala');

  } else {
    console.error('Unable to parse triangle path data');
  }
}

function updateSegmentsUI() {
  // Update the slider and displayed value
  slicesSlider.value = segments;
  slicesValue.textContent = segments;

  // Update the slider's visual progress
  const progress = (segments - slicesSlider.min) / (slicesSlider.max - slicesSlider.min) * 100;
  slicesSlider.style.setProperty('--range-progress', `${progress}%`);
}



document.addEventListener('DOMContentLoaded', function () {

  initializeEventListeners();
  Array.from(drawingLayer.children).forEach(makeShapeInteractive);

  currentMode = 'drag';
  toggleMode();

  updateTriangleTemplate();
  showInitialIndication();


  updatePaths();
  generateMandala();

  const layoutDownloadBtn = document.getElementById('layoutdownloadBtn');
  const layoutDownloadOptions = document.getElementById('layoutdownloadOptions');
  const outputDownloadBtn = document.getElementById('outputdownloadBtn');
  const outputDownloadOptions = document.getElementById('outputdownloadOptions');

  layoutDownloadBtn.addEventListener('click', function (event) {
    if (event.target.closest('svg:last-child')) {
      layoutDownloadOptions.classList.toggle('hidden');
    } else {
      downloadCanvasFromSVG('mandala', 'layout.png');
    }
  });

  outputDownloadBtn.addEventListener('click', function (event) {
    if (event.target.closest('svg:last-child')) {
      outputDownloadOptions.classList.toggle('hidden');
    } else {
      downloadCanvas('mandalaCanvas', 'output.png');
    }
  });

  document.addEventListener('click', function (event) {
    if (!layoutDownloadBtn.contains(event.target) && !layoutDownloadOptions.contains(event.target)) {
      layoutDownloadOptions.classList.add('hidden');
    }
    if (!outputDownloadBtn.contains(event.target) && !outputDownloadOptions.contains(event.target)) {
      outputDownloadOptions.classList.add('hidden');
    }
  });

  document.getElementById('downloadLayoutSVG').addEventListener('click', function () {
    downloadSVGFile('mandala', 'layout.svg');
    layoutDownloadOptions.classList.add('hidden');
  });

  document.getElementById('downloadLayoutPDF').addEventListener('click', function () {
    downloadPDFFromSVG('mandala', 'layout.pdf');
    layoutDownloadOptions.classList.add('hidden');
  });

  document.getElementById('downloadOutputPDF').addEventListener('click', function () {
    downloadPDF('mandalaCanvas', 'output.pdf');
    outputDownloadOptions.classList.add('hidden');
  });

 // ... existing code ...

// ... existing code ...
  



  });

document.getElementById('navbarToggle').addEventListener('click', function () {
  const navbarCollapse = document.getElementById('navbarCollapse');
  navbarCollapse.classList.toggle('open');
});


function checkCompatibility() {
  let hasTouchScreen = false;
  let isFirefox = typeof InstallTrigger !== 'undefined';
  
  const modal = document.getElementById("compatibilityModal");
  const message = document.getElementById("compatibilityMessage");
  const continueButton = document.getElementById("continueButton");

  if ("maxTouchPoints" in navigator) {
    hasTouchScreen = navigator.maxTouchPoints > 0;
  } else if ("msMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msMaxTouchPoints > 0;
  } else {
    const mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
      hasTouchScreen = !!mQ.matches;
    } else if ('orientation' in window) {
      hasTouchScreen = true; // deprecated, but good fallback
    } else {
      const UA = navigator.userAgent;
      hasTouchScreen = (
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
      );
    }
  }

  if (isFirefox) {
    message.textContent = "This site is not fully compatible with Firefox. Please switch to a Chromium-based browser for the best experience.";
    modal.classList.remove("hidden");
  } else if (hasTouchScreen) {
    message.textContent = "This site is designed for desktop devices. Some functionality may not work on mobile devices.";
    modal.classList.remove("hidden");
  }
  continueButton.addEventListener("click", function () {
    modal.classList.add("hidden");
  });
 
}


