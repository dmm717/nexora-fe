from pathlib import Path
def edit(path, old, new):
    p=Path(path); s=p.read_text(encoding='utf-8'); assert old in s, (path,old); p.write_text(s.replace(old,new),encoding='utf-8')
def replace_body(path,title,body):
    p=Path(path); s=p.read_text(encoding='utf-8'); start=s.index("test('"+title); opening=s.index('=> {',start)+4; end=s.index('\n});',opening); p.write_text(s[:opening]+'\n'+body+s[end:],encoding='utf-8')
replace_body('tests/landingMotion.test.mjs','1. default landing markup provides visible, accessible content without script animation', '''  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  const hero = await source('src/components/features/landing/CinematicHero.tsx');
  assert.match(landing, /<CinematicHero/);
  for (const selector of ['data-reveal','data-loop-node','data-loop-track','data-story-panel']) assert.ok(landing.includes(selector));
  assert.match(hero, /Luyện tập hôm nay/);
  assert.match(hero, /Bắt đầu luyện tập/);
  assert.doesNotMatch(landing, /data-cv-count|data-cv-meter|data-count=|data-radial/);''')
replace_body('tests/landingMotion.test.mjs','7. hero is an explicitly labeled presentation, with no competing float ownership', '''  const hero = await source('src/components/features/landing/CinematicHero.tsx');
  const scene = await source('src/components/features/landing/NexoraBrandScene.tsx');
  assert.match(hero, /Minh họa/);
  assert.match(scene, /camera.position/);
  assert.match(scene, /scrollTrigger:/);
  assert.doesNotMatch(scene, /pin:|setAnimationLoop/);''')
replace_body('tests/landingMotion.test.mjs','9. runtime mode diagnostics and dynamic CV demo have explicit motion ownership', '''  const motion = await source('src/components/features/landing/useLandingMotion.ts');
  for (const mode of ['normal','reduced','fallback']) assert.ok(motion.includes(`dataset.motionMode = '${mode}'`));
  assert.match(motion, /dataset\\.motionTriggerCount/);
  const landing = await source('src/components/features/landing/MarketingLanding.tsx');
  assert.match(landing, /documentArtifact/);
  assert.match(landing, /documentInsights/);
  assert.doesNotMatch(landing, /data-cv-count|data-cv-meter|data-cv-radial/);''')
edit('tests/feedbackModerationAndPublic.test.mjs',"['cvAnalysis', 'aiCoach', 'celebrate']","['cvAnalysis', 'celebrate']")
edit('tests/feedbackModerationAndPublic.test.mjs',"assert.equal((productionCopy.match(/Minh họa Nexora Interview Studio, không phải phiên trực tiếp/g) ?? []).length, 1);","assert.match(readFileSync(new URL('../src/components/features/landing/CinematicHero.tsx', import.meta.url), 'utf8'), /Minh họa/);")
edit('tests/productRedesignAudit.test.mjs','assert.match(landingSource, /data-cv-demo-result/);','assert.match(landingSource, /documentPreview/);\n  assert.doesNotMatch(landingSource, /data-cv-count/);')
edit('tests/productUiPolishRound2.test.mjs','assert.match(landingSource, /sizes="\\(max-width: 760px\\) 118px, \\(max-width: 1100px\\) 146px, 180px"/);',"assert.match(await readSource('../src/components/features/landing/CinematicHero.tsx'), /NEXORA_MASCOT_ASSETS\\.aiCoach/);")
edit('tests/publicAuthPolish.test.mjs','assert.match(landing, /prefers-reduced-motion/);\n  assert.match(landing, /78/);',"assert.match(await source('src/components/brand/useVisualPolicy.ts'), /prefers-reduced-motion/);\n  assert.doesNotMatch(landing, /data-cv-count/);")
edit('tests/publicAuthPolish.test.mjs','assert.match(landing, new RegExp(`id=["\']${id}["\']`));',"assert.match(id === 'ai-interview' ? await source('src/components/features/landing/CinematicHero.tsx') : landing, new RegExp(`id=[\"']${id}[\"']`));")
edit('tests/runtimeMotionAccessibility.test.mjs','assert.match(interviewCss, /@media \\(prefers-reduced-motion: no-preference\\)[\\s\\S]*data-state="speaking"\\] \\.ai-mascot img/);','assert.match(interviewCss, /\\.ai-mascot img\\s*\\{[^}]*animation:\\s*none/);')
edit('tests/e2e/landing-testimonials-scroll.spec.ts',"toContainText('Luyện phỏng vấn')","toContainText('Luyện tập hôm nay')")
# Superseded opt-in rendering checks are covered by automatic WebGL/fallback tests.
p=Path('tests/e2e/light-editorial-redesign.spec.ts');s=p.read_text(encoding='utf-8');s=s[s.index('for (const width of [1440, 390, 360])'):];p.write_text("import { expect, test } from '@playwright/test';\n\n"+s,encoding='utf-8')
p=Path('tests/e2e/landing-motion.spec.ts');s=p.read_text(encoding='utf-8');s=s.replace("[data-cv-demo-result]","[class*=documentPreview]").replace("[data-hero-card]","[data-cinematic-copy]");s=s.replace("await expect(result.locator('[data-cv-count]')).toHaveText('78');","await expect(result).toContainText('Kinh nghiệm');").replace("await expect(result.locator('[data-cv-meter]').first()).toHaveCSS('transform', 'none');","await expect(result).not.toContainText('78');");p.write_text(s,encoding='utf-8')
