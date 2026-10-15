'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import styles from './cinematic.module.css';
import { observeBrandMotion, observeBrandPresence, type BrandMotion, type BrandPresence } from './brandMotion';

function release(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  object.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
  });
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

/** One demand-rendered scene: GSAP moves actual camera/object transforms. */
export default function NexoraBrandScene({ onReady, onError }: { onReady: () => void; onError: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    const journey = element?.closest<HTMLElement>('[data-cinematic-journey]');
    if (!element || !journey) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { onError(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 600 ? 1.25 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 40);
    camera.position.set(.5, 0, 8.8);
    camera.lookAt(0, 0, 0);
    const studio = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const reflection = pmrem.fromScene(studio, .035);
    scene.environment = reflection.texture;
    studio.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xc5d7ff, 0x101047, 1.4));
    const key = new THREE.DirectionalLight(0xd8e5ff, 4);
    key.position.set(-3, 4, 6);
    const rim = new THREE.DirectionalLight(0xb1a0ff, 5);
    rim.position.set(4, 2, -2);
    scene.add(key, rim);
    const rings = new THREE.Group();
    for (let i = 0; i < 2; i += 1) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * .5, .012, 6, 120),
        new THREE.MeshBasicMaterial({ color: i ? 0xb6abff : 0x9bceff, transparent: true, opacity: i ? .42 : .58 }));
      ring.rotation.set(1.2 + i * .2, .15, -.28 + i * .1);
      rings.add(ring);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdbeaff }));
      const glow = new THREE.Mesh(new THREE.SphereGeometry(.095, 10, 8), new THREE.MeshBasicMaterial({ color: 0x88baff, transparent: true, opacity: .28, depthWrite: false }));
      beacon.add(glow);
      ring.add(beacon);
    }
    rings.position.set(0, 1.9, -.7);
    scene.add(rings);
    let model: THREE.Object3D | undefined;
    let disposed = false;
    let visible = true;
    let viewportWidth = 1;
    let viewportHeight = 1;
    let cleanupMotion: (() => void) | undefined;
    let cleanupPresence: (() => void) | undefined;
    let presence: BrandPresence = { time: 0, x: 0, y: 0 };
    let motion: BrandMotion = { entrance: 1, travel: 0, light: 1 };
    const fail = () => { if (!disposed) onError(); };
    const draw = () => {
      if (disposed || !visible || document.hidden) return;
      try { renderer.render(scene, camera); } catch { fail(); }
    };
    const frame = () => {
      const t = motion.travel;
      const strength = 1 - Math.min(1, t);
      const phase = presence.time;
      const frustum = 2 * 8.8 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const originY = ((viewportHeight / 2 - (viewportWidth < 600 ? 150 : 170)) / viewportHeight) * frustum;
      camera.position.set(.5 + 1.4 * t, -.2 * t, 8.8 - 1.6 * t);
      if (model) {
        const width = viewportWidth;
        const height = viewportHeight;
        model.position.set(-1.7 * t, originY * (1 - t) + .45 * t, -1.6 * t + (1 - motion.entrance) * -1.8);
        model.rotation.set(.06 + .16 * t, -.42 + 1.52 * t - (1 - motion.entrance) * .6, -.12 + .2 * t);
        model.position.y += Math.sin(phase * .75) * .055 * strength;
        model.rotation.x += (presence.y * .07 + Math.sin(phase * .45) * .025) * strength;
        model.rotation.y += (presence.x * .14 + Math.sin(phase * .4) * .06) * strength;
        model.scale.setScalar(((width < 600 ? 190 : 250) / height) * frustum / 3.22);
      }
      key.intensity = 2 + 2 * motion.light;
      rim.intensity = 3 + 2 * motion.light;
      rings.scale.setScalar(Math.min(viewportWidth * .9, 760) / viewportHeight * frustum / 6.2);
      rings.position.y = originY;
      rings.rotation.set(0, .7 * t, .3 * t);
      rings.rotation.y += Math.sin(phase * .3) * .09 * strength;
      rings.rotation.z += Math.sin(phase * .23) * .055 * strength;
      rings.children.forEach((ring, index) => {
        ring.rotation.x = 1.2 + index * .2 + Math.sin(phase * .32 + index) * .07 * strength;
        ring.rotation.z = -.28 + index * .1 + Math.sin(phase * .25 + index) * .08 * strength;
        const beacon = ring.children[0];
        const angle = phase * (index ? -.32 : .38) + index * Math.PI;
        beacon.position.set(Math.cos(angle) * (2.6 + index * .5), Math.sin(angle) * (2.6 + index * .5), 0);
      });
      camera.lookAt(0, 0, 0);
      if (model) journey.dataset.cameraX = camera.position.x.toFixed(3);
      draw();
    };
    const resize = () => {
      if (disposed) return;
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      viewportWidth = width;
      viewportHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      frame();
    };
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(element);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) frame(); });
    visibility.observe(journey);
    document.addEventListener('visibilitychange', frame);
    const onContextLost = (event: Event) => { event.preventDefault(); fail(); };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    resize();
    new GLTFLoader().load('/assets/brand/3d/nexora-emblem.glb', gltf => {
      if (disposed) { release(gltf.scene); return; }
      model = gltf.scene;
      scene.add(model);
      cleanupMotion = observeBrandMotion(journey, next => { motion = next; frame(); });
      cleanupPresence = observeBrandPresence(journey, next => { presence = next; frame(); });
      onReady();
    }, undefined, fail);
    return () => {
      disposed = true;
      cleanupMotion?.();
      cleanupPresence?.();
      sizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', frame);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      release(scene);
      reflection.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [onReady, onError]);
  return <div ref={host} className={styles.canvas} data-brand-canvas aria-hidden="true" />;
}
