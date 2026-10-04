import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, AnimationMixer } from 'three';

for (const asset of ['nexora-prototype.glb', 'nexora-refined.glb']) test(`${asset} is a small, self-contained GLB with playable named clips`, async () => {
  const bytes = await readFile(new URL(`../public/assets/mascot/3d/${asset}`, import.meta.url));
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.ok(bytes.length < 500_000, 'Keep the optional model below 500 KB');
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '');
  assert.deepEqual(gltf.animations.map((clip) => clip.name).sort(), ['error', 'idle', 'listening', 'speaking', 'thinking', 'wave']);
  const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3());
  assert.ok(size.y > 3 && size.y < 5, 'Character has the expected upright framing');
  const mixer = new AnimationMixer(gltf.scene);
  for (const clip of gltf.animations) {
    assert.ok(clip.duration > 0 && clip.duration < 4);
    assert.ok(clip.tracks.length > 0);
    mixer.clipAction(clip).play();
    mixer.update(.3);
    gltf.scene.traverse((node) => {
      assert.ok(node.matrix.elements.every(Number.isFinite), `${clip.name} has valid transforms`);
    });
    mixer.stopAllAction();
  }
  mixer.uncacheRoot(gltf.scene);
});
