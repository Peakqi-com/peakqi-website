// p-risk 與上一個 section 的間距
const sec = document.querySelector('#p-risk');
const h2 = sec.querySelector('h2');
sec.scrollIntoView();
scrollBy(0, -110);
await new Promise(r => setTimeout(r, 900));
for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r));
const prev = sec.previousElementSibling;
const pr = prev.getBoundingClientRect(), hr = h2.getBoundingClientRect();
return JSON.stringify({ prevBottom: Math.round(pr.bottom), h2Top: Math.round(hr.top), gap: Math.round(hr.top - pr.bottom) });
