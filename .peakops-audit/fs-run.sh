#!/bin/bash
cd "$(dirname "$0")/.."
mkdir -p .peakops-audit/fs
run1(){ local p=$1 w=$2 h=$3 port=$4
  CDP_PORT=$port timeout 120 node .peakops-audit/run.mjs "http://127.0.0.1:8000/$p.dc.html" ".peakops-audit/fs/$p-$w.png" $w $h 0 ".peakops-audit/firstscreen.js" 2>&1 | tail -1 > ".peakops-audit/fs/$p-$w.json"
  echo "done $p-$w"
}
PAGES="Home About Cases Demo Method PeakOps Pricing Solutions"
i=0
for p in $PAGES; do
  for wh in "1440 900" "1920 950" "390 844"; do
    set -- $wh
    run1 $p $1 $2 $((9700+i)) &
    i=$((i+1))
    if [ $((i % 3)) -eq 0 ]; then wait; fi
  done
done
wait
echo ALL-DONE
