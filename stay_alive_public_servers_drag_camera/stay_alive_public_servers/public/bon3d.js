
function createBon3D(THREE) {
  const bon = new THREE.Group();

  const blue = new THREE.MeshStandardMaterial({ color: 0x2468bb, roughness: 0.55 });
  const lightBlue = new THREE.MeshStandardMaterial({ color: 0x64b5ed });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101827 });
  const eyes = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    emissive: 0xff0000,
    emissiveIntensity: 2
  });

  function part(parent, material, radius, position, scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 12),
      material
    );
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  // Body and belly
  part(bon, blue, 0.75, [0, 1.8, 0], [0.85, 1.2, 0.6]);
  part(bon, lightBlue, 0.5, [0, 1.8, 0.43], [0.85, 1.25, 0.3]);

  // Head
  const head = new THREE.Group();
  head.position.y = 2.9;
  bon.add(head);
  part(head, blue, 0.7, [0, 0, 0]);
  part(head, lightBlue, 0.4, [0, -0.2, 0.5], [1.2, 0.65, 0.7]);

  // Long ears
  part(head, blue, 0.35, [-0.38, 1.0, 0], [0.65, 2.1, 0.35]);
  part(head, blue, 0.35, [0.38, 1.0, 0], [0.65, 2.1, 0.35]);

  // Glowing eyes
  part(head, eyes, 0.16, [-0.25, 0.1, 0.61]);
  part(head, eyes, 0.16, [0.25, 0.1, 0.61]);
  part(head, dark, 0.18, [0, -0.24, 0.77]);

  // Arms and legs
  const limbs = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.75, 2.35, 0);
    bon.add(arm);
    part(arm, blue, 0.3, [0, -0.5, 0], [0.8, 1.9, 0.8]);
    limbs.push(arm);

    const leg = new THREE.Group();
    leg.position.set(side * 0.4, 1.2, 0);
    bon.add(leg);
    part(leg, blue, 0.35, [0, -0.55, 0], [0.9, 1.8, 0.9]);
    limbs.push(leg);
  }

  bon.userData.animate = function(time, running = true) {
    const swing = running ? Math.sin(time * 13) * 0.7 : 0;
    limbs[0].rotation.x = swing;
    limbs[1].rotation.x = -swing;
    limbs[2].rotation.x = -swing;
    limbs[3].rotation.x = swing;
    head.rotation.z = Math.sin(time * 4) * 0.04;
  };

  return bon;
}
