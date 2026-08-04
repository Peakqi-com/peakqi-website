#!/bin/bash
cd "$(dirname "$0")/.."
run1(){ local p=$1 sp=$2 w=$3
  CDP_PORT=$((9200 + RANDOM % 300)) node .peakops-audit/run.mjs "http://127.0.0.1:8000/$p.dc.html?sp=$sp" "-" $w 900 0 ".peakops-audit/dotline2.js" 2>&1 | tail -40 > ".peakops-audit/a5/$p-$sp-$w.json"
}
i=0
for p in Home Solutions Method Cases Pricing PeakOps About Demo Products Contact; do
  for sp in 0.2 0.45 0.7 0.9; do
    for w in 1440 390; do
      run1 $p $sp $w &
      i=$((i+1))
      if [ $((i % 4)) -eq 0 ]; then wait; fi
    done
  done
done
wait
echo A5-SWEEP-DONE
