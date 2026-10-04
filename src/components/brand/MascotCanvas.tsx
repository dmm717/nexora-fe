'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { InterviewPresenceState } from '@/components/features/interview/AiInterviewerPresence';
import styles from './MascotVisual.module.css';

interface Props {
  state: InterviewPresenceState;
  welcome: boolean;
  onReady: () => void;
  onError: () => void;
}

function disposeModel(model: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) textures.add(value); });
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

export default function MascotCanvas({ state, welcome, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const setClipRef = useRef<((state: InterviewPresenceState) => void) | null>(null);

  useEffect(() => {
    stateRef.current = state;
    setClipRef.current?.(state);
  }, [state]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      onError();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 30);
    camera.position.set(.55, .18, 8.4);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb7a9c9, 2.6));
    const key = new THREE.DirectionalLight(0xfff7ed, 3.2);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe0ddff, 1.7);
    fill.position.set(4, 2, 3);
    scene.add(fill);

    let disposed = false;
    let model: THREE.Object3D | null = null;
    let mixer: THREE.AnimationMixer | null = null;
    let currentAction: THREE.AnimationAction | null = null;
    let clips: THREE.AnimationClip[] = [];
    let visible = false;
    let lastTime = 0;
    let welcomePending = welcome;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fail = () => { renderer.setAnimationLoop(null); if (!disposed) onError(); };
    const draw = () => {
      if (disposed || !model) return;
      try { renderer.render(scene, camera); } catch { fail(); }
    };

    const setClip = (next: InterviewPresenceState) => {
      if (!mixer || !model) return;
      const clip = clips.find((item) => item.name === (welcomePending && next === 'idle' && !reduced.matches ? 'wave' : next));
      if (!clip) return;
      const action = mixer.clipAction(clip);
      if (action !== currentAction) {
        currentAction?.fadeOut(.2);
        action.reset().fadeIn(.2).play();
        if (welcomePending && clip.name === 'wave') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        } else {
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
        currentAction = action;
      }
      if (reduced.matches) {
        mixer.update(0);
        draw();
      }
    };
    setClipRef.current = setClip;

    const syncLoop = () => {
      if (disposed) return;
      lastTime = 0;
      renderer.setAnimationLoop(null);
      if (disposed || !model || !visible || document.hidden) return;
      if (reduced.matches) { draw(); return; }
      renderer.setAnimationLoop((time) => {
        if (disposed) return;
        try {
          const delta = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
          lastTime = time;
          mixer?.update(delta);
          draw();
        } catch { fail(); }
      });
    };
    const onPreference = () => { setClip(stateRef.current); syncLoop(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); }, { threshold: .05 });
    observer.observe(element);
    const resize = new ResizeObserver(([entry]) => {
      if (disposed) return;
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    });
    resize.observe(element);
    document.addEventListener('visibilitychange', syncLoop);
    reduced.addEventListener('change', onPreference);
    renderer.domElement.addEventListener('webglcontextlost', fail);

    new GLTFLoader().load('/assets/mascot/3d/nexora-prototype.glb', (gltf) => {
      if (disposed) { disposeModel(gltf.scene); return; }
      try {
        model = gltf.scene;
        const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(center);
        scene.add(model);
        mixer = new THREE.AnimationMixer(model);
        clips = gltf.animations;
        mixer.addEventListener('finished', () => { welcomePending = false; setClip(stateRef.current); });
        setClip(stateRef.current);
        // Resolve the initial fade before the first visible render.
        mixer.update(.2);
        draw();
        onReady();
        syncLoop();
      } catch { fail(); }
    }, undefined, fail);

    return () => {
      disposed = true;
      setClipRef.current = null;
      observer.disconnect();
      resize.disconnect();
      reduced.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', syncLoop);
      renderer.domElement.removeEventListener('webglcontextlost', fail);
      renderer.setAnimationLoop(null);
      mixer?.stopAllAction();
      if (model) { mixer?.uncacheRoot(model); disposeModel(model); }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [welcome, onReady, onError]);

  return <div ref={host} className={styles.canvas} aria-hidden="true" data-mascot-canvas="" />;
}
