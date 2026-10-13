#!/bin/bash
# 사용: run.sh <html> <outdir>  — 회귀 시험 전부를 6개씩 동시에
SP=/tmp/claude-0/-home-claude/2514b938-5524-5e43-ad0a-05319ceb1a3b/scratchpad
F=$1; O=$2; mkdir -p $O
L="$SP/tbatch2.js $SP/tbb.js $SP/tbbuy.js $SP/tbig.js $SP/tbq.js $SP/texp.js $SP/tfbx.js $SP/tgp.js $SP/tmgr.js $SP/tnav.js $SP/tns.js $SP/tobs.js $SP/tobs2.js $SP/tobs3.js $SP/tone.js $SP/tppt2.js $SP/tprc.js $SP/tprog.js $SP/tsame.js $SP/tshard.js $SP/tship9.js $SP/tshipc.js $SP/ttop.js $SP/twsec.js"
for t in $SP/reg/t*.js; do L="$L $t"; done
echo $L | tr ' ' '\n' | xargs -P 6 -I{} bash -c 'n=$(basename {} .js); d=$(dirname {}); [ "$d" != "'$SP'" ] && n=reg_$n; timeout 200 node {} '$F' > '$O'/$n.txt 2>&1; echo "$n $?" >> '$O'/_status.txt'
