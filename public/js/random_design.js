
const { PI, sin, cos, round, floor, ceil, min, max } = Math;

function rnd(min, max) {
  if (max === undefined) { max = min; min = 0; }
  return Math.random() * (max - min) + min;
}

function rndInt(min, max) {
  if (max === undefined) { max = min; min = 0; }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

class Flower {
  constructor(conf) {
    this.conf = {
      alpha: 1,
      angle: 0,
      iRadius: 5, iRadiusCoef: 2,
      oRadius: 20, oRadiusCoef: 3,
      layerAnim: 'layerAnim' + (rndInt(1, 12)),
      reverseDelay: Math.random() > 0.5,
      ...conf
    };
    this.create();
  }
  create() {
    let { parent, x, y, petals, rings, step, colors, alpha, angle, iRadius, iRadiusCoef, oRadius, oRadiusCoef, layerAnim, reverseDelay, totalRadius } = this.conf;

    this.group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.group.classList.add('flower');
    // Center the flower group
    this.group.setAttribute('transform', `translate(${x-totalRadius},${y-totalRadius})`);
    parent.appendChild(this.group);

    if (!colors) {
      colors = [chroma.random(), chroma.random(), chroma.random()];
    }




    const cscale = chroma.scale(colors);
    let layer, np, color, di;
    for (let i = rings; i > 0; i--) {
      layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      layer.classList.add('layer');

      np = floor((i + step - 1) / step) * petals;
      color = cscale(i * 1 / rings).alpha(alpha);
      this.createPetalsRing(layer, totalRadius, totalRadius, np, iRadius + i * iRadiusCoef, oRadius + i * oRadiusCoef, angle + i % 2 * PI / np, color);

      di = reverseDelay ? (rings - i + 1) : i;

      this.group.appendChild(layer);
    }
  }
  createPetalsRing(parent, x, y, n, iRadius, oRadius, angle, fill) {
    const da = 2 * PI / n;
    const dr = oRadius - iRadius;
    const cpda = rnd(0.5 * da / 5, 1.5 * da / 5);
    const cpdr = rnd(dr * 0.25, dr * 1.1);
    let a;
    for (let i = 0; i < n; i++) {
      a = angle + i * da;
      new Petal({
        parent,
        x, y,
        startA: a,
        endA: a + da,
        iRadius,
        oRadius,
        cpda,
        cpdr,
        fill,
      });
    }
  }
}

class Petal {
  constructor({ parent, x, y, startA, endA, iRadius, oRadius, cpda, cpdr, fill }) {
    this.parent = parent;
    this.fill = fill;

    const da = endA - startA;
    const iRadius0 = iRadius / 5;
    this.sp = [x + cos(startA + da / 2) * iRadius0, y + sin(startA + da / 2) * iRadius0];
    this.cp1 = [x + cos(startA - cpda) * (iRadius + cpdr), y + sin(startA - cpda) * (iRadius + cpdr)];
    this.cp2 = [x + cos(endA + cpda) * (iRadius + cpdr), y + sin(endA + cpda) * (iRadius + cpdr)];
    this.ep = [x + cos(startA + da / 2) * oRadius, y + sin(startA + da / 2) * oRadius];

    this.curve1 = new QCurve({ sp: this.sp, cp: this.cp1, ep: this.ep });
    this.curve2 = new QCurve({ sp: this.sp, cp: this.cp2, ep: this.ep });
    this.create();
  }
  create() {
    this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.path.setAttribute('d', this.pathD());
    this.path.style.fill = this.fill;
    this.path.setAttribute('stroke', 'none');
    this.parent.appendChild(this.path);
  }
  pathD() {
    return [
      this.curve1.pathD(),
      this.curve2.pathD(),
    ].join(' ');
  }
}

class QCurve {
  constructor({ sp, cp, ep }) {
    this.sp = sp;
    this.cp = cp;
    this.ep = ep;
  }
  pathD() {
    return [
      `M${this.sp[0]} ${this.sp[1]}`,
      `Q${this.cp[0]} ${this.cp[1]}`,
      `${this.ep[0]} ${this.ep[1]}`,
    ].join(' ');
  }
}



function generateFlower(sectors) {
  const flowerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  flowerGroup.classList.add('flower');

  const iRadiusCoef = rnd(1, 9);
  const oRadiusCoef = rnd(iRadiusCoef, 9);
  const rings = rndInt(3, 8);
  const iRadius = 1;
  const oRadius = rnd(80, 150);

  const totalRadius = oRadius + rings * oRadiusCoef;
  new Flower({
    parent: flowerGroup,
    x: totalRadius,
    y: totalRadius,
    petals: sectors,
    rings: rings,
    step: rndInt(3, 10),
    alpha: 1,
    angle: rnd(Math.PI),
    iRadius: iRadius,
    iRadiusCoef,
    oRadius: oRadius,
    oRadiusCoef,
    totalRadius: totalRadius,
  });


  return { flower: flowerGroup, totalRadius: totalRadius };
}

window.generateFlower = generateFlower;
window.rnd = rnd;
window.rndInt = rndInt;