# -*- coding: utf-8 -*-
"""彙整 .peakops-audit/ma/*.json 成一份可讀報告(stdout)。"""
import io
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
D = os.path.join(os.path.dirname(__file__), 'ma')

rows = []
for fn in sorted(os.listdir(D)):
    if not fn.endswith('.json'):
        continue
    raw = io.open(os.path.join(D, fn), encoding='utf-8').read().strip()
    tag = fn[:-5]
    try:
        j = json.loads(raw)
    except Exception:
        print('!! %s 解析失敗: %s' % (tag, raw[:120]))
        continue
    if not isinstance(j, dict) or 'screens' not in j:
        print('!! %s 非預期輸出: %s' % (tag, raw[:120]))
        continue
    rows.append((tag, j))

print('=== 總覽(頁-寬度 | 屏數 | 爆版px | 重疊 | 小字 | 小觸控 | 長任務ms | 固定遮擋%) ===')
for tag, j in rows:
    print('%-22s %6s屏 %5spx %4s疊 %4s小字 %4s鈕 %6sms %5s%%' % (
        tag, j['screens'], j['maxOverflow'], len(j['overlaps']),
        len(j['tinyText']), len(j['smallTap']), j['ltMs'], j['fixedCoverPct']))

print()
print('=== 重疊明細 ===')
for tag, j in rows:
    for ov in j['overlaps']:
        print('%-22s y=%-6s r=%.2f  [%s] x [%s]' % (tag, ov['y'], ov['r'], ov['a'], ov['b']))

print()
print('=== 爆版明細 ===')
for tag, j in rows:
    for of in j['overflow']:
        print('%-22s y=%-6s +%spx' % (tag, of['y'], of['px']))

print()
print('=== 小字明細(<11.5px) ===')
for tag, j in rows:
    for t in j['tinyText']:
        print('%-22s y=%-6s %spx [%s]' % (tag, t['y'], t['fs'], t['t']))

print()
print('=== 觸控目標 <38px 高 ===')
seen = set()
for tag, j in rows:
    for t in j['smallTap']:
        k = t['t']
        if k in seen:
            continue
        seen.add(k)
        print('%-22s %sx%s [%s]' % (tag, t['w'], t['h'], t['t']))
