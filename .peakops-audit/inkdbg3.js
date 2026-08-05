await new Promise((r) => setTimeout(r, 1400));
return JSON.stringify({ dbg: window.__inkDbg || null, list: window.__inkList || [] });
