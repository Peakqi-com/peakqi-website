#!/bin/bash
cd "$(dirname "$0")/.."
run1(){ local p=$1 w=$2 h=$3
  CDP_PORT=$((9000 + RANDOM % 400)) node .peakops-audit/run.mjs "http://127.0.0.1:8000/$p.dc.html" "-" $w $h 0 ".peakops-audit/finalcheck.js" > ".peakops-audit/final/$p-$w.json" 2>&1
}
PAGES="Home Solutions Method Cases Pricing PeakOps About Demo Products Contact"
SIZES="320x568 360x640 375x812 390x844 414x896 430x932 768x1024 1280x800 1440x900 1920x1080"
i=0
for p in $PAGES; do
  for wh in $SIZES; do
    w=${wh%x*}; h=${wh#*x}
    run1 $p $w $h &
    i=$((i+1))
    if [ $((i % 4)) -eq 0 ]; then wait; fi
  done
done
wait
echo FINAL-SWEEP-DONE
