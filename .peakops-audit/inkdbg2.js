await new Promise((r) => setTimeout(r, 1200));
return JSON.stringify({ dbg: window.__inkDbg || null, uvFixed: window.__uvN || 0 });
