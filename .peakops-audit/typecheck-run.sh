#!/bin/bash
# 改制總驗收:全頁 x 多寬度 x 多捲動點的 titlefit(標題行數/孤字/px 殘留 + 溢出)
cd "$(dirname "$0")/.."
mkdir -p .peakops-audit/type
run1(){ local p=$1 w=$2 h=$3 sp=$4
  CDP_PORT=$((9000 + RANDOM % 700)) node .peakops-audit/run.mjs "http://127.0.0.1:8000/$p.dc.html?sp=$sp" "-" $w $h 0 ".peakops-audit/titlefit.js" > ".peakops-audit/type/$p-$w-$sp.json" 2>&1
}
PAGES="Home Solutions Method Cases Pricing PeakOps About Demo Products Contact Case AIWeddingPro AIInteriorPro Bubble 404"
i=0
for p in $PAGES; do
  for wh in "320 568" "375 812" "390 844" "430 932" "1440 900"; do
    set -- $wh
    for sp in 0 0.45 0.85; do
      run1 $p $1 $2 $sp &
      i=$((i+1)); if [ $((i % 4)) -eq 0 ]; then wait; fi
    done
  done
done
wait
echo TYPECHECK-DONE
