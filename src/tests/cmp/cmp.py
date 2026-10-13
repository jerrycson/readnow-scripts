import os,re,sys
B,N=sys.argv[1],sys.argv[2]
def norm(t):
    t=re.sub(r'\d{4}-\d{2}-\d{2}T[\d:.]+Z?','<TS>',t)
    t=re.sub(r'\b\d+(\.\d+)?ms\b','<ms>',t)
    t=re.sub(r'\b\d{1,2}:\d{2}(:\d{2})?\b','<hm>',t)
    t=re.sub(r'◐','',t)
    t=re.sub(r'\b(ppt|reg|b|s|c)_\d{10,}\w*','<id>',t)
    t=re.sub(r'\d+초 전|\d+분 전','<ago>',t)
    return t
for f in sorted(os.listdir(B)):
    if f.startswith('_'): continue
    if not os.path.exists(os.path.join(N,f)): print('MISSING',f); continue
    a=norm(open(os.path.join(B,f),errors='replace').read()); b=norm(open(os.path.join(N,f),errors='replace').read())
    if a!=b:
        al=a.split('\n'); bl=b.split('\n')
        diffs=[(x,y) for x,y in zip(al,bl) if x!=y]
        print('==',f,'lines',len(al),len(bl),'difflines',len(diffs))
        for x,y in diffs[:1]:
            # show around first diff char
            i=next((k for k in range(min(len(x),len(y))) if x[k]!=y[k]),0)
            print('  B:',x[max(0,i-80):i+160]); print('  N:',y[max(0,i-80):i+160])
