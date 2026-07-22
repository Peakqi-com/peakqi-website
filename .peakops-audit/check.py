# -*- coding: utf-8 -*-
"""讀 run.mjs 的輸出(兩段 JSON),比對動畫 DOM 契約基準,印出精簡驗收報告。"""
import sys, json, io
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE = {'wrap': 4, 'stage': 4, 'scrim': 1, 'st': 4, 'chip': 6, 'win': 5, 'dep': 5,
        'badge': 1, 'leak': 3, 'lossv': 5, 't': 5, 'layer': 4, 'deck': 1, 'rail': 3,
        'mcap': 1, 'hpath': 3, 'hpack': 3, 'hnum': 4, 'hnote': 1, 'dtool': 5,
        'dmeter': 5, 'dcount': 5, 'dtake': 1, 'dscan': 1, 'live-panel': 6,
        'live-item': 6, 'live-link': 1, 'rstation': 6, 'rchip': 6, 'rfill': 1,
        'orbcard': 6, 'count': 9, 'caseimg': 3, 'sweeper': 1, 'tstep': 5, 'dot': 5,
        'tline': 1, 'console': 1, 'echo': 3, 'spot': 1, 'tilt': 10, 'cta': 11,
        'arrow': 9, 'divider': 3}

raw = io.open(sys.argv[1], encoding='utf-8', errors='replace').read()
dec = json.JSONDecoder()
objs, i = [], 0
while i < len(raw):
    j = raw.find('{', i)
    if j < 0:
        break
    try:
        o, e = dec.raw_decode(raw, j)
        objs.append(o)
        i = e
    except ValueError:
        i = j + 1

con = next((o for o in objs if 'consoleErrors' in o), {})
d = next((o for o in objs if 'hooks' in o), None)


def p(*a):
    print(*a)


p('== console ==')
for e in con.get('consoleErrors', []) or ['(none)']:
    p('  ', e)
if con.get('probeError'):
    p('  PROBE ERROR:', con['probeError'])
if not d:
    p('!! probe 沒有回傳資料')
    raise SystemExit(1)

p('== render ==')
p('  vw=%s rendered=%s docH=%s overflowX=%s' % (d['vw'], d['rendered'], d['docH'], d['overflowX']))
if d['overflowCulprits']:
    p('  溢位元素:', d['overflowCulprits'])
if d['missingSections'] or d['missingIds']:
    p('  !! 消失的 section/id:', d['missingSections'], d['missingIds'])
bad = [k for k, v in d['nest'].items() if not v]
p('  巢狀契約:', 'OK' if not bad else '!! 破損 ' + str(bad))

drift = {k: (BASE[k], d['hooks'].get(k)) for k in BASE if BASE[k] != d['hooks'].get(k)}
p('  data-* 契約(44 項):', ' 全部一致' if not drift else '!! 漂移 ' + str(drift))

p('== 字級 <14px ==')
for t in (d['smallText'] or ['(none)'])[:14]:
    p('  ', t)
p('== 觸控 <40px ==')
for t in (d['tinyTouch'] or ['(none)'])[:10]:
    p('  ', t)

fail = bool(bad or drift or d['missingSections'] or d['missingIds']
            or d['overflowX'] != 'ok' or not d['rendered'])
p('\nRESULT:', 'FAIL' if fail else 'PASS')
raise SystemExit(1 if fail else 0)
