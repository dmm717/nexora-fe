from pathlib import Path
p=Path('src/app/(dashboard)/resume-analyses/[id]/page.tsx')
s=p.read_text(encoding='utf-8')
start=s.index('              {summary && (')
end=s.index('              )}',start)+len('              )}')
s=s[:start]+s[end:]
anchor='      {/* Hero Overview: Radial Score + Dimension Breakdown */}'
s=s.replace(anchor,'''      {summary && (
        <section className={cvStyles.summaryPanel} aria-labelledby="cv-summary-title">
          <h2 id="cv-summary-title">Góc nhìn tổng quan từ Nexora AI</h2>
          <p>{summary}</p>
        </section>
      )}

'''+anchor)
s=s.replace('className="grid grid-cols-1 lg:grid-cols-12 gap-6"','className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"')
s=s.replace('h-full flex flex-col justify-between space-y-5','flex flex-col justify-between space-y-5').replace('h-full flex flex-col justify-between space-y-4','flex flex-col justify-between space-y-4')
p.write_text(s,encoding='utf-8')
