# Nexora mascot — preserved prototype and review-only refinement

Generated locally with **Blender 5.2.2 LTS**, using the official
`public/assets/mascot/mascot-reference.png` as the visual reference.
Canonical brand and mascot images have not been edited.

## Files

- `nexora-prototype.blend`: editable source, review camera and lighting.
- `prototype-preview.png`: transparent Blender render for visual review.
- `../../../public/assets/mascot/3d/nexora-prototype.glb`: browser export.
- `../../../scripts/blender/create_nexora_mascot.py`: deterministic generator.

Windows regeneration from the repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python scripts/blender/create_nexora_mascot.py
```

The export is 301,556 bytes (approximately 302 KB), with 11,257 triangles, 40 meshes, simple
materials and no external textures. Clips: `idle`, `speaking`, `listening`,
`thinking`, `wave`, `error`. NLA tracks animate object pivots; there is no
skeletal or facial rig. The preserved runtime can select clips from real
interview/audio state, but the character quality gate is currently closed.
There is no mouth synchronization or blink.

The separate `nexora-refined.blend`, `refined-preview.png` and
`nexora-refined.glb` come from `scripts/blender/refine_nexora_mascot.py`.
The refined GLB is 337,828 bytes, 11,989 triangles, 39 meshes, no textures and
the same six named clips. Changes include concave diamond star eyes,
white reflections, a single pointing finger, cloth roughness/sheen and
clamped Bezier interpolation. The original prototype/source/export remain intact.

## Fidelity and default behavior

The briefcase silhouette/handle, star eyes, cheeks, lavender shirt, dark tie,
belt and charcoal trousers preserve the recognizable character. The head is
more rectangular, the star cutouts and outline are simpler, and the sleeves,
gloves and shoes use smooth primitive geometry. The pose and proportions are
a stylized approximation, not an approved replacement for the official art.
Further artist refinement is needed before making 3D the default.

The interview room uses official 2D artwork while `CHARACTER_3D_READY` is false.
There is no user-facing 2D/3D switch. The landing instead renders the official
Nexora emblem as a real Blender/Three.js object. Rendering policy is automatic:
reduced motion, data/performance constraints, WebGL failure, asset failure and
context loss retain the consistent 2D fallback without changing layout.
The room visual layer never calls interview APIs, controls audio or modifies
interview state. Do not open the quality gate until a faithful character passes
visual review: the current head, glove anatomy, cloth folds, body posture and
object-level rig are still below the desired production bar.

Current delivery and QA: [cinematic redesign report](../../cinematic-redesign-report.md).

Implementation follows [Three.js resource disposal guidance](https://threejs.org/manual/en/how-to-dispose-of-objects.html)
and the [GLTFLoader API](https://threejs.org/docs/pages/GLTFLoader.html).
