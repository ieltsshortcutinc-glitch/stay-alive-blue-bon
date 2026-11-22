function setupBon3DRenderer() {
  if (!window.THREE || !window.createBon3D) {
    console.warn("3D Bon is not ready yet.");
    return null;
  }

  const THREE = window.THREE;

  // Create the 3D scene
  const scene = new THREE.Scene();

  // Create the camera
  const camera = new THREE.PerspectiveCamera(
    45, 1, 0.1, 100
  );

  camera.position.set(0, 2.5, 8);
  camera.lookAt(0, 2, 0);

  // Create lighting
  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambient);

  const spotlight = new THREE.DirectionalLight(
    0x88bbff, 2
  );
  spotlight.position.set(3, 8, 5);
  scene.add(spotlight);

  // Create the renderer
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(400, 400);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
  );

  // Create Bon
  const bon = window.createBon3D(THREE);
  scene.add(bon);

  function animate(time) {
    bon.userData.animate(time / 1000, true);
    renderer.render(scene, camera);
  }

  return {
    scene,
    camera,
    renderer,
    bon,
    animate
  };
}

window.setupBon3DRenderer = setupBon3DRenderer;
