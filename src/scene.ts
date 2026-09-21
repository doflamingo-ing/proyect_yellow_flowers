import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ShapeData {
  positions: Float32Array;
  colors: Float32Array;
}

type ShapeFactory = (count: number, random: () => number) => ShapeData;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function setPointAndColor(
  positions: Float32Array,
  colors: Float32Array,
  index: number,
  x: number,
  y: number,
  z: number,
  r: number,
  g: number,
  b: number,
) {
  const i3 = index * 3;
  positions[i3] = x;
  positions[i3 + 1] = y;
  positions[i3 + 2] = z;
  colors[i3] = r;
  colors[i3 + 1] = g;
  colors[i3 + 2] = b;
}

const flower: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 grados
  // Centro floral alineado exactamente con la esfera de luz solar central (0, 0.15, 0)
  const centerY = 0.15;

  for (let i = 0; i < count; i += 1) {
    const t = random();
    if (t < 0.20) {
      // 1. Centro floral con espiral áurea de Fermat (semillas de girasol)
      const s = random();
      const r = 0.46 * Math.sqrt(s);
      const theta = i * goldenAngle;
      const x = r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);
      const z = (1 - s) * 0.16 + (random() - 0.5) * 0.05;
      // Tonalidad ámbar oscuro / marrón dorado en el núcleo
      const darkFactor = 0.55 + 0.45 * Math.sqrt(s);
      setPointAndColor(positions, colors, i, x, y, z, 0.72 * darkFactor, 0.38 * darkFactor, 0.06);
    } else if (t < 0.68) {
      // 2. Pétalos concéntricos con líneas de separación contrastadas en amarillo ámbar oscuro
      const petalIndex = Math.floor(random() * 14);
      const petalBaseAngle = (petalIndex / 14) * Math.PI * 2;
      const u = Math.pow(random(), 0.72); // Progreso de base a punta
      const r = 0.45 + u * 1.38;
      const maxWidth = 0.35;
      const width = maxWidth * Math.sin(Math.PI * u) * (1.1 - 0.25 * u);

      // 38% de partículas reforzando los trazos y contornos laterales del pétalo
      const isEdge = random() < 0.38;
      let lateral: number;
      if (isEdge) {
        const sign = random() < 0.5 ? -1 : 1;
        lateral = sign * (0.85 + 0.15 * random());
      } else {
        lateral = (random() - 0.5) * 1.7; // relleno interior
      }
      const radialOffset = lateral * width;

      const cosA = Math.cos(petalBaseAngle);
      const sinA = Math.sin(petalBaseAngle);
      const x = r * cosA - radialOffset * sinA;
      const y = centerY + r * sinA + radialOffset * cosA;
      const z = 0.22 * Math.sin(Math.PI * u) * (1 - 0.7 * lateral * lateral) + (random() - 0.5) * 0.035;

      if (isEdge || Math.abs(lateral) > 0.75) {
        // Trazo de contorno: amarillo oscuro / dorado ámbar profundo para que las líneas se destaquen
        setPointAndColor(positions, colors, i, x, y, z, 0.88, 0.48, 0.04);
      } else {
        // Relleno del pétalo: amarillo brillante radiante
        const glowFactor = 0.85 + 0.15 * random();
        setPointAndColor(positions, colors, i, x, y, z, 1.0 * glowFactor, 0.88 * glowFactor, 0.22 * glowFactor);
      }
    } else if (t < 0.80) {
      // 3. Tallo botánico con suave curvatura orgánica en S y trazo delineado
      const s = random();
      const stemY = centerY - 0.45 - s * 2.0;
      const stemX = 0.07 * Math.sin(s * Math.PI * 1.5);
      const stemRadius = 0.055;
      const ang = random() * Math.PI * 2;
      const isOuter = random() < 0.45;
      const r = stemRadius * (isOuter ? (0.8 + 0.2 * Math.sqrt(random())) : Math.sqrt(random()));
      const x = stemX + Math.cos(ang) * r;
      const y = stemY;
      const z = Math.sin(ang) * r;
      if (isOuter) {
        setPointAndColor(positions, colors, i, x, y, z, 0.45, 0.52, 0.12);
      } else {
        setPointAndColor(positions, colors, i, x, y, z, 0.32, 0.62, 0.18);
      }
    } else {
      // 4. Hojas verdes lanceoladas con nervadura central y trazos marginales nítidos
      const isLeft = random() < 0.5;
      const attachY = isLeft ? (centerY - 0.95) : (centerY - 1.55);
      const leafAngle = isLeft ? 2.45 : 0.68;
      const leafLen = isLeft ? 1.25 : 1.15;
      const maxW = isLeft ? 0.45 : 0.40;

      const s = Math.pow(random(), 0.85); // a lo largo de la nervadura
      const w = maxW * Math.sin(Math.PI * s);
      const isVeinOrEdge = random() < 0.40;
      let lat: number;
      if (isVeinOrEdge) {
        if (random() < 0.5) {
          lat = (random() - 0.5) * 0.15; // nervadura central
        } else {
          lat = (random() < 0.5 ? -1 : 1) * (0.85 + 0.15 * random()); // borde marginal
        }
      } else {
        lat = (random() - 0.5) * 1.7;
      }

      const dirX = Math.cos(leafAngle);
      const dirY = Math.sin(leafAngle);
      const perpX = -dirY;
      const perpY = dirX;

      const lx = dirX * s * leafLen + perpX * lat * w;
      const ly = attachY + dirY * s * leafLen + perpY * lat * w;
      const lz = 0.18 * Math.sin(Math.PI * s) * (1 - Math.abs(lat) * 0.5) + (random() - 0.5) * 0.035;

      if (isVeinOrEdge) {
        setPointAndColor(positions, colors, i, lx, ly, lz, 0.15, 0.46, 0.14);
      } else {
        setPointAndColor(positions, colors, i, lx, ly, lz, 0.38, 0.76, 0.22);
      }
    }
  }
  return { positions, colors };
};

const heart: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const t = (random() - 0.5) * Math.PI * 2;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    const hx = 16 * Math.pow(sinT, 3);
    const hy = 13 * cosT - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const fill = Math.pow(random(), 0.55);
    const scale = 0.115;

    const x = hx * scale * fill;
    const y = (hy * scale * fill) + 0.15;

    const maxZ = 0.65 * (1 - fill * 0.4) * Math.sin(Math.abs(t) / 2);
    const z = maxZ * (random() - 0.5) * 2;

    if (fill > 0.82) {
      setPointAndColor(positions, colors, i, x, y, z, 0.98, 0.22, 0.38);
    } else {
      setPointAndColor(positions, colors, i, x, y, z, 1.0, 0.65, 0.45);
    }
  }
  return { positions, colors };
};

const butterfly: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const t = random();
    if (t < 0.12) {
      // 1. Cuerpo esbelto: cabeza, tórax y abdomen
      const bodyS = random();
      const bodyY = 0.65 - bodyS * 1.85;
      let bodyR = 0.06;
      if (bodyS < 0.18) {
        bodyR = 0.11 * Math.sin((bodyS / 0.18) * Math.PI);
      } else if (bodyS < 0.48) {
        bodyR = 0.14 * (1 + 0.3 * Math.sin(((bodyS - 0.18) / 0.30) * Math.PI));
      } else {
        bodyR = 0.10 * (1 - (bodyS - 0.48) / 0.52);
      }
      const ang = random() * Math.PI * 2;
      const r = Math.max(0.02, bodyR) * Math.sqrt(random());
      setPointAndColor(positions, colors, i, Math.cos(ang) * r, bodyY, Math.sin(ang) * r, 1.0, 0.92, 0.48);
    } else if (t < 0.18) {
      // 2. Dos antenas curvadas y elegantes
      const side = random() < 0.5 ? -1 : 1;
      const s = Math.pow(random(), 0.7);
      const antX = side * (0.05 + 0.48 * s * s);
      const antY = 0.68 + 0.85 * s - 0.15 * Math.pow(s, 3);
      const antZ = 0.12 * s + (random() - 0.5) * 0.02;
      setPointAndColor(positions, colors, i, antX, antY, antZ, 1.0, 0.95, 0.70);
    } else {
      // 3. Alas con contorno lobulado y ángulo diedro en V tridimensional
      const side = random() < 0.5 ? -1 : 1;
      const isForewing = random() < 0.58;

      let wx = 0;
      let wy = 0;

      if (isForewing) {
        const u = Math.pow(random(), 0.65);
        const spread = random();
        const maxSpan = 1.95;
        const angle = 0.28 + spread * 0.78;
        const r = 0.18 + u * maxSpan;
        const scallop = 1.0 - 0.12 * Math.sin(spread * Math.PI * 3);
        wx = side * (0.08 + Math.cos(angle) * r * scallop);
        wy = 0.25 + Math.sin(angle) * r * scallop;
      } else {
        const u = Math.pow(random(), 0.7);
        const spread = random();
        const maxSpan = 1.35;
        const angle = -0.35 - spread * 0.82;
        const r = 0.12 + u * maxSpan;
        const scallop = 1.0 - 0.14 * Math.sin(spread * Math.PI * 4);
        wx = side * (0.06 + Math.cos(angle) * r * scallop);
        wy = -0.05 + Math.sin(angle) * r * scallop;
      }

      const distFromCenter = Math.abs(wx);
      const dihedral = 0.44 * Math.pow(distFromCenter, 0.9);
      const camber = 0.14 * Math.sin(distFromCenter * 1.5);
      const wz = dihedral + camber + (random() - 0.5) * 0.04;

      if (distFromCenter > 1.4) {
        setPointAndColor(positions, colors, i, wx, wy, wz, 1.0, 0.72, 0.18);
      } else {
        setPointAndColor(positions, colors, i, wx, wy, wz, 1.0, 0.88, 0.38);
      }
    }
  }
  return { positions, colors };
};

const crescent: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const centerSx = 0.0;
  const centerSy = 0.15;

  for (let i = 0; i < count; i += 1) {
    if (random() < 0.75) {
      // 1. Arco de luna creciente estilizado y reducido que abraza el sol central
      // Rango polar de -2.42 a +2.42 rad (~ -138.5 a +138.5 grados) para que las puntas se cierren hacia la izquierda
      const u = (random() - 0.5) * 2; // de -1 a 1
      const maxAngle = 2.42;
      const theta = u * maxAngle;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const R_outer = 1.76;
      const maxW = 0.44;
      // Ancho que se afila armónicamente hasta 0 en las puntas extremas
      const width = maxW * Math.pow(Math.max(0, 1 - u * u), 0.75);

      const isRim = random() < 0.38;
      const v = isRim ? (random() < 0.5 ? 0.03 * random() : 1.0 - 0.03 * random()) : Math.pow(random(), 0.85);
      const r = R_outer - v * width;

      // Origen del arco ligeramente a la derecha para abrazar concéntricamente el sol en (0, 0.15)
      const ox = 0.12;
      const oy = 0.15;
      const x = ox + r * cosT;
      const y = oy + r * sinT;
      const z = (random() - 0.5) * 0.14 * (1 - u * u * 0.5);

      // Blanco plateado celestial nacarado con bordes y puntas en oro estelar
      if (isRim || Math.abs(u) > 0.75) {
        setPointAndColor(positions, colors, i, x, y, z, 1.0, 0.95, 0.75);
      } else {
        setPointAndColor(positions, colors, i, x, y, z, 0.92, 0.96, 1.0);
      }
    } else {
      // 2. Rayos solares y corona emanando DIRECTAMENTE del sol central en (0, 0.15)
      const isRay = random() < 0.65;
      let x = 0;
      let y = 0;

      if (isRay) {
        // 12 rayos estelares solares agudos que nacen desde la superficie del sol central
        const rayIndex = Math.floor(random() * 12);
        const rayAngle = (rayIndex / 12) * Math.PI * 2 + (random() - 0.5) * 0.06;
        const progress = Math.pow(random(), 0.7);
        const rayDist = 0.28 + progress * 0.54; // Emana desde el borde del sol hacia afuera
        x = centerSx + Math.cos(rayAngle) * rayDist;
        y = centerSy + Math.sin(rayAngle) * rayDist;
      } else {
        // Corona solar cercana a la esfera central
        const ang = random() * Math.PI * 2;
        const r = 0.25 + 0.15 * Math.sqrt(random());
        x = centerSx + Math.cos(ang) * r;
        y = centerSy + Math.sin(ang) * r;
      }
      const z = (random() - 0.5) * 0.10;
      // Amarillo sol dorado radiante brillante
      setPointAndColor(positions, colors, i, x, y, z, 1.0, 0.88, 0.18);
    }
  }
  return { positions, colors };
};

const star: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Centro de la estrella perfectamente alineado con el sol central de la escena (0, 0.15)
  const centerSx = 0.0;
  const centerSy = 0.15;

  // Parámetros de la estrella clásica de 5 puntas rectas y afiladas
  const numPoints = 5;
  const R_outer = 1.95; // Radio a los 5 vértices exteriores
  const R_inner = 0.76; // Radio a los 5 valles interiores
  const starVertices: { x: number; y: number }[] = [];

  for (let k = 0; k < numPoints; k += 1) {
    // Vértice exterior (punta aguda)
    const tipAngle = Math.PI / 2 + k * ((Math.PI * 2) / numPoints);
    starVertices.push({
      x: Math.cos(tipAngle) * R_outer,
      y: Math.sin(tipAngle) * R_outer,
    });
    // Vértice interior (valle agudo a mitad de camino)
    const valleyAngle = tipAngle + Math.PI / numPoints;
    starVertices.push({
      x: Math.cos(valleyAngle) * R_inner,
      y: Math.sin(valleyAngle) * R_inner,
    });
  }

  const numEdges = starVertices.length; // 10 segmentos de recta

  for (let i = 0; i < count; i += 1) {
    const t = random();
    if (t < 0.44) {
      // 1. Trazado del contorno perimetral recto y agudo (elimina el aspecto de flor)
      const edgeIndex = Math.floor(random() * numEdges);
      const v1 = starVertices[edgeIndex];
      const v2 = starVertices[(edgeIndex + 1) % numEdges];
      const s = random(); // posición a lo largo de la arista recta
      const px = (1 - s) * v1.x + s * v2.x;
      const py = (1 - s) * v1.y + s * v2.y;

      // Muy leve dispersión para trazo limpio y afilado
      const jitter = (random() - 0.5) * 0.025;
      const x = centerSx + px + jitter;
      const y = centerSy + py + jitter;
      const z = (random() - 0.5) * 0.08;

      // Trazo ámbar dorado oscuro para que las líneas rectas de la estrella se noten nítidas
      setPointAndColor(positions, colors, i, x, y, z, 0.92, 0.52, 0.06);
    } else if (t < 0.70) {
      // 2. Trazado de las 5 aristas radiales rectas desde el sol central hacia cada una de las 5 puntas
      const tipIndex = Math.floor(random() * numPoints);
      const tipVertex = starVertices[tipIndex * 2]; // Vértices pares son las puntas exteriores
      const s = Math.pow(random(), 0.75); // de 0 (centro) a 1 (punta)
      const x = centerSx + tipVertex.x * s;
      const y = centerSy + tipVertex.y * s;
      // Arista dorsal que nace del sol y tiene suave elevación
      const z = 0.22 * (1 - s) * (random() < 0.5 ? 1 : -0.7);

      // Oro luminoso resplandeciente para las aristas dorsales
      setPointAndColor(positions, colors, i, x, y, z, 1.0, 0.96, 0.65);
    } else {
      // 3. Relleno interior uniforme en los 10 triángulos estelares
      const edgeIndex = Math.floor(random() * numEdges);
      const v1 = starVertices[edgeIndex];
      const v2 = starVertices[(edgeIndex + 1) % numEdges];

      // Muestreo dentro del triángulo (centro, v1, v2)
      const r1 = Math.sqrt(random());
      const r2 = random();
      const u = 1 - r1; // factor del centro
      const v = r1 * (1 - r2); // factor de v1
      const w = r1 * r2; // factor de v2

      const x = centerSx + (v * v1.x + w * v2.x);
      const y = centerSy + (v * v1.y + w * v2.y);
      const z = (random() - 0.5) * 0.28 * (1 - r1 * 0.45);

      // Oro cálido brillante
      setPointAndColor(positions, colors, i, x, y, z, 1.0, 0.84, 0.24);
    }
  }
  return { positions, colors };
};

type Vec3 = [number, number, number];
type Rgb = [number, number, number];
type PartSampler = (random: () => number) => [number, number, number, number, number, number];

function sphereDirection(random: () => number): Vec3 {
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return [s * Math.cos(angle), s * Math.sin(angle), z];
}

function tint(color: Rgb, random: () => number): Rgb {
  const k = 0.84 + 0.16 * random();
  return [color[0] * k, color[1] * k, color[2] * k];
}

// Elipsoide con la mayoría de puntos sobre la superficie; `skip` permite dejar huecos (pupilas)
function ellipsoidPart(center: Vec3, radii: Vec3, color: Rgb, skip?: (d: Vec3) => boolean): PartSampler {
  return (random) => {
    let d = sphereDirection(random);
    while (skip && skip(d)) d = sphereDirection(random);
    const k = random() < 0.78 ? 1 : Math.cbrt(random());
    const [r, g, b] = tint(color, random);
    return [center[0] + d[0] * radii[0] * k, center[1] + d[1] * radii[1] * k, center[2] + d[2] * radii[2] * k, r, g, b];
  };
}

// Tubo grueso que sigue una polilínea (astas, brazos)
function tubePart(points: Vec3[], radiusStart: number, radiusEnd: number, color: Rgb): PartSampler {
  return (random) => {
    const segments = points.length - 1;
    const seg = Math.min(segments - 1, Math.floor(random() * segments));
    const t = random();
    const a = points[seg];
    const b = points[seg + 1];
    const radius = radiusStart + (radiusEnd - radiusStart) * ((seg + t) / segments);
    const d = sphereDirection(random);
    const k = 0.7 + 0.3 * random();
    const [r, g, bl] = tint(color, random);
    return [
      a[0] + (b[0] - a[0]) * t + d[0] * radius * k,
      a[1] + (b[1] - a[1]) * t + d[1] * radius * k,
      a[2] + (b[2] - a[2]) * t + d[2] * radius * k,
      r,
      g,
      bl,
    ];
  };
}

// Corazón que Elliot sostiene frente al pecho
function heldHeartPart(center: Vec3, scale: number): PartSampler {
  return (random) => {
    const t = (random() - 0.5) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const fill = Math.pow(random(), 0.5);
    const z = center[2] + (random() - 0.5) * 0.2 * (1 - fill * fill * 0.7);
    if (fill > 0.8) return [center[0] + hx * scale * fill, center[1] + (hy + 2.5) * scale * fill, z, 1.0, 0.16, 0.3];
    return [center[0] + hx * scale * fill, center[1] + (hy + 2.5) * scale * fill, z, 1.0, 0.42, 0.52];
  };
}

// Elliot (Open Season): venado de astas disparejas abrazando un corazón
const elliot: ShapeFactory = (count, random) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  // Tonos claros: el material es aditivo, así que los colores oscuros desaparecerían
  const brown: Rgb = [0.78, 0.46, 0.2];
  const cream: Rgb = [1.0, 0.9, 0.7];
  const antler: Rgb = [0.95, 0.78, 0.5];
  const white: Rgb = [0.9, 0.9, 0.85];
  const pink: Rgb = [1.0, 0.62, 0.6];
  const nose: Rgb = [0.5, 0.26, 0.3];
  const hoof: Rgb = [0.55, 0.32, 0.18];
  const pupilHole = (d: Vec3) => d[2] > 0.78;

  const parts: { weight: number; sample: PartSampler }[] = [
    { weight: 0.17, sample: ellipsoidPart([0, 0.95, 0], [0.52, 0.46, 0.44], brown) },
    { weight: 0.05, sample: ellipsoidPart([0, 0.8, 0.36], [0.27, 0.2, 0.24], cream) },
    { weight: 0.012, sample: ellipsoidPart([0, 0.87, 0.58], [0.09, 0.065, 0.055], nose) },
    { weight: 0.018, sample: ellipsoidPart([-0.2, 1.06, 0.38], [0.095, 0.095, 0.095], white, pupilHole) },
    { weight: 0.018, sample: ellipsoidPart([0.2, 1.06, 0.38], [0.095, 0.095, 0.095], white, pupilHole) },
    { weight: 0.03, sample: ellipsoidPart([-0.58, 1.2, -0.02], [0.27, 0.13, 0.07], brown) },
    { weight: 0.03, sample: ellipsoidPart([0.58, 1.2, -0.02], [0.27, 0.13, 0.07], brown) },
    { weight: 0.012, sample: ellipsoidPart([-0.58, 1.2, 0.03], [0.19, 0.08, 0.04], pink) },
    { weight: 0.012, sample: ellipsoidPart([0.58, 1.2, 0.03], [0.19, 0.08, 0.04], pink) },
    // Asta izquierda completa y ramificada
    { weight: 0.05, sample: tubePart([[-0.28, 1.3, 0], [-0.4, 1.6, 0], [-0.35, 1.8, 0.02], [-0.5, 2.05, 0.02]], 0.06, 0.03, antler) },
    { weight: 0.016, sample: tubePart([[-0.4, 1.6, 0], [-0.72, 1.78, 0]], 0.04, 0.025, antler) },
    { weight: 0.016, sample: tubePart([[-0.36, 1.76, 0.01], [-0.12, 1.94, 0.01]], 0.035, 0.022, antler) },
    // Asta derecha rota: solo un muñón
    { weight: 0.026, sample: tubePart([[0.28, 1.3, 0], [0.4, 1.5, 0], [0.36, 1.64, 0]], 0.07, 0.05, antler) },
    { weight: 0.008, sample: tubePart([[0.4, 1.5, 0], [0.56, 1.58, 0]], 0.03, 0.02, antler) },
    { weight: 0.03, sample: ellipsoidPart([0, 0.5, 0], [0.3, 0.25, 0.3], brown) },
    { weight: 0.15, sample: ellipsoidPart([0, 0, -0.02], [0.55, 0.68, 0.42], brown) },
    { weight: 0.05, sample: ellipsoidPart([0, -0.02, 0.2], [0.36, 0.52, 0.28], cream) },
    // Brazos hacia el corazón
    { weight: 0.04, sample: tubePart([[-0.5, 0.35, 0.05], [-0.56, 0.05, 0.4], [-0.55, -0.05, 0.7]], 0.11, 0.09, brown) },
    { weight: 0.04, sample: tubePart([[0.5, 0.35, 0.05], [0.56, 0.05, 0.4], [0.55, -0.05, 0.7]], 0.11, 0.09, brown) },
    { weight: 0.014, sample: ellipsoidPart([-0.55, -0.05, 0.72], [0.11, 0.11, 0.1], cream) },
    { weight: 0.014, sample: ellipsoidPart([0.55, -0.05, 0.72], [0.11, 0.11, 0.1], cream) },
    { weight: 0.05, sample: ellipsoidPart([-0.26, -0.95, 0.08], [0.2, 0.4, 0.22], brown) },
    { weight: 0.05, sample: ellipsoidPart([0.26, -0.95, 0.08], [0.2, 0.4, 0.22], brown) },
    { weight: 0.014, sample: ellipsoidPart([-0.26, -1.3, 0.14], [0.2, 0.09, 0.25], hoof) },
    { weight: 0.014, sample: ellipsoidPart([0.26, -1.3, 0.14], [0.2, 0.09, 0.25], hoof) },
    { weight: 0.17, sample: heldHeartPart([0, -0.05, 0.74], 0.036) },
  ];
  const total = parts.reduce((sum, part) => sum + part.weight, 0);

  for (let i = 0; i < count; i += 1) {
    let pick = random() * total;
    let part = parts[parts.length - 1];
    for (const candidate of parts) {
      pick -= candidate.weight;
      if (pick <= 0) {
        part = candidate;
        break;
      }
    }
    const [x, y, z, r, g, b] = part.sample(random);
    // El centro del corazón queda justo sobre el sol central (0, 0.15, 0), que lo hace brillar por dentro
    const s = 1.05;
    setPointAndColor(positions, colors, i, x * s, (y + 0.05) * s + 0.15, z * s, r, g, b);
  }
  return { positions, colors };
};

const factories = [flower, heart, butterfly, crescent, star, elliot];

export interface FlowerPositionInfo {
  index: number;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
  opacity: number;
  zIndex: number;
}

export class RomanticScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private material!: THREE.ShaderMaterial;
  private particles!: THREE.Points;
  private sculpture = new THREE.Group();
  private sunCore!: THREE.Mesh;
  private sunCorona!: THREE.Points;
  private galaxyDisk = new THREE.Group();
  private centerTarget!: THREE.Object3D;
  private flowerMaterials!: {
    center: THREE.MeshStandardMaterial;
    petal: THREE.MeshStandardMaterial;
    leaf: THREE.MeshStandardMaterial;
    stem: THREE.MeshStandardMaterial;
  };
  private phraseRings: { group: THREE.Group; speed: number }[] = [];
  private phraseSprites: THREE.Sprite[] = [];
  private orbiters: { pivot: THREE.Group; flower: THREE.Group; speed: number; phase: number }[] = [];
  private flowerTargets: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private pointerDown = new THREE.Vector2();
  private interactive = false;
  private shapes: ShapeData[];
  private currentShape = 0;
  private transitionStart = 0;
  private transitioning = false;
  private frame = 0;
  private reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  private tempVec = new THREE.Vector3();
  private cameraDir = new THREE.Vector3();
  private toFlower = new THREE.Vector3();
  private sculptureCenter = new THREE.Vector3(0, 0.15, 0);
  private rayToFlower = new THREE.Vector3();
  private camToSculpture = new THREE.Vector3();
  private closestPointOnRay = new THREE.Vector3();
  private introProgress = -1;
  private introStart = 0;
  onShapeChange?: (index: number) => void;
  onFlowerClick?: (index: number) => void;
  onCenterClick?: () => void;
  onFlowerPositionsUpdate?: (positions: FlowerPositionInfo[]) => void;

  constructor(private canvas: HTMLCanvasElement, private phrases: string[] = []) {
    const isCompact = window.innerWidth < 600;
    const count = isCompact ? 9000 : 15000;
    const random = mulberry32(2709);
    this.shapes = factories.map((factory) => factory(count, random));

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    // Posición inicial panorámica para la pantalla de bienvenida
    const isMobile = window.innerWidth < 600;
    this.camera.position.set(0, isMobile ? 3.0 : 2.6, isMobile ? 11.8 : 10.6);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enabled = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 18;
    this.controls.minPolarAngle = 0.16;
    this.controls.maxPolarAngle = Math.PI - 0.16;
    this.controls.rotateSpeed = 0.52;
    this.controls.zoomSpeed = 0.82;
    this.controls.panSpeed = 0.48;
    this.controls.target.set(0, -0.15, 0);
    this.controls.update();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.shapes[0].positions.slice(), 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(this.shapes[1].positions.slice(), 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(this.shapes[0].colors.slice(), 3));
    geometry.setAttribute("aTargetColor", new THREE.BufferAttribute(this.shapes[1].colors.slice(), 3));
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) seeds[i] = random();
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 1.75) },
      },
      vertexShader: `
        attribute vec3 aTarget;
        attribute vec3 aColor;
        attribute vec3 aTargetColor;
        attribute float aSeed;
        uniform float uTime;
        uniform float uProgress;
        uniform float uPixelRatio;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float eased = uProgress * uProgress * (3.0 - 2.0 * uProgress);
          vec3 p = mix(position, aTarget, eased);
          float turbulence = sin(aSeed * 40.0 + uTime * 2.0) * sin(3.14159 * uProgress);
          p += normalize(p + vec3(0.001)) * turbulence * 0.32;
          p.z += sin(uTime * 0.7 + aSeed * 20.0) * 0.055;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.2 + aSeed * 2.8) * uPixelRatio * (8.0 / -mv.z);
          vAlpha = 0.45 + aSeed * 0.55;
          vColor = mix(aColor, aTargetColor, eased);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.02, d);
          vec3 color = mix(vColor, vec3(1.0, 0.98, 0.90), glow * 0.38);
          gl_FragColor = vec4(color, glow * vAlpha);
        }
      `,
    });
    this.particles = new THREE.Points(geometry, this.material);
    this.sculpture.add(this.particles);

    const centerHitGeo = new THREE.SphereGeometry(1.9, 12, 10);
    const centerHitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.001,
      depthWrite: false,
    });
    this.centerTarget = new THREE.Mesh(centerHitGeo, centerHitMat);
    this.centerTarget.position.set(0, 0.15, 0);
    this.sculpture.add(this.centerTarget);

    this.scene.add(this.sculpture);

    // Iluminación para resaltar el relieve y colores de las texturas botánicas
    const ambientLight = new THREE.AmbientLight(0xffeed6, 1.45);
    this.scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffd782, 2.5, 18, 1.1);
    sunLight.position.set(0, 0.25, 0);
    this.scene.add(sunLight);

    const topLight = new THREE.DirectionalLight(0xfffaee, 0.85);
    topLight.position.set(2, 6, 4);
    this.scene.add(topLight);

    // Carga de texturas botánicas 1:1 proporcionadas por el usuario
    const textureLoader = new THREE.TextureLoader();
    const centerTex = textureLoader.load("/assets/textures/flower-center.jpg");
    const petalTex = textureLoader.load("/assets/textures/flower-petal.png");
    const leafTex = textureLoader.load("/assets/textures/flower-leaf.png");
    centerTex.colorSpace = THREE.SRGBColorSpace;
    petalTex.colorSpace = THREE.SRGBColorSpace;
    leafTex.colorSpace = THREE.SRGBColorSpace;

    this.flowerMaterials = {
      center: new THREE.MeshStandardMaterial({
        map: centerTex,
        roughness: 0.82,
        metalness: 0.03,
        color: 0xffd269,
        bumpMap: centerTex,
        bumpScale: 0.04,
      }),
      petal: new THREE.MeshStandardMaterial({
        map: petalTex,
        side: THREE.DoubleSide,
        roughness: 0.38,
        metalness: 0.02,
        color: 0xffffff,
        bumpMap: petalTex,
        bumpScale: 0.02,
      }),
      leaf: new THREE.MeshStandardMaterial({
        map: leafTex,
        side: THREE.DoubleSide,
        roughness: 0.45,
        metalness: 0.02,
        color: 0xffffff,
        bumpMap: leafTex,
        bumpScale: 0.03,
      }),
      stem: new THREE.MeshStandardMaterial({
        roughness: 0.72,
        metalness: 0.02,
        color: 0x426e24,
      }),
    };

    this.addStarField(random);
    this.addGalaxyDisk(random, isCompact);
    this.addSun(random);
    this.addFlowerPlanets(random, isCompact);
    this.addOrbitalRings();
    this.addOrbitingPhrases(isCompact);
    this.resize();
    addEventListener("resize", this.resize);
    canvas.addEventListener("pointerdown", this.handleCanvasPointerDown, { passive: true });
    canvas.addEventListener("pointermove", this.handleCanvasPointerMove, { passive: true });
    canvas.addEventListener("pointerup", this.handleCanvasPointerUp, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.animate();
  }

  private addStarField(random: () => number) {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorGold = new THREE.Color(0xffe3aa);
    const colorDiamond = new THREE.Color(0xffffff);
    const colorCyan = new THREE.Color(0xcbeeff);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 34;
      positions[i * 3 + 1] = (random() - 0.5) * 28;
      positions[i * 3 + 2] = -1.5 - random() * 12;

      const pick = random();
      const col = pick < 0.55 ? colorGold : (pick < 0.88 ? colorDiamond : colorCyan);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.042,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.scene.add(new THREE.Points(geometry, material));
  }

  private addGalaxyDisk(random: () => number, isCompact: boolean) {
    const count = isCompact ? 5200 : 8800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const warm = new THREE.Color(0xffa825);
    const gold = new THREE.Color(0xffd76e);
    const bright = new THREE.Color(0xfffae0);
    const diamond = new THREE.Color(0xffffff);

    for (let i = 0; i < count; i += 1) {
      const isCore = random() < 0.22;
      let x = 0;
      let y = 0;
      let z = 0;
      let color = warm;

      if (isCore) {
        // Vórtice central del que nace y brota la figura 3D hacia arriba
        const radius = Math.pow(random(), 1.35) * 1.55;
        const angle = random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = Math.pow(Math.max(0, 1 - radius / 1.55), 1.6) * (0.85 * random()) + (random() - 0.5) * 0.08;
        color = gold.clone().lerp(diamond, random() * 0.7);
      } else {
        // 4 brazos espirales densos y luminosos
        const arm = i % 4;
        const radius = 0.95 + Math.pow(random(), 0.62) * 6.8;
        const angle = radius * 1.32 + arm * Math.PI * 0.5 + (random() - 0.5) * (0.32 + radius * 0.04);
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = (random() - 0.5) * (0.07 + radius * 0.028);
        const grad = Math.max(0, 1 - radius / 7.5);
        color = warm.clone().lerp(bright, grad * 0.75 + random() * 0.25);
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      seeds[i] = random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: this.material.uniforms.uTime,
        uPixelRatio: { value: Math.min(devicePixelRatio, 1.75) },
      },
      vertexShader: `
        attribute vec3 color;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // Centelleo armónico que incrementa el destello estelar
          float twinkle = sin(uTime * 2.8 + aSeed * 45.0);
          gl_PointSize = (1.9 + aSeed * 2.5 + twinkle * 0.8) * uPixelRatio * (8.0 / -mv.z);
          // Luminiscencia aumentada un ~28% con destellos vivos
          vAlpha = 0.68 + 0.26 * twinkle;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.02, d);
          vec3 col = mix(vColor, vec3(1.0, 0.98, 0.92), glow * 0.50);
          gl_FragColor = vec4(col, glow * vAlpha * 0.95);
        }
      `,
    });

    const disk = new THREE.Points(geometry, material);
    this.galaxyDisk.add(disk);
    // Base horizontal plana centrada en el eje vertical
    this.galaxyDisk.position.set(0, -1.65, 0);
    this.galaxyDisk.rotation.set(0, 0, 0);
    this.scene.add(this.galaxyDisk);
  }

  private addSun(random: () => number) {
    const coreMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: this.material.uniforms.uTime },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fresnel = pow(1.0 - abs(vNormal.z), 2.2);
          float textureWave = sin(vPosition.x * 18.0 + uTime * 2.2) * sin(vPosition.y * 21.0 - uTime * 1.7);
          vec3 inner = vec3(1.0, 0.93, 0.48);
          vec3 edge = vec3(1.0, 0.28, 0.025);
          vec3 color = mix(inner, edge, fresnel) + textureWave * 0.055;
          gl_FragColor = vec4(color, 0.96 - fresnel * 0.12);
        }
      `,
    });
    this.sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), coreMaterial);
    this.sunCore.position.set(0, 0.15, 0);
    this.sculpture.add(this.sunCore);

    const coronaCount = 800;
    const positions = new Float32Array(coronaCount * 3);
    for (let i = 0; i < coronaCount; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const radius = 0.3 + Math.pow(random(), 2.8) * 0.62;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius;
    }
    const coronaGeometry = new THREE.BufferGeometry();
    coronaGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.sunCorona = new THREE.Points(
      coronaGeometry,
      new THREE.PointsMaterial({ color: 0xff9c32, size: 0.028, transparent: true, opacity: 0.46, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    this.sunCorona.position.set(0, 0.15, 0);
    this.sculpture.add(this.sunCorona);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xff8b22, transparent: true, opacity: 0.035, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    halo.position.copy(this.sunCore.position);
    this.sculpture.add(halo);
  }

  private createPetalGeometry(width: number, length: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.46, length * 0.28, width * 0.54, length * 0.72, 0, length);
    shape.bezierCurveTo(-width * 0.54, length * 0.72, -width * 0.46, length * 0.28, 0, 0);

    const geom = new THREE.ShapeGeometry(shape, 14);
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const progress = Math.max(0, Math.min(1, y / length));
      const z = Math.sin(progress * Math.PI) * (length * 0.15) - Math.pow(x / (width * 0.55), 2) * (length * 0.05);
      pos.setZ(i, z);
      uv.setXY(i, (x / width) * 0.85 + 0.5, progress);
    }
    geom.computeVertexNormals();
    return geom;
  }

  private createLeafGeometry(width: number, length: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * 0.62, length * 0.32, width * 0.5, length * 0.78, 0, length);
    shape.bezierCurveTo(-width * 0.5, length * 0.78, -width * 0.62, length * 0.32, 0, 0);

    const geom = new THREE.ShapeGeometry(shape, 14);
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;

    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const progress = Math.max(0, Math.min(1, y / length));
      const z = -Math.abs(x) * 0.14 + Math.sin(progress * Math.PI) * (length * 0.08);
      pos.setZ(i, z);
      uv.setXY(i, (x / width) * 0.88 + 0.5, progress);
    }
    geom.computeVertexNormals();
    return geom;
  }

  private buildFlowerHead(
    petalCount: number,
    petalLength: number,
    petalWidth: number,
    centerRadius: number,
    layers = 1
  ): THREE.Group {
    const head = new THREE.Group();

    // Centro con textura botánica
    const center = new THREE.Mesh(
      new THREE.CylinderGeometry(centerRadius, centerRadius * 0.92, 0.08, 20),
      this.flowerMaterials.center
    );
    center.rotation.x = Math.PI / 2;
    head.add(center);

    // Cáliz verde posterior que sostiene la flor y del que nacen las hojas
    const calyx = new THREE.Mesh(
      new THREE.CylinderGeometry(centerRadius * 0.92, centerRadius * 0.65, 0.09, 18),
      this.flowerMaterials.stem
    );
    calyx.position.z = -0.055;
    calyx.rotation.x = Math.PI / 2;
    head.add(calyx);

    // Corona de pétalos tupida, densa y sin espacios (base insertada dentro del centro)
    for (let layer = 0; layer < layers; layer += 1) {
      const count = petalCount - layer * 3;
      const len = petalLength * (1 - layer * 0.12);
      const wid = petalWidth * (1 - layer * 0.08);
      const zOffset = (layer + 1) * 0.024 - 0.015;
      const layerAngleOffset = (layer * Math.PI) / count;
      const petalGeom = this.createPetalGeometry(wid, len);

      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * Math.PI * 2 + layerAngleOffset;
        const petal = new THREE.Mesh(petalGeom, this.flowerMaterials.petal);
        // Base insertada adentro del disco central para no dejar huecos
        const dist = centerRadius * 0.58;
        petal.position.set(
          Math.cos(angle) * dist,
          Math.sin(angle) * dist,
          zOffset
        );
        petal.rotation.z = angle - Math.PI / 2;
        petal.rotation.x = 0.16 * Math.sin(angle * 3) + layer * 0.09;
        head.add(petal);
      }
    }

    return head;
  }

  private createLeafMesh(width: number, length: number): THREE.Mesh {
    const geom = this.createLeafGeometry(width, length);
    const leaf = new THREE.Mesh(geom, this.flowerMaterials.leaf);
    return leaf;
  }

  private attachLeavesToHead(
    head: THREE.Group,
    leafCount: number,
    leafLength: number,
    leafWidth: number,
    centerRadius: number,
    angleOffset = 0
  ) {
    for (let i = 0; i < leafCount; i += 1) {
      const angle = angleOffset + (i / leafCount) * Math.PI * 2;
      const leaf = this.createLeafMesh(leafWidth, leafLength);
      // Nace directamente del centro y cáliz trasero de la flor
      const rootDist = centerRadius * 0.32;
      leaf.position.set(
        Math.cos(angle) * rootDist,
        Math.sin(angle) * rootDist,
        -0.065
      );
      leaf.rotation.z = angle - Math.PI / 2;
      leaf.rotation.x = 0.22;
      head.add(leaf);
    }
  }

  private createStemBranch(from: THREE.Vector3, to: THREE.Vector3, radius = 0.03): THREE.Mesh {
    const dir = new THREE.Vector3().subVectors(to, from);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

    const geom = new THREE.CylinderGeometry(radius * 0.9, radius * 1.05, len, 8);
    const mesh = new THREE.Mesh(geom, this.flowerMaterials.stem);
    mesh.position.copy(mid);

    const yAxis = new THREE.Vector3(0, 1, 0);
    mesh.quaternion.setFromUnitVectors(yAxis, dir.normalize());
    return mesh;
  }

  private makeFlowerPlanet(scale: number, archetype: number, messageIndex: number) {
    const group = new THREE.Group();

    switch (archetype % 5) {
      case 0: {
        // Tipo 0: Girasol Estelar (flor densa con 24 pétalos y 3 hojas que nacen del cáliz)
        const flower = this.buildFlowerHead(24, 0.72, 0.32, 0.3, 2);
        this.attachLeavesToHead(flower, 3, 0.75, 0.35, 0.3, 0.3);
        group.add(flower);
        break;
      }
      case 1: {
        // Tipo 1: Pareja de 2 flores - Un solo tallo principal que se bifurca en Y hacia cada cáliz
        const f1Pos = new THREE.Vector3(-0.35, 0.35, 0);
        const f2Pos = new THREE.Vector3(0.35, 0.18, 0.02);

        // Flores limpias sin hojas en el centro
        const flower1 = this.buildFlowerHead(22, 0.58, 0.28, 0.24, 2);
        flower1.position.copy(f1Pos);
        flower1.rotation.z = -0.15;
        group.add(flower1);

        const flower2 = this.buildFlowerHead(18, 0.44, 0.23, 0.18, 1);
        flower2.position.copy(f2Pos);
        flower2.rotation.z = 0.25;
        group.add(flower2);

        // Tallo principal en la base y nudo de ramificación
        const stemBase = new THREE.Vector3(0, -0.65, -0.05);
        const node = new THREE.Vector3(0, -0.14, -0.05);
        const mainStem = this.createStemBranch(stemBase, node, 0.038);
        group.add(mainStem);

        // Nudo botánico de bifurcación
        const nodeKnot = new THREE.Mesh(
          new THREE.SphereGeometry(0.046, 8, 8),
          this.flowerMaterials.stem
        );
        nodeKnot.position.copy(node);
        group.add(nodeKnot);

        // Ramas directas que conectan el nudo con el cáliz exacto de cada flor
        const calyx1 = new THREE.Vector3(f1Pos.x, f1Pos.y, -0.055);
        const branch1 = this.createStemBranch(node, calyx1, 0.03);
        group.add(branch1);

        const calyx2 = new THREE.Vector3(f2Pos.x, f2Pos.y, -0.035);
        const branch2 = this.createStemBranch(node, calyx2, 0.026);
        group.add(branch2);

        // Las hojas nacen del TALLO, no del centro de la flor
        const leaf1 = this.createLeafMesh(0.24, 0.54);
        leaf1.position.set(-0.14, 0.06, -0.05);
        leaf1.rotation.z = 1.0;
        leaf1.rotation.x = 0.2;
        group.add(leaf1);

        const leaf2 = this.createLeafMesh(0.24, 0.52);
        leaf2.position.set(0, -0.38, -0.05);
        leaf2.rotation.z = -0.95;
        leaf2.rotation.x = 0.2;
        group.add(leaf2);
        break;
      }
      case 2: {
        // Tipo 2: Ramo de 3 flores - Un solo tallo principal con tridente conectado a cada cáliz
        const f1Pos = new THREE.Vector3(0, 0.46, 0.03);
        const f2Pos = new THREE.Vector3(-0.42, 0.22, -0.02);
        const f3Pos = new THREE.Vector3(0.42, 0.22, -0.02);

        // Flores limpias sin hojas en el centro
        const f1 = this.buildFlowerHead(18, 0.48, 0.24, 0.2, 1);
        f1.position.copy(f1Pos);
        group.add(f1);

        const f2 = this.buildFlowerHead(16, 0.42, 0.22, 0.17, 1);
        f2.position.copy(f2Pos);
        f2.rotation.z = -0.28;
        group.add(f2);

        const f3 = this.buildFlowerHead(16, 0.42, 0.22, 0.17, 1);
        f3.position.copy(f3Pos);
        f3.rotation.z = 0.28;
        group.add(f3);

        // Tallo principal en la base y nudo central de ramificación
        const stemBase = new THREE.Vector3(0, -0.7, -0.05);
        const node = new THREE.Vector3(0, -0.12, -0.05);
        const mainStem = this.createStemBranch(stemBase, node, 0.042);
        group.add(mainStem);

        // Nudo botánico de ramificación
        const nodeKnot = new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          this.flowerMaterials.stem
        );
        nodeKnot.position.copy(node);
        group.add(nodeKnot);

        // 3 ramas precisas que conectan el nudo directamente con cada cáliz
        const calyx1 = new THREE.Vector3(f1Pos.x, f1Pos.y, -0.025);
        const branch1 = this.createStemBranch(node, calyx1, 0.032);
        group.add(branch1);

        const calyx2 = new THREE.Vector3(f2Pos.x, f2Pos.y, -0.075);
        const branch2 = this.createStemBranch(node, calyx2, 0.028);
        group.add(branch2);

        const calyx3 = new THREE.Vector3(f3Pos.x, f3Pos.y, -0.075);
        const branch3 = this.createStemBranch(node, calyx3, 0.028);
        group.add(branch3);

        // Hojas que nacen del TALLO verde enmarcando el ramo
        const leafL = this.createLeafMesh(0.25, 0.56);
        leafL.position.set(-0.03, -0.12, -0.05);
        leafL.rotation.z = 1.15;
        leafL.rotation.x = 0.22;
        group.add(leafL);

        const leafR = this.createLeafMesh(0.25, 0.56);
        leafR.position.set(0.03, -0.12, -0.05);
        leafR.rotation.z = -1.15;
        leafR.rotation.x = 0.22;
        group.add(leafR);

        const leafBottom = this.createLeafMesh(0.22, 0.48);
        leafBottom.position.set(0, -0.42, -0.05);
        leafBottom.rotation.z = 0.85;
        leafBottom.rotation.x = 0.18;
        group.add(leafBottom);
        break;
      }
      case 3: {
        // Tipo 3: Flor con cáliz y 4 hojas en cruz naciendo del centro
        const flower = this.buildFlowerHead(22, 0.66, 0.3, 0.26, 2);
        this.attachLeavesToHead(flower, 4, 0.72, 0.34, 0.26, Math.PI / 4);
        group.add(flower);
        break;
      }
      case 4:
      default: {
        // Tipo 4: Dalia / Rosa multicapa (ultradensa: 26 pétalos capa 1, 22 capa 2, 16 capa 3)
        const flower = this.buildFlowerHead(26, 0.64, 0.3, 0.22, 3);
        this.attachLeavesToHead(flower, 3, 0.68, 0.32, 0.22, 0.5);
        group.add(flower);
        break;
      }
    }

    const hitArea = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffcf68, transparent: true, opacity: 0.001, depthWrite: false })
    );
    hitArea.userData.messageIndex = messageIndex;
    group.add(hitArea);
    this.flowerTargets.push(hitArea);

    group.scale.setScalar(scale);
    return group;
  }

  private addFlowerPlanets(random: () => number, _isCompact: boolean) {
    // 4 Niveles Orbitales Escalonados para una distribución planetaria armónica y sin solapamientos
    const orbitTiers = [
      { radius: 2.55, baseY: -0.62, tiltX: 0.07, tiltZ: 0.035, speed: 0.070, flowerIndices: [0, 1] },
      { radius: 3.15, baseY: -0.54, tiltX: -0.05, tiltZ: -0.045, speed: 0.056, flowerIndices: [2, 3] },
      { radius: 3.75, baseY: -0.46, tiltX: 0.06, tiltZ: -0.035, speed: 0.046, flowerIndices: [4, 5] },
      { radius: 4.35, baseY: -0.38, tiltX: -0.04, tiltZ: 0.055, speed: 0.038, flowerIndices: [6] },
    ];

    orbitTiers.forEach((orbit, tierIndex) => {
      const orbitPlane = new THREE.Group();
      orbitPlane.position.y = orbit.baseY;
      orbitPlane.rotation.x = orbit.tiltX;
      orbitPlane.rotation.z = orbit.tiltZ;
      this.scene.add(orbitPlane);

      const numInTier = orbit.flowerIndices.length;
      orbit.flowerIndices.forEach((msgIndex, slot) => {
        const pivot = new THREE.Group();
        const flowerPlanet = this.makeFlowerPlanet(0.35 + (msgIndex % 3) * 0.04, msgIndex, msgIndex);
        flowerPlanet.position.set(orbit.radius, 0, 0);

        pivot.add(flowerPlanet);
        orbitPlane.add(pivot);

        // Fases equidistantes para que las flores de una misma órbita jamás colisionen ni se solapen
        const phaseBase = (slot / numInTier) * Math.PI * 2;
        const tierOffset = tierIndex * 0.65;
        const phase = phaseBase + tierOffset + (random() - 0.5) * 0.06;

        this.orbiters.push({ pivot, flower: flowerPlanet, speed: orbit.speed, phase });
      });
    });
  }

  private makePhraseTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 160;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let size = 84;
      const font = (px: number) => `italic 500 ${px}px "Cormorant Garamond", Georgia, serif`;
      ctx.font = font(size);
      while (ctx.measureText(text).width > 960 && size > 30) {
        size -= 4;
        ctx.font = font(size);
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(255, 170, 60, 0.95)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#fff1c7";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      texture.needsUpdate = true;
    };
    draw();
    // Al cargar la tipografía se vuelve a dibujar para que use Cormorant Garamond
    document.fonts?.load(`italic 500 60px "Cormorant Garamond"`).then(draw).catch(() => {});
    return texture;
  }

  private addOrbitingPhrases(isCompact: boolean) {
    if (!this.phrases.length) return;
    const rings = [
      { radius: 5.5, y: 0.35, tiltX: 0.2, tiltZ: -0.08, speed: 0.05 },
      { radius: 6.6, y: -0.15, tiltX: -0.16, tiltZ: 0.1, speed: -0.037 },
    ];
    const width = isCompact ? 2.3 : 2.9;
    this.phrases.forEach((text, i) => {
      const ringIndex = i % rings.length;
      let ring = this.phraseRings[ringIndex];
      const def = rings[ringIndex];
      if (!ring) {
        const tilt = new THREE.Group();
        tilt.position.y = def.y;
        tilt.rotation.set(def.tiltX, 0, def.tiltZ);
        const group = new THREE.Group();
        tilt.add(group);
        this.scene.add(tilt);
        ring = { group, speed: def.speed };
        this.phraseRings[ringIndex] = ring;
      }
      const perRing = Math.ceil(this.phrases.length / rings.length);
      const slot = Math.floor(i / rings.length);
      const angle = (slot / perRing) * Math.PI * 2 + ringIndex * 0.5;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.makePhraseTexture(text), transparent: true, depthWrite: false, opacity: 0.92 }),
      );
      sprite.scale.set(width, width * (160 / 1024), 1);
      sprite.position.set(Math.cos(angle) * def.radius, Math.sin(angle * 3 + i) * 0.18, Math.sin(angle) * def.radius);
      ring.group.add(sprite);
      this.phraseSprites.push(sprite);
    });
  }

  private addOrbitalRings() {
    const orbitTiers = [
      { radius: 2.55, baseY: -0.62, tiltX: 0.07, tiltZ: 0.035 },
      { radius: 3.15, baseY: -0.54, tiltX: -0.05, tiltZ: -0.045 },
      { radius: 3.75, baseY: -0.46, tiltX: 0.06, tiltZ: -0.035 },
      { radius: 4.35, baseY: -0.38, tiltX: -0.04, tiltZ: 0.055 },
    ];

    orbitTiers.forEach((orbit, index) => {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 240; i += 1) {
        const angle = (i / 240) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: index % 2 === 1 ? 0xffd175 : 0xcfa451,
        transparent: true,
        opacity: index === 1 ? 0.30 : 0.20,
      });
      const line = new THREE.LineLoop(geometry, material);
      line.position.y = orbit.baseY;
      line.rotation.x = orbit.tiltX;
      line.rotation.z = orbit.tiltZ;
      this.scene.add(line);
    });
  }

  nextShape() {
    if (this.transitioning) return;
    const next = (this.currentShape + 1) % this.shapes.length;
    const geometry = this.particles.geometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(this.shapes[this.currentShape].positions.slice(), 3));
    geometry.setAttribute("aTarget", new THREE.BufferAttribute(this.shapes[next].positions.slice(), 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(this.shapes[this.currentShape].colors.slice(), 3));
    geometry.setAttribute("aTargetColor", new THREE.BufferAttribute(this.shapes[next].colors.slice(), 3));
    this.material.uniforms.uProgress.value = 0;
    this.transitionStart = this.clock.elapsedTime;
    this.transitioning = true;
    this.currentShape = next;
    this.onShapeChange?.(next);
  }

  private resize = () => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(height, 1);
    if (!this.interactive) {
      const isMobile = width < 520;
      this.camera.position.set(0, isMobile ? 2.6 : 2.2, isMobile ? 9.8 : 8.6);
    }
    this.camera.updateProjectionMatrix();
  };

  private setRayFromPointer(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
  }

  private handleCanvasPointerDown = (event: PointerEvent) => {
    this.pointerDown.set(event.clientX, event.clientY);
    if (this.interactive) this.canvas.classList.add("is-navigating");
  };

  private handleCanvasPointerMove = (event: PointerEvent) => {
    if (!this.interactive || event.pointerType === "touch") return;
    this.setRayFromPointer(event);
    const flowerHit = this.raycaster.intersectObjects(this.flowerTargets, false)[0];
    const centerHit = !flowerHit && this.centerTarget ? this.raycaster.intersectObject(this.centerTarget, false)[0] : null;
    this.canvas.classList.toggle("flower-hover", Boolean(flowerHit || centerHit));
  };

  private handleCanvasPointerUp = (event: PointerEvent) => {
    this.canvas.classList.remove("is-navigating");
    if (!this.interactive || this.pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 8) return;
    this.setRayFromPointer(event);

    const flowerHit = this.raycaster.intersectObjects(this.flowerTargets, false)[0];
    const messageIndex = flowerHit?.object.userData.messageIndex;
    if (typeof messageIndex === "number") {
      this.onFlowerClick?.(messageIndex);
      return;
    }

    if (this.centerTarget) {
      const centerHit = this.raycaster.intersectObject(this.centerTarget, false)[0];
      if (centerHit) {
        this.nextShape();
        this.onCenterClick?.();
        return;
      }
    }
  };

  setInteractive(enabled: boolean) {
    this.interactive = enabled;
    this.controls.enabled = enabled;
    this.canvas.classList.toggle("interactive", enabled);
  }

  startIntroAnimation() {
    this.introStart = this.clock.getElapsedTime();
    this.introProgress = 0;
  }

  resetCamera() {
    const isMobile = this.canvas.clientWidth < 520;
    this.camera.position.set(0, isMobile ? 2.6 : 2.2, isMobile ? 9.8 : 8.6);
    this.controls.target.set(0, -0.15, 0);
    this.controls.update();
  }

  private handleVisibility = () => {
    if (!document.hidden && !this.frame) this.animate();
  };

  private animate = () => {
    if (document.hidden) {
      this.frame = 0;
      return;
    }
    this.frame = requestAnimationFrame(this.animate);
    const elapsed = this.clock.getElapsedTime();
    this.material.uniforms.uTime.value = elapsed;

    // Transición cinemática de entrada hacia el universo al hacer clic
    if (this.introProgress >= 0 && this.introProgress < 1) {
      const isMobile = this.canvas.clientWidth < 520;
      const progress = Math.min((elapsed - this.introStart) / 1.8, 1);
      this.introProgress = progress;
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const startY = isMobile ? 3.0 : 2.6;
      const targetY = isMobile ? 2.6 : 2.2;
      const startZ = isMobile ? 11.8 : 10.6;
      const targetZ = isMobile ? 9.8 : 8.6;
      this.camera.position.y = THREE.MathUtils.lerp(startY, targetY, ease);
      this.camera.position.z = THREE.MathUtils.lerp(startZ, targetZ, ease);
      this.controls.target.set(0, -0.15, 0);
      this.controls.update();
      if (progress >= 1) {
        this.setInteractive(true);
      }
    }

    if (this.transitioning) {
      const duration = this.reducedMotion ? 0.25 : 2.4;
      const progress = Math.min((elapsed - this.transitionStart) / duration, 1);
      this.material.uniforms.uProgress.value = progress;
      if (progress >= 1) this.transitioning = false;
    }
    if (!this.reducedMotion) {
      this.sculpture.rotation.y = Math.sin(elapsed * 0.31) * 0.34;
      this.sculpture.rotation.x = Math.sin(elapsed * 0.23) * 0.1;
      this.galaxyDisk.rotation.y = elapsed * 0.055;
      for (const ring of this.phraseRings) ring.group.rotation.y = elapsed * ring.speed;
      for (const sprite of this.phraseSprites) {
        // Las frases que pasan muy cerca de la cámara se desvanecen para no tapar la escena
        sprite.getWorldPosition(this.tempVec);
        const near = THREE.MathUtils.smoothstep(this.tempVec.distanceTo(this.camera.position), 3.2, 6.2);
        sprite.material.opacity = 0.92 * near;
      }
      this.sunCorona.rotation.y = -elapsed * 0.42;
      this.sunCorona.rotation.z = elapsed * 0.24;
      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.06;
      this.sunCore.scale.setScalar(pulse);
      for (const orbiter of this.orbiters) {
        orbiter.pivot.rotation.y = orbiter.phase + elapsed * orbiter.speed;
        orbiter.pivot.updateMatrixWorld();

        orbiter.flower.getWorldPosition(this.tempVec);
        const dx = this.camera.position.x - this.tempVec.x;
        const dz = this.camera.position.z - this.tempVec.z;
        const targetAngleWorld = Math.atan2(dx, dz);

        // Compensamos la rotación del pivote para que la cara frontal (+Z) mire siempre a la cámara
        const localYaw = targetAngleWorld - orbiter.pivot.rotation.y;

        // Balanceo natural de brisa (sway) botánico armónico:
        // 1. Suave oscilación en Y para destacar el volumen 3D y ramas sin perder la vista frontal
        const swayYaw = Math.sin(elapsed * 0.85 + orbiter.phase * 1.6) * 0.16;
        // 2. Leve cabeceo en X (rango restringido de ~2.8 grados, jamás se voltea hacia abajo)
        const swayPitch = Math.sin(elapsed * 1.1 + orbiter.phase * 2.1) * 0.05;
        // 3. Balanceo lateral en Z (rango restringido de ~3.4 grados, el tallo NUNCA queda arriba)
        const swayRoll = Math.sin(elapsed * 1.35 + orbiter.phase * 1.8) * 0.06;

        orbiter.flower.rotation.y = localYaw + swayYaw;
        orbiter.flower.rotation.x = swayPitch;
        orbiter.flower.rotation.z = swayRoll;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    if (this.onFlowerPositionsUpdate && this.orbiters.length > 0) {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      const positions: FlowerPositionInfo[] = [];
      this.camera.getWorldDirection(this.cameraDir);

      for (let i = 0; i < this.orbiters.length; i += 1) {
        const orbiter = this.orbiters[i];
        orbiter.flower.getWorldPosition(this.tempVec);

        this.toFlower.copy(this.tempVec).sub(this.camera.position);
        const dot = this.toFlower.dot(this.cameraDir);
        const dist = this.toFlower.length();

        // Oclusión geométrica por la escultura 3D central que se transforma
        this.rayToFlower.copy(this.toFlower).multiplyScalar(1 / dist);
        this.camToSculpture.copy(this.sculptureCenter).sub(this.camera.position);
        const t = this.camToSculpture.dot(this.rayToFlower);

        let sculptureOcclusion = 1.0;
        // Si el centro de la escultura está entre la cámara y la flor (la flor está detrás de la escultura)
        if (t > 0 && t < dist) {
          this.closestPointOnRay.copy(this.camera.position).addScaledVector(this.rayToFlower, t);
          const rayDistToSculpture = this.closestPointOnRay.distanceTo(this.sculptureCenter);

          // Radio de la escultura: núcleo denso < 1.25, borde difuso hasta 1.85
          if (rayDistToSculpture < 1.22) {
            sculptureOcclusion = 0.0;
          } else if (rayDistToSculpture < 1.85) {
            sculptureOcclusion = THREE.MathUtils.smoothstep(rayDistToSculpture, 1.22, 1.85);
          }
        }

        // Elevamos ligeramente sobre la flor
        this.tempVec.y += 0.38;
        this.tempVec.project(this.camera);

        const inFrustum =
          dot > 0.1 &&
          this.tempVec.z < 1.0 &&
          this.tempVec.x >= -1.15 &&
          this.tempVec.x <= 1.15 &&
          this.tempVec.y >= -1.15 &&
          this.tempVec.y <= 1.15;

        // Profundidad atmosférica (dist oscila entre ~3.8 y ~11.5)
        const depthNorm = THREE.MathUtils.clamp((dist - 3.8) / 7.5, 0, 1);
        const scale = THREE.MathUtils.lerp(1.06, 0.68, depthNorm);
        const baseOpacity = THREE.MathUtils.lerp(0.96, 0.38, depthNorm);
        const finalOpacity = baseOpacity * sculptureOcclusion;

        const isVisible = inFrustum && finalOpacity > 0.04;

        const screenX = ((this.tempVec.x + 1) * 0.5) * width;
        const screenY = ((-this.tempVec.y + 1) * 0.5) * height;
        const zIndex = Math.round(200 - depthNorm * 150);

        positions.push({
          index: i,
          x: screenX,
          y: screenY,
          visible: isVisible,
          scale,
          opacity: finalOpacity,
          zIndex,
        });
      }
      this.onFlowerPositionsUpdate(positions);
    }
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.canvas.removeEventListener("pointermove", this.handleCanvasPointerMove);
    this.canvas.removeEventListener("pointerup", this.handleCanvasPointerUp);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.controls.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      }
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    if (this.flowerMaterials) {
      this.flowerMaterials.center.map?.dispose();
      this.flowerMaterials.petal.map?.dispose();
      this.flowerMaterials.leaf.map?.dispose();
      this.flowerMaterials.center.dispose();
      this.flowerMaterials.petal.dispose();
      this.flowerMaterials.leaf.dispose();
      this.flowerMaterials.stem.dispose();
    }
    this.renderer.dispose();
  }
}
