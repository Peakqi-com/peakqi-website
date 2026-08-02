await new Promise(r=>setTimeout(r,2500));
document.querySelector('.pq-bot1').scrollIntoView({block:'center'});
await new Promise(r=>setTimeout(r,1000));
return 'ok';
