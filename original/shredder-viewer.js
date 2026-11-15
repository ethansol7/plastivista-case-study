const stage = document.querySelector("[data-shredder-viewer]");

if (stage) {
  const status = stage.querySelector("[data-model-status]");
  let started = false;

  const start = () => {
    if (started) return;
    started = true;
    buildViewer(stage, status);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px", threshold: 0.01 },
    );
    observer.observe(stage);
  } else {
    start();
  }
}

async function buildViewer(mount, status) {
  try {
    const [
      THREE,
      { GLTFLoader },
      { OrbitControls },
      { MeshoptDecoder },
    ] = await Promise.all([
      import("three"),
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/controls/OrbitControls.js"),
      import("three/addons/libs/meshopt_decoder.module.js"),
    ]);

    const modelSrc = mount.dataset.modelSrc;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.enablePan = false;
    controls.minDistance = 1.15;
    controls.maxDistance = 4.2;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aac9c, 1.3));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(2.7, 3.6, 2.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xddebdc, 1.7);
    fillLight.position.set(-3.2, 1.4, -2.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    rimLight.position.set(-1.4, 2.6, 3.4);
    scene.add(rimLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 96),
      new THREE.ShadowMaterial({ color: 0x193d2b, opacity: 0.13 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(320, Math.floor(rect.height));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (resizeObserver) resizeObserver.observe(mount);
    window.addEventListener("resize", resize, { passive: true });

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    if (status) status.textContent = "Loading 3D shredder model";

    loader.load(
      modelSrc,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 1.82 / maxDimension;

        model.position.sub(center);
        model.scale.setScalar(scale);
        model.rotation.y = -0.38;

        model.traverse((object) => {
          if (!object.isMesh) return;
          object.castShadow = true;
          object.receiveShadow = true;
          if (object.material) {
            object.material.envMapIntensity = 0.85;
          }
        });

        ground.position.y = -(size.y * scale) / 2 - 0.025;
        scene.add(model);

        camera.position.set(1.35, 1.08, 2.55);
        controls.target.set(0, -0.02, 0);
        controls.update();

        mount.classList.add("is-loaded");
        if (status) status.textContent = "Drag to orbit the shredder model";
      },
      (event) => {
        if (!status || !event.total) return;
        const progress = Math.min(99, Math.round((event.loaded / event.total) * 100));
        status.textContent = `Loading 3D shredder model ${progress}%`;
      },
      () => {
        if (status) status.textContent = "3D model could not load";
      },
    );

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
  } catch (error) {
    if (status) status.textContent = "3D viewer could not start";
  }
}
