import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * OlympicArena3D
 * 
 * Volumetric WebGL 3D Olympic Stadium featuring:
 * - 2 Rigged Motion-Captured Athletic Sprinters (Sage Teal #10B981 & Warm Gold #F59E0B)
 *   running with biologically realistic human running gait along the outer Olympic oval track.
 * - 1 Rigged Soccer Striker (#34D399) executing an athletic run-up & strike inside the central pitch.
 * - Central Soccer Field with white field lines, center circle, and penalty area.
 * - 3D Soccer Goal placed inside the central pitch (zero collisions with runners).
 * - 3D Soccer Ball with classic pentagon leather texture shooting into the net + shockwave burst.
 * - True Olympic Tartan oval track with distance markers (START, 200M, 100M, 300M).
 */
export function OlympicArena3D({ className = '', style = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId;
    let isDisposed = false;
    const width = 900;
    const height = 640;

    // 1. Scene & Perspective Camera (Transparent background)
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    const initialCamPos = new THREE.Vector3(0, 9.2, 11.8);
    camera.position.copy(initialCamPos);
    camera.lookAt(0, -0.3, 0);

    // 2. WebGL Renderer with Alpha Transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // 3. Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff5ea, 1.7);
    mainLight.position.set(8, 16, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x81b29a, 0.85);
    fillLight.position.set(-10, 10, -8);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf2cc8f, 1.3, 20);
    rimLight.position.set(0, 3.5, -3.5);
    scene.add(rimLight);

    // Disposable tracking
    const disposables = [];
    const registerDisposable = (item) => {
      if (item && typeof item.dispose === 'function') {
        disposables.push(item);
      }
      return item;
    };

    // 4. Track & Pitch (True transparent background - no dark base disk)

    // 5. Olympic Tartan Track (Athletic Oval Surface)
    function createEllipseBand(innerA, innerB, outerA, outerB, color) {
      const shape = new THREE.Shape();
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2;
        const x = outerA * Math.cos(th);
        const y = outerB * Math.sin(th);
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      const hole = new THREE.Path();
      for (let i = 0; i <= segments; i++) {
        const th = (i / segments) * Math.PI * 2;
        const x = innerA * Math.cos(th);
        const y = innerB * Math.sin(th);
        if (i === 0) hole.moveTo(x, y);
        else hole.lineTo(x, y);
      }
      shape.holes.push(hole);

      const geo = registerDisposable(new THREE.ShapeGeometry(shape));
      const mat = registerDisposable(new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        side: THREE.DoubleSide
      }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.002;
      mesh.receiveShadow = true;
      return mesh;
    }

    const trackBand = createEllipseBand(3.2, 2.0, 5.5, 3.9, 0x121a20);
    scene.add(trackBand);

    // Track Lane Rings
    function createEllipseLine(a, b, color, opacity = 0.8) {
      const pts = [];
      for (let i = 0; i <= 128; i++) {
        const th = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(a * Math.cos(th), 0.005, b * Math.sin(th)));
      }
      const geo = registerDisposable(new THREE.BufferGeometry().setFromPoints(pts));
      const mat = registerDisposable(new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
      return new THREE.Line(geo, mat);
    }
    scene.add(createEllipseLine(5.4, 3.8, 0xffffff, 0.4)); // Lane 1 Outer
    scene.add(createEllipseLine(4.7, 3.2, 0x10b981, 0.85)); // Lane 2 (Runner 1 Green)
    scene.add(createEllipseLine(4.0, 2.6, 0xf59e0b, 0.85)); // Lane 3 (Runner 2 Gold)
    scene.add(createEllipseLine(3.3, 2.0, 0x81b29a, 0.5));  // Inner Border

    // Distance Ground Text
    function createGroundText(text, colorStr, fontSize = 34) {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 128;
      const ctx = cv.getContext('2d');
      ctx.font = 'bold ' + fontSize + 'px "Montserrat", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colorStr;
      ctx.letterSpacing = '3px';
      ctx.fillText(text, 128, 64);

      const texture = registerDisposable(new THREE.CanvasTexture(cv));
      const textMat = registerDisposable(new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
      const plane = new THREE.Mesh(registerDisposable(new THREE.PlaneGeometry(1.1, 0.55)), textMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = 0.008;
      return plane;
    }

    const startText = createGroundText('START', '#F2CC8F', 32);
    startText.position.set(0, 0.008, -3.5);
    scene.add(startText);

    const m200Text = createGroundText('200M', '#81B29A', 30);
    m200Text.position.set(0, 0.008, 3.5);
    scene.add(m200Text);

    // 6. Central Soccer Pitch (Sân bóng đá cỏ xanh)
    const pitchWidth = 4.2;
    const pitchHeight = 2.4;
    const soccerField = new THREE.Mesh(
      registerDisposable(new THREE.PlaneGeometry(pitchWidth, pitchHeight)),
      registerDisposable(new THREE.MeshStandardMaterial({ color: 0x091e18, roughness: 0.85 }))
    );
    soccerField.rotation.x = -Math.PI / 2;
    soccerField.position.y = 0.003;
    soccerField.receiveShadow = true;
    scene.add(soccerField);

    // Field Boundary Lines
    const fieldLines = new THREE.Group();
    fieldLines.position.y = 0.006;

    function createRectLine(w, h, color = 0x81b29a) {
      const pts = [
        new THREE.Vector3(-w/2, 0, -h/2),
        new THREE.Vector3(w/2, 0, -h/2),
        new THREE.Vector3(w/2, 0, h/2),
        new THREE.Vector3(-w/2, 0, h/2),
        new THREE.Vector3(-w/2, 0, -h/2),
      ];
      const geo = registerDisposable(new THREE.BufferGeometry().setFromPoints(pts));
      const mat = registerDisposable(new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.55 }));
      return new THREE.Line(geo, mat);
    }
    fieldLines.add(createRectLine(pitchWidth - 0.2, pitchHeight - 0.2));

    // Halfway line
    const halfLinePts = [new THREE.Vector3(0, 0, -(pitchHeight - 0.2)/2), new THREE.Vector3(0, 0, (pitchHeight - 0.2)/2)];
    fieldLines.add(new THREE.Line(
      registerDisposable(new THREE.BufferGeometry().setFromPoints(halfLinePts)),
      registerDisposable(new THREE.LineBasicMaterial({ color: 0x81b29a, transparent: true, opacity: 0.45 }))
    ));

    // Center Circle
    const centerCircle = new THREE.Line(
      registerDisposable(new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 65 }, (_, i) => {
          const a = (i / 64) * Math.PI * 2;
          return new THREE.Vector3(0.55 * Math.cos(a), 0, 0.55 * Math.sin(a));
        })
      )),
      registerDisposable(new THREE.LineBasicMaterial({ color: 0xf2cc8f, transparent: true, opacity: 0.65 }))
    );
    fieldLines.add(centerCircle);

    // Center Gold Dot
    const dot = new THREE.Mesh(
      registerDisposable(new THREE.CircleGeometry(0.08, 16)),
      registerDisposable(new THREE.MeshBasicMaterial({ color: 0xf2cc8f }))
    );
    dot.rotation.x = -Math.PI / 2;
    fieldLines.add(dot);

    // Penalty Box on Right
    const penaltyBoxPts = [
      new THREE.Vector3(pitchWidth/2 - 0.1, 0, -0.65),
      new THREE.Vector3(pitchWidth/2 - 0.85, 0, -0.65),
      new THREE.Vector3(pitchWidth/2 - 0.85, 0, 0.65),
      new THREE.Vector3(pitchWidth/2 - 0.1, 0, 0.65)
    ];
    fieldLines.add(new THREE.Line(
      registerDisposable(new THREE.BufferGeometry().setFromPoints(penaltyBoxPts)),
      registerDisposable(new THREE.LineBasicMaterial({ color: 0x81b29a, transparent: true, opacity: 0.55 }))
    ));
    scene.add(fieldLines);

    // 7. 3D Soccer Goal (placed safely inside the pitch at x = 1.7)
    const goal = new THREE.Group();
    goal.position.set(1.7, 0, 0);

    const postMat = registerDisposable(new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.85, roughness: 0.15 }));
    const p1 = new THREE.Mesh(registerDisposable(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 16)), postMat);
    p1.position.set(0, 0.475, -0.65);
    p1.castShadow = true;
    goal.add(p1);

    const p2 = new THREE.Mesh(registerDisposable(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 16)), postMat);
    p2.position.set(0, 0.475, 0.65);
    p2.castShadow = true;
    goal.add(p2);

    const bar = new THREE.Mesh(registerDisposable(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 16)), postMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.95, 0);
    bar.castShadow = true;
    goal.add(bar);

    const net = new THREE.Mesh(
      registerDisposable(new THREE.BoxGeometry(0.55, 0.93, 1.26, 4, 6, 8)),
      registerDisposable(new THREE.MeshBasicMaterial({ color: 0xcbd5e1, wireframe: true, transparent: true, opacity: 0.65 }))
    );
    net.position.set(0.275, 0.465, 0);
    goal.add(net);
    scene.add(goal);

    // 8. 3D Soccer Ball with Classic Pentagons
    function createSoccerTexture() {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 256;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#0F172A';
      function drawPentagon(cx, cy, r) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      drawPentagon(128, 64, 28);
      drawPentagon(384, 64, 28);
      drawPentagon(256, 128, 30);
      drawPentagon(128, 192, 28);
      drawPentagon(384, 192, 28);
      drawPentagon(0, 128, 28);
      drawPentagon(512, 128, 28);
      return registerDisposable(new THREE.CanvasTexture(cv));
    }

    const ball = new THREE.Mesh(
      registerDisposable(new THREE.SphereGeometry(0.14, 24, 24)),
      registerDisposable(new THREE.MeshStandardMaterial({ map: createSoccerTexture(), roughness: 0.25, metalness: 0.05 }))
    );
    ball.castShadow = true;
    scene.add(ball);

    // 9. Load Rigged Characters (/models/Xbot.glb)
    let runner1, runner2, striker;
    let mixer1, mixer2, strikerMixer;

    const loader = new GLTFLoader();

    fetch('/models/Xbot.glb')
      .then((res) => {
        if (!res.ok) throw new Error('GLB fetch failed');
        return res.arrayBuffer();
      })
      .then((arrayBuffer) => {
        if (isDisposed) return;

        function buildRunner(colorHex, scale = 0.95) {
          return new Promise((resolve) => {
            loader.parse(arrayBuffer.slice(0), '', (gltf) => {
              const model = gltf.scene;
              model.scale.set(scale, scale, scale);

              model.traverse((c) => {
                if (c.isMesh) {
                  c.castShadow = true;
                  c.material = c.material.clone();
                  c.material.skinning = true;
                  if (c.material.name.includes('Joints')) {
                    c.material.color.setHex(0x0f172a);
                    c.material.roughness = 0.4;
                  } else {
                    c.material.color.setHex(colorHex);
                    c.material.roughness = 0.3;
                  }
                }
              });

              // Soft contact shadow
              const shadow = new THREE.Mesh(
                registerDisposable(new THREE.CircleGeometry(0.32, 24)),
                registerDisposable(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }))
              );
              shadow.rotation.x = -Math.PI / 2;
              shadow.position.y = 0.01;
              model.add(shadow);

              const mixer = new THREE.AnimationMixer(model);
              const runClip = gltf.animations.find((a) => a.name === 'run');
              if (runClip) mixer.clipAction(runClip).play();
              resolve({ model, mixer });
            });
          });
        }

        Promise.all([
          buildRunner(0x10b981, 0.95), // Runner 1 (Sage Teal)
          buildRunner(0xf59e0b, 0.95), // Runner 2 (Warm Gold)
          buildRunner(0x34d399, 0.95)  // Striker (Emerald Green)
        ]).then(([r1, r2, strk]) => {
          if (isDisposed) return;
          runner1 = r1.model;
          mixer1 = r1.mixer;
          scene.add(runner1);

          runner2 = r2.model;
          mixer2 = r2.mixer;
          scene.add(runner2);

          striker = strk.model;
          strikerMixer = strk.mixer;
          striker.position.set(-0.9, 0, 0);
          striker.rotation.y = Math.PI / 2;
          scene.add(striker);
        });
      })
      .catch((err) => {
        console.warn('OlympicArena3D: Could not load 3D character models', err);
      });

    // 10. Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (mixer1) mixer1.update(delta);
      if (mixer2) mixer2.update(delta);
      if (strikerMixer) strikerMixer.update(delta);

      // Runner 1: Lane 2 (a = 4.7, b = 3.2)
      if (runner1) {
        const th1 = -time * 1.05;
        const x1 = 4.7 * Math.cos(th1);
        const z1 = 3.2 * Math.sin(th1);
        runner1.position.set(x1, 0, z1);
        const dx1 = -4.7 * Math.sin(th1) * -1.05;
        const dz1 = 3.2 * Math.cos(th1) * -1.05;
        runner1.rotation.y = Math.atan2(dx1, dz1);
        runner1.rotation.z = 0.08;
      }

      // Runner 2: Lane 3 (a = 4.0, b = 2.6, 90 deg behind)
      if (runner2) {
        const th2 = -(time - 1.2) * 1.05;
        const x2 = 4.0 * Math.cos(th2);
        const z2 = 2.6 * Math.sin(th2);
        runner2.position.set(x2, 0, z2);
        const dx2 = -4.0 * Math.sin(th2) * -1.05;
        const dz2 = 2.6 * Math.cos(th2) * -1.05;
        runner2.rotation.y = Math.atan2(dx2, dz2);
        runner2.rotation.z = 0.08;
      }

      // HIGH VELOCITY ROCKET SHOT ("LỰC SÚT CĂNG")
      const kc = time % 2.8;
      const kickStart = 0.40;
      const flightDuration = 0.20; // Blazing cannon shot velocity (0.20s!)
      const impactTime = kickStart + flightDuration; // 0.60s

      if (striker) {
        if (kc < kickStart) {
          // Sprint-up approach towards ball
          const tApp = kc / kickStart;
          striker.position.set(-1.15 + tApp * 0.45, 0, 0);
          striker.rotation.z = 0.05;
        } else if (kc < impactTime + 0.15) {
          // Explosive plant & follow-through
          striker.position.set(-0.70, 0, 0);
          striker.rotation.z = -0.18; // Strong backward lean into shot
        } else if (kc < 2.2) {
          // Follow-through stance
          striker.position.set(-0.70, 0, 0);
          striker.rotation.z = 0;
        } else {
          // Jog back
          const tRet = (kc - 2.2) / 0.6;
          striker.position.set(-0.70 - tRet * 0.45, 0, 0);
        }
      }

      if (kc < kickStart) {
        // Ball waiting on penalty spot
        ball.position.set(-0.55, 0.14, 0);
        ball.visible = true;
        net.position.set(0.275, 0.465, 0);
        net.scale.set(1, 1, 1);
        goal.position.set(1.7, 0, 0);
        goal.rotation.z = 0;
        camera.position.copy(initialCamPos);
      } else if (kc < impactTime) {
        // CANNON SHOT: Blazing hypersonic velocity across the pitch
        const t = (kc - kickStart) / flightDuration;
        const bx = -0.55 + (1.92 - (-0.55)) * t;
        // Bullet flat trajectory slightly rising into the top corner
        const by = 0.14 + 0.36 * t + Math.sin(t * Math.PI) * 0.06;
        ball.position.set(bx, by, 0);
        // Supersonic spin
        ball.rotation.z -= 2.5;
        ball.rotation.y += 1.2;
      } else if (kc < 2.2) {
        // Ball buried deep in back of net
        ball.position.set(1.92, 0.48, 0);

        // VIOLENT NET RIPPLE & VIBRATION (Lực sút căng làm lưới rung bần bật)
        const tHit = kc - impactTime;
        const decay = Math.exp(-tHit * 5.5); // Rapid exponential decay
        const shakeX = Math.sin(tHit * 48) * 0.14 * decay;
        const shakeY = Math.cos(tHit * 38) * 0.08 * decay;

        // Violent net bulge backwards
        net.position.set(0.275 + 0.14 * decay + shakeX, 0.465 + shakeY, 0);
        net.scale.set(1 + 0.35 * decay, 1 + 0.08 * decay, 1);

        // Goal frame shudder
        goal.position.x = 1.7 + 0.04 * decay;
        goal.rotation.z = -0.015 * decay;

        // Camera micro-shake impact feel
        if (tHit < 0.2) {
          const cDecay = (1 - tHit / 0.2);
          camera.position.y = initialCamPos.y + Math.sin(tHit * 50) * 0.05 * cDecay;
          camera.position.x = initialCamPos.x + Math.cos(tHit * 40) * 0.04 * cDecay;
        } else {
          camera.position.copy(initialCamPos);
        }
      } else {
        ball.visible = false;
        net.position.set(0.275, 0.465, 0);
        net.scale.set(1, 1, 1);
        goal.position.set(1.7, 0, 0);
        goal.rotation.z = 0;
        camera.position.copy(initialCamPos);
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      disposables.forEach((item) => {
        try {
          item.dispose();
        } catch (e) {
          // ignore
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-[680px] h-[520px] sm:w-[780px] sm:h-[580px] md:w-[860px] md:h-[640px] pointer-events-none select-none ${className}`}
      style={style}
    />
  );
}
export default OlympicArena3D;
