self.onmessage = function(event) {
  const { rgba, width, height, x, y, color } = event.data;
  floodfill(rgba, width, height, x, y, color);
  self.postMessage(rgba);
};

function floodfill(rgba, width, height, x, y, color) {
  var visited = new Uint8Array(width * height);
  var queue = new Int32Array(2 * width * height);

  var startColor = [
    rgba[(y * width + x) * 4 + 0],
    rgba[(y * width + x) * 4 + 1],
    rgba[(y * width + x) * 4 + 2],
    rgba[(y * width + x) * 4 + 3]
  ];

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
    var y = queue[--n];
    var x = queue[--n];

    var x1 = x;
    while (x1 > 0 && !visited[x1 - 1 + y * width] && colorsMatch(startColor, getPixelColor(rgba, x1 - 1, y, width))) x1--;

    var x2 = x;
    while (x2 < width - 1 && !visited[x2 + 1 + y * width] && colorsMatch(startColor, getPixelColor(rgba, x2 + 1, y, width))) x2++;

    for (var x = x1; x <= x2; x++) {
      var i = x + y * width;
      visited[i] = 1;
      rgba[i * 4 + 0] = color[0];
      rgba[i * 4 + 1] = color[1];
      rgba[i * 4 + 2] = color[2];
      rgba[i * 4 + 3] = 255;
    }

    if (y + 1 < height) {
      for (var x = x1; x <= x2; x++) {
        var i = x + (y + 1) * width;
        if (!visited[i] && colorsMatch(startColor, getPixelColor(rgba, x, y + 1, width))) {
          visited[i] = 1;
          queue[n++] = x;
          queue[n++] = y + 1;
        }
      }
    }

    if (y > 0) {
      for (var x = x1; x <= x2; x++) {
        var i = x + (y - 1) * width;
        if (!visited[i] && colorsMatch(startColor, getPixelColor(rgba, x, y - 1, width))) {
          visited[i] = 1;
          queue[n++] = x;
          queue[n++] = y - 1;
        }
      }
    }
  }
}

function getPixelColor(data, x, y, width) {
  const index = (y * width + x) * 4;
  return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function colorsMatch(color1, color2) {
  return color1[0] === color2[0] && color1[1] === color2[1] && color1[2] === color2[2] && color1[3] === color2[3];
}