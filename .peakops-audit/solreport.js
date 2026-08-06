await new Promise((r)=>setTimeout(r,2600));
return JSON.stringify({
  engineLoaded: !!window.__pqSol,
  report: window.__pqSol ? window.__pqSol.report : null,
  secExists: { follow: !!document.querySelector('#follow'), modules: !!document.querySelector('#modules') },
  counts: { fcol: document.querySelectorAll('#follow [data-fcol]').length, smod: document.querySelectorAll('#modules [data-smod]').length }
});
