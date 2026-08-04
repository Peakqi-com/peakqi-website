scrollTo(0, 0); await new Promise(r => setTimeout(r, 900));
const pick = (txt) => Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === txt);
const a = pick('PAIN POINTS'), b = pick('CAPTURE / FOLLOW / NURTURE');
const R = (el) => el ? Math.round(el.getBoundingClientRect().left) : null;
return JSON.stringify({ vw: innerWidth, painLeft: R(a), flowLeft: R(b), same: R(a) === R(b) });
