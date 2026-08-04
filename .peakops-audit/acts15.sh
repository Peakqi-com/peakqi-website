#!/bin/bash
cd "$(dirname "$0")/.."
mkdir -p .peakops-audit/acts
run1(){ local w=$1 h=$2
  CDP_PORT=$((9000 + RANDOM % 500)) node .peakops-audit/run.mjs "http://127.0.0.1:8000/Home.dc.html" "-" $w $h 0 ".peakops-audit/menuall.js" > ".peakops-audit/acts/m-$w-$h.json" 2>&1
}
i=0
for wh in 320x568 360x640 375x667 375x812 390x844 402x874 414x896 430x932 540x720 812x375 1000x900; do
  w=${wh%x*}; h=${wh#*x}
  run1 $w $h &
  i=$((i+1)); if [ $((i % 3)) -eq 0 ]; then wait; fi
done
wait
echo ACTS-CHECK-DONE
