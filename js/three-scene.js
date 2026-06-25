let scene, camera, renderer;
let particles, particleLines;
let heroShape;
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let animationId;

const THEMES = {
  cyan: { primary: 0x00f0ff, secondary: 0xb829dd, tertiary: 0xff2a6d },
  purple: { primary: 0xb829dd, secondary: 0x00f0ff, tertiary: 0xff2a6d },
  pink: { primary: 0xff2a6d, secondary: 0x00f0ff, tertiary: 0xb829dd },
  green: { primary: 0x05ffa1, secondary: 0x00f0ff, tertiary: 0xb829dd }
};

let currentTheme = 'cyan';

function initThreeScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050508, 0.0015);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 500;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  createParticles();
  createHeroShape();
  createStars();

  document.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  animate();
}

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const theme = THEMES[currentTheme];
  const c1 = new THREE.Color(theme.primary);
  const c2 = new THREE.Color(theme.secondary);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;

    const color = Math.random() > 0.5 ? c1 : c2;
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function createHeroShape() {
  const theme = THEMES[currentTheme];

  const geometry = new THREE.IcosahedronGeometry(80, 1);
  const wireframe = new THREE.WireframeGeometry(geometry);

  const material = new THREE.LineBasicMaterial({
    color: theme.primary,
    transparent: true,
    opacity: 0.6
  });

  heroShape = new THREE.LineSegments(wireframe, material);
  heroShape.position.set(0, 0, -200);
  heroShape.visible = false;
  scene.add(heroShape);

  const innerGeometry = new THREE.IcosahedronGeometry(60, 0);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: theme.secondary,
    transparent: true,
    opacity: 0.08,
    wireframe: false
  });
  const innerShape = new THREE.Mesh(innerGeometry, innerMaterial);
  heroShape.add(innerShape);
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const count = 3000;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3000;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    transparent: true,
    opacity: 0.4
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
  targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  if (particles) {
    particles.rotation.x += 0.0003;
    particles.rotation.y += 0.0005;
    particles.rotation.x += mouseY * 0.0005;
    particles.rotation.y += mouseX * 0.0005;
  }

  if (heroShape) {
    heroShape.rotation.x += 0.003;
    heroShape.rotation.y += 0.005;
    heroShape.rotation.x += mouseY * 0.01;
    heroShape.rotation.y += mouseX * 0.01;
  }

  camera.position.x += (mouseX * 30 - camera.position.x) * 0.02;
  camera.position.y += (mouseY * 30 - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
}

function setHeroShapeVisible(visible) {
  if (heroShape) heroShape.visible = visible;
}

function updateThemeColor(themeName) {
  if (!THEMES[themeName]) return;
  currentTheme = themeName;

  const theme = THEMES[themeName];
  const root = document.documentElement;
  const primaryHex = '#' + theme.primary.toString(16).padStart(6, '0');
  root.style.setProperty('--primary', primaryHex);
  root.style.setProperty('--cyan', primaryHex);

  if (heroShape) {
    heroShape.material.color.setHex(theme.primary);
    heroShape.children[0].material.color.setHex(theme.secondary);
  }

  if (particles) {
    const colors = particles.geometry.attributes.color.array;
    const c1 = new THREE.Color(theme.primary);
    const c2 = new THREE.Color(theme.secondary);

    for (let i = 0; i < colors.length / 3; i++) {
      const color = Math.random() > 0.5 ? c1 : c2;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    particles.geometry.attributes.color.needsUpdate = true;
  }
}

window.initThreeScene = initThreeScene;
window.setHeroShapeVisible = setHeroShapeVisible;
window.updateThemeColor = updateThemeColor;
