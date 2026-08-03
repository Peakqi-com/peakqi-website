// 複驗 probe:額外 settle 1500ms 排除過場瞬間,回報 scroll 狀態
await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<10;i++) await new Promise(r=>requestAnimationFrame(r));
return JSON.stringify({y:scrollY, iw:innerWidth, ih:innerHeight, sh:document.body.scrollHeight});
