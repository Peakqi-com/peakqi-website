await new Promise(r=>setTimeout(r,2000));
return document.querySelector('#q img, #q canvas')?'qr rendered':'FAIL';
