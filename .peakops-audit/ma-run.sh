#!/bin/bash
cd "$(dirname "$0")/.."
run1(){ local p=$1 w=$2 h=$3
  node .peakops-audit/run.mjs "http://127.0.0.1:8000/$p.dc.html" ".peakops-audit/ma/$p-$w.png" $w $h 0 ".peakops-audit/mobile-audit.js" 2>&1 | tail -1 > ".peakops-audit/ma/$p-$w.json"
  echo "done $p-$w"
}
PAGES="Home About Cases Demo Method PeakOps Pricing Solutions Contact Products Case AIInteriorPro AIWeddingPro"
i=0
for p in $PAGES; do
  for wh in "360 800" "430 932"; do
    set -- $wh
    run1 $p $1 $2 &
    i=$((i+1))
    if [ $((i % 3)) -eq 0 ]; then wait; fi
  done
done
wait
echo ALL-DONE
