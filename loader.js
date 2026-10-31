/* Aradhanawa loading screen: lifts the veil once the page (images, fonts) has loaded.
   Stays at least MIN ms so the lotus can bloom, never longer than MAX ms. */
(function(){
  var el=document.getElementById("aw-loader"); if(!el) return;
  var root=document.documentElement, start=Date.now();
  var MIN=1700, MAX=6000, done=false;
  try{ if(sessionStorage.getItem("aw-ld-seen")) MIN=700; sessionStorage.setItem("aw-ld-seen","1"); }catch(e){}
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) MIN=300;
  root.classList.add("aw-ld-lock");
  function finish(){
    if(done) return; done=true;
    el.classList.add("aw-ld-ready");
    setTimeout(function(){
      el.classList.add("aw-ld-done");
      root.classList.remove("aw-ld-lock");
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 1000);
    }, 380);
  }
  function whenReady(){
    var wait=Math.max(0, MIN-(Date.now()-start));
    var fonts=document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fonts.then(function(){ setTimeout(finish, wait); }, function(){ setTimeout(finish, wait); });
  }
  if(document.readyState==="complete") whenReady(); else window.addEventListener("load", whenReady);
  setTimeout(finish, MAX);
})();
