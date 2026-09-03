"""
Checks every spacing utility against the project's 8-point scale.

Allowed: any multiple of 8, plus 1, 2, 4 and 12 for hairlines and tight
clusters. Run with `npm run check:spacing`; a non-zero exit means something
off-scale crept in.

Content dimensions that are not spacing decisions — a logo's own aspect ratio,
for instance — are listed in ALLOWLIST with the reason.
"""

import re, glob, collections, sys

PREFIX = r'(?:-)?(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|top|right|bottom|left|inset|inset-x|inset-y|translate-x|translate-y|rounded|text|leading)'
# only spacing-like utilities take the 4px unit
SPACING = {'p','px','py','pt','pr','pb','pl','m','mx','my','mt','mr','mb','ml',
           'gap','gap-x','gap-y','space-x','space-y','w','h','size','min-w','min-h',
           'max-w','max-h','top','right','bottom','left','inset','inset-x','inset-y'}
ALLOWED = lambda px: px % 8 == 0 or px in (1, 2, 4, 12)

ALLOWLIST = {
    'w-[83px]': "the Packhelp wordmark's own ratio at 16px tall",
}

pat = re.compile(r'(?<![\w-])(-?)([a-z]+(?:-[a-z])?(?:-[a-z]+)?)-(\[[^\]]+\]|\d+(?:\.\d+)?|px|full|auto|screen|min|max|fit)(?![\w-])')
bad = collections.Counter()
where = collections.defaultdict(list)

for f in glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True):
    for n, line in enumerate(open(f), 1):
        for m in pat.finditer(line):
            util, val = m.group(2), m.group(3)
            if util not in SPACING: continue
            if val in ('full','auto','screen','min','max','fit','px'): continue
            if val.startswith('['):
                inner = val[1:-1]
                mm = re.fullmatch(r'(\d+(?:\.\d+)?)px', inner)
                if not mm: continue
                px = float(mm.group(1))
            else:
                px = float(val) * 4
            if px != int(px) or not ALLOWED(int(px)):
                token = f"{m.group(1)}{util}-{val}"
                if token in ALLOWLIST:
                    continue
                bad[f"{token} = {px:g}px"] += 1
                where[token].append(f"{f}:{n}")

if not bad:
    print('spacing: everything on the 8-point scale')
    sys.exit(0)

print(f"off-scale utilities: {sum(bad.values())} uses, {len(bad)} distinct\n")
for k, c in bad.most_common():
    token = k.split(' = ')[0]
    print(f"{c:4}x  {k}")
    for place in where[token][:3]:
        print(f"        {place}")
sys.exit(1)
