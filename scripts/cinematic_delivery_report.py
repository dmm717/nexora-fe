from pathlib import Path
import json
import hashlib
import struct
import subprocess

root=Path.cwd()
def git(*args):
    return subprocess.run(['rtk','proxy','git',*args],capture_output=True,text=True,encoding='utf-8',check=True).stdout.rstrip()
def glb(path):
    raw=Path(path).read_bytes()
    length=struct.unpack_from('<I',raw,12)[0]
    doc=json.loads(raw[20:20+length])
    triangles=sum(doc['accessors'][primitive['indices']]['count']//3 for mesh in doc['meshes'] for primitive in mesh['primitives'] if 'indices' in primitive)
    return {'bytes':len(raw),'meshes':len(doc['meshes']),'triangles':triangles,'textures':len(doc.get('textures',[])),'clips':[clip['name'] for clip in doc.get('animations',[])]}
baseline=json.loads(Path('.playwright-mcp/logs/pre-reset-hashes.json').read_text())
preserved=[name for name in baseline if name.startswith('public/assets/mascot/') or name.startswith('public/assets/brand/') or name in ['design/assets/nexora-mascot/nexora-prototype.blend','scripts/blender/create_nexora_mascot.py']]
changed=[name for name in preserved if hashlib.sha256(Path(name).read_bytes()).hexdigest()!=baseline[name]]
assert not changed, changed
assets={path:glb(path) for path in ['public/assets/brand/3d/nexora-emblem.glb','public/assets/mascot/3d/nexora-refined.glb']}
shots={}
for path in sorted(Path('.playwright-mcp/screenshots').glob('cinematic-*.*')):
    raw=path.read_bytes()
    if raw.startswith(b'\x89PNG'):
        shots[path.name]=struct.unpack_from('>II',raw,16)
    elif raw.startswith(b'\xff\xd8'):
        if path.suffix=='.png':
            path=path.rename(path.with_suffix('.jpg'))
        offset=2
        while offset<len(raw):
            if raw[offset]!=255:
                offset+=1
                continue
            marker=raw[offset+1]
            length=struct.unpack_from('>H',raw,offset+2)[0]
            if marker in (0xc0,0xc1,0xc2):
                height,width=struct.unpack_from('>HH',raw,offset+5)
                shots[path.name]=(width,height)
                break
            offset+=length+2
old=Path('design/light-editorial-redesign-report.md')
historical=old.read_text(encoding='utf-8')
if not historical.startswith('> HISTORICAL'):
    old.write_text('> HISTORICAL — Unapproved light editorial iteration, superseded by `cinematic-redesign-report.md`. The four commits listed below were removed from feature-branch ancestry with a mixed reset; their source changes were preserved. This document is retained as prior evidence, not the current delivery status.\n\n'+historical,encoding='utf-8')
branch=git('branch','--show-current')
head=git('rev-parse','HEAD')
status=git('status','--porcelain=v1','--untracked-files=all')
commits=git('log','-4','--format=%H %s','bbdbe6258805d907fb6fe3dfd61d61aaa4dbb278')
report=f'''# Nexora — cinematic redesign, awaiting visual approval

## Local Git and preservation

- Branch: `{branch}`
- HEAD / verified latest-main merge-base: `{head}`
- Initial working tree was clean; the feature branch contained exactly four redesign commits and no unrelated commits.
- `git fetch origin` succeeded. Remote refs did not contain the redesign commits; no matching feature branch or tag existed in `git ls-remote --heads --tags origin`.
- Used `git reset --mixed {head}`. No hard reset, clean, rebase, branch deletion, push, deploy, PR or merge.
- SHA256 comparison of all 662 inventoried source/assets immediately after reset had **zero differences**. Entire committed redesign was preserved as local working changes before intentional visual rework.
- Original Blender prototype, original GLB/script and canonical brand/mascot images are still byte-identical to the inventory: {len(preserved)} files checked again at delivery.
- Preservation evidence is local/ignored: `.playwright-mcp/logs/pre-reset-hashes.json` and `.playwright-mcp/logs/preserved-redesign.patch`.
- No commits created. Successful checks do not constitute visual approval.

Removed from feature branch ancestry (Git reflog still naturally retains prior objects):

```text
{commits}
```

## Implemented visual direction

1. Full viewport deep-blue/indigo opening. Official SVG emblem is extruded/beveled in Blender, displayed through actual Three.js GLB rendering with reflection environment and two dimensional torus orbits. Vietnamese headline, product explanation, functional original CTA and scroll anchor remain HTML.
2. One demand-rendered WebGL scene covers the opening and AI practice chapter. GSAP ScrollTrigger moves the real camera, emblem and orbit transforms. Separate scoped HTML timelines turn the studio panel in depth and reveal evidence/document panels. Normal scrolling; no pinned/hijacked section. Light evidence and CV chapters, a dark learning chapter, then a luminous final CTA.
3. Interview Studio now has a central ambient-blue stage, responsive official mascot, inset candidate camera, larger question hierarchy, dark sticky control dock and layered transcript. Actual recording/audio/submission/preparation state still drives presence. Speaking bars follow playback state, never a timer. No rendering switch is shown.
4. Actual `/resume-analyses` workspace has document-led heading, step rail, keyboard-accessible upload/drop zone, blue paper surfaces, aligned independent CV/context panels, readable inputs and action block. Actual report summary is separated from score/axis cards, with real data unchanged. Processing has a document surface and distinguishes report loading from real analysis. Public `/cv-analysis` has qualitative report structure, not fabricated scores.
5. Separate Blender refinement improves concave four-point star eyes, white eye reflection, pointing finger, cloth roughness/sheen, restrained Bezier interpolation and camera. **Character still fails the production fidelity gate.** Product uses official 2D art until visual approval of a better character. Thinking/error use appropriate official poses. The old prototype is preserved.

## Actual integrations and lifecycle

- Direct Three.js, GLTFLoader, RoomEnvironment/PMREM; no Spline iframe or R3F dependency is claimed.
- GSAP + ScrollTrigger + scoped React cleanup; client-only WebGL dynamically loaded. Meaningful landing HTML remains prerenderable/SEO-readable.
- Blender 5.2.2 LTS Python scripts: `scripts/blender/create_nexora_emblem.py`, `scripts/blender/refine_nexora_mascot.py`. Both executed successfully and produced `.blend`, `.glb`, review render.
- Enhancement respects reduced motion, save-data, slow connection and low memory. Unsupported renderer/asset failure/context loss keep an official-emblem 2D fallback in the same reserved space.
- ResizeObserver, IntersectionObserver, document visibility, late-load cancellation, context loss handler, geometry/material/environment disposal and forceContextLoss cleanup are implemented. Scene renders on animation/scroll/resize changes; there is no continuously running WebGL loop in each chapter.
- No texture payloads; tiny emblem needs no texture/mesh compressor overhead. Character assets remain review-only and are not fetched by the product.

Actual GLB measurements:

```json
{json.dumps(assets,indent=2)}
```

## Character quality limitations

The reference has a tapered/tilted suitcase head, nuanced outline, natural hip stance, cloth folds and expressive hands. The refined asset still has a boxy head, simplified gloves, stiff anatomy/clothing and object-level animation instead of a production rig. It has six playable clips, but no viseme/lip-sync rig. Further work requires sculpted faithful proportions, clean hand topology, tailored clothes/creases, retopology, skeletal rig and authored gesture/face animations before setting `CHARACTER_3D_READY` true. No rough prototype is presented as completed 3D character work.

## Actual validation

- `npm run lint`: exit 0; 0 errors, 193 repository warnings.
- `npx tsc --noEmit`: exit 0.
- `npm test`: 683/683 pass, 0 skipped. Includes interview intent/retry/quota contracts and original + refined GLB clip/transform validation. Only superseded presentation assertions were adjusted for the new direction.
- `npm run build`: exit 0; production compiled and static/dynamic routes generated.
- Playwright: 18/18 pass across cinematic scene/camera, reduced motion, GLB abort, context loss, live preference change, CV public layout/links, route remount, testimonial layout/avatar and five isolated studio visual states at 1440/390/360.
- `git diff --check`: exit 0.
- Real authenticated browser inspection: landing 1440/390 (actual 3D in Playwright), interview 1440/390, CV workspace and existing CV report 1440/390. No auth bypass or fabricated interview/CV API state. Checked initial loading, scroll, question readability, source-mode selection, disabled invalid analysis action, existing report navigation, transcript, text editor opening/closing, and audio stopping.
- No browser console errors/hydration errors observed in real interview/CV views or tested landing/CV introduction. An above-fold logo LCP warning was addressed using eager loading in headers.
- Real browser voice playback became unavailable after navigation in the preview and correctly showed error/retry + readable question. This is a preview audio limitation, not a completed end-to-end audio claim. Microphone/camera capture, new uploads, answer submission and paid actions were not exercised against the user's live records during visual QA.
- Logs in `.playwright-mcp/logs/cinematic-{{lint,type,unit,build,e2e}}.log`; Blender logs beside them. Earlier failing visual selectors were corrected before the final passing run.

## Preview

- Landing: http://localhost:3000/
- Real Interview Studio: http://localhost:3000/interviews/071c87ec-a9b2-42d7-bc57-7c3f28167838
- CV workspace: http://localhost:3000/resume-analyses
- Public CV introduction: http://localhost:3000/cv-analysis
- Existing real CV report: http://localhost:3000/resume-analyses/1241152b-f29a-4e00-b24e-fa496420055a
- Preview uses existing `.env.local` backend/auth. Local persistent development server listens on port 3000; protected routes require the existing valid user session.

Screenshot evidence (local ignored files, may include private authenticated UI; not published). Browser viewport overrides were 1440/390; IAB JPEG capture excludes its scrollbar/frame area (1434/384 drawable width). Playwright PNG captures use the exact requested widths.

```json
{json.dumps(shots,indent=2)}
```

## Modified/untracked files at delivery

All files remain uncommitted, including the preserved earlier iteration. Full status:

```text
{status}
```

WAITING_FOR_VISUAL_APPROVAL — NO COMMITS CREATED
'''
Path('design/cinematic-redesign-report.md').write_text(report,encoding='utf-8')
print(json.dumps({'branch':branch,'HEAD':head,'preserved_assets':len(preserved),'canonical_differences':changed,'assets':assets,'screenshots':shots,'modified':sum(line.startswith(' M') for line in status.splitlines()),'untracked':sum(line.startswith('??') for line in status.splitlines())},indent=2))
