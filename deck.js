window.ASSETS={"option_1_view_1.png":"img/full/option_1_view_1.png","option_1_view_2.png":"img/full/option_1_view_2.png","option_1_view_3.png":"img/full/option_1_view_3.png","option_1_view_4.png":"img/full/option_1_view_4.png","option_1_view_5.png":"img/full/option_1_view_5.png","option_1_view_7.png":"img/full/option_1_view_7.png","option_2_view_1.png":"img/full/option_2_view_1.png","option_2_view_2.png":"img/full/option_2_view_2.png","option_2_view_3.png":"img/full/option_2_view_3.png","option_2_view_4.png":"img/full/option_2_view_4.png","option_2_view_5.png":"img/full/option_2_view_5.png","option_2_view_7.png":"img/full/option_2_view_7.png","option_3_view_1.png":"img/full/option_3_view_1.png","option_3_view_2.png":"img/full/option_3_view_2.png","option_3_view_3.png":"img/full/option_3_view_3.png","option_3_view_4.png":"img/full/option_3_view_4.png","option_3_view_5.png":"img/full/option_3_view_5.png","option_3_view_7.png":"img/full/option_3_view_7.png"};
/* LJC Innovation Lab — deck behaviour. Progressive enhancement: the page reads fully without this file. */
(function(){
  function asset(n){ return (window.ASSETS&&window.ASSETS[n])||("assets/"+n); }
  var html=document.documentElement, body=document.body;
  var sheets=[].slice.call(document.querySelectorAll(".sheet"));
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DECK=innerWidth>=900;
  var cur=0, busy=false;

  /* ---------- reveals ---------- */
  function reveal(sheet){
    var els=sheet.querySelectorAll(".lab-rv");
    els.forEach(function(el,i){ el.classList.remove("in"); el.style.transitionDelay=(i*70)+"ms"; });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ els.forEach(function(el){ el.classList.add("in"); }); }); });
  }
  if(!DECK){
    try{
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }); },{threshold:.08});
      document.querySelectorAll(".lab-rv").forEach(function(el){ io.observe(el); });
    }catch(e){ document.querySelectorAll(".lab-rv").forEach(function(el){ el.classList.add("in"); }); }
  }

  /* ---------- deck navigation ---------- */
  var dots=document.getElementById("dots"), prog=document.getElementById("prog");
  var menu=document.getElementById("menu"), menuCols=document.getElementById("menuCols");
  if(DECK){
    html.classList.add("deck");
    sheets.forEach(function(s,i){
      var d=document.createElement("span"); d.title=s.dataset.title; d.addEventListener("click",function(e){ if(e.isTrusted) nav(i); }); dots.appendChild(d);
    });
    // index overlay
    var half=Math.ceil(sheets.length/2), colA=document.createElement("div"), colB=document.createElement("div");
    sheets.forEach(function(s,i){
      var a=document.createElement("a"); a.className="lab-index"; a.href="#"+s.id;
      a.innerHTML='<span class="num">'+String(i).padStart(2,"0")+'</span><span class="name">'+s.dataset.title+'</span><span class="lab-kicker">Sheet</span>';
      a.addEventListener("click",function(e){ e.preventDefault(); if(!e.isTrusted) return; closeMenu(); nav(i); });
      (i<half?colA:colB).appendChild(a);
    });
    menuCols.appendChild(colA); menuCols.appendChild(colB);
  }
  function show(i,instant){
    sheets.forEach(function(s,k){ s.classList.toggle("on",k===i); if(k===i) s.scrollTop=0; });
    cur=i;
    [].forEach.call(dots.children,function(d,k){ d.classList.toggle("on",k===i); });
    prog.style.width=((i+1)/sheets.length*100)+"%";
    [].forEach.call(menuCols.querySelectorAll(".lab-index"),function(a,k){ a.classList.toggle("here",k===i); });
    try{ history.replaceState(null,"","#s"+String(i).padStart(2,"0")); }catch(e){}
    reveal(sheets[i]);
    onSheet(i);
  }
  // navigation is only honoured from the deck's own controls / keys / wheel / swipe — any host-injected click-to-advance is ignored
  var navOK=false; function nav(i){ navOK=true; try{ go(i); } finally{ navOK=false; } }
  function go(i){
    if(!navOK) return;
    if(!DECK){ var t=sheets[i]; if(t) t.scrollIntoView({behavior:"smooth"}); return; }
    if(busy||i<0||i>=sheets.length||i===cur) return;
    if(reduce){ show(i); return; }
    busy=true;
    html.classList.remove("wipe"); void html.offsetWidth; html.classList.add("wipe");
    setTimeout(function(){ show(i); },400);
    setTimeout(function(){ html.classList.remove("wipe"); busy=false; },900);
  }
  function openMenu(){ menu.classList.add("open"); menu.setAttribute("aria-hidden","false"); document.getElementById("burger").classList.add("open"); }
  function closeMenu(){ menu.classList.remove("open"); menu.setAttribute("aria-hidden","true"); document.getElementById("burger").classList.remove("open"); }
  document.getElementById("idxBtn").addEventListener("click",openMenu);
  document.getElementById("burger").addEventListener("click",function(){ menu.classList.contains("open")?closeMenu():openMenu(); });
  var mc=document.getElementById("menuClose"); if(mc) mc.addEventListener("click",closeMenu);
  document.getElementById("prev").addEventListener("click",function(e){ if(e.isTrusted) nav(cur-1); });
  document.getElementById("next").addEventListener("click",function(e){ if(e.isTrusted) nav(cur+1); });
  document.querySelectorAll("[data-go]").forEach(function(a){ a.addEventListener("click",function(e){ e.preventDefault(); if(e.isTrusted) nav(+a.dataset.go); }); });

  addEventListener("keydown",function(e){
    if(!e.isTrusted||e.target.tagName==="INPUT") return;
    var lbOpen=lb.classList.contains("open"), mOpen=menu.classList.contains("open");
    if(e.key==="Escape"){ if(lbOpen) closeLb(); else if(mOpen) closeMenu(); return; }
    if(lbOpen) return;
    if(e.key.toLowerCase()==="m"){ mOpen?closeMenu():openMenu(); return; }
    if(mOpen) return;
    if(!DECK) return;
    if(e.key==="ArrowRight"||e.key==="PageDown"||e.key==="ArrowDown"){ e.preventDefault(); nav(cur+1); }
    else if(e.key==="ArrowLeft"||e.key==="PageUp"||e.key==="ArrowUp"){ e.preventDefault(); nav(cur-1); }
    else if(e.key==="Home"){ nav(0); } else if(e.key==="End"){ nav(sheets.length-1); }
  });
  // wheel: scroll down → next sheet, scroll up → previous (inner content scrolls first)
  var wheelLock=0;
  addEventListener("wheel",function(e){
    if(!e.isTrusted||!DECK||menu.classList.contains("open")||lb.classList.contains("open")) return;
    if(e.target.closest&&e.target.closest("#stair3d,#wave-wall-diagram")) return; // 3D viewers own the wheel for zoom
    var s=sheets[cur], canScroll=s.scrollHeight-s.clientHeight>40;
    var atEnd=s.scrollTop+s.clientHeight>=s.scrollHeight-4, atTop=s.scrollTop<=4;
    if(canScroll && ((e.deltaY>0&&!atEnd)||(e.deltaY<0&&!atTop))) return;
    var now=Date.now(); if(now-wheelLock<1100||Math.abs(e.deltaY)<24) return;
    wheelLock=now; nav(cur+(e.deltaY>0?1:-1));
  },{passive:true});
  // touch swipe
  var tx=null,ty=null;
  addEventListener("touchstart",function(e){ tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
  addEventListener("touchend",function(e){
    if(tx===null||!DECK) return; var dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null;
    if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4) nav(cur+(dx<0?1:-1));
  },{passive:true});
  // swallow any click-to-advance a presenter host may add on the document
  addEventListener("click",function(e){ if(e.button===0&&!e.target.closest("button,a,input,.hot,.lab-dots span,.cmp,img[data-cap],.lab-index,li,.pick")) e.stopPropagation(); });
  addEventListener("pointerup",function(e){ if(e.button===0&&!e.target.closest("button,a,input,.hot,.lab-dots span,.cmp,img[data-cap],.lab-index,li,.pick")) e.stopPropagation(); });
  addEventListener("mouseup",function(e){ if(e.button===0&&!e.target.closest("button,a,input,.hot,.lab-dots span,.cmp,img[data-cap],.lab-index,li,.pick")) e.stopPropagation(); });

  /* ---------- custom pointer ---------- */
  var curEl=document.getElementById("cur");
  if(curEl&&matchMedia("(pointer:fine)").matches){
    addEventListener("pointermove",function(e){ curEl.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"; curEl.classList.remove("hide");
      curEl.classList.toggle("hov",!!(e.target&&e.target.closest&&e.target.closest("button,a,.hot,.lab-dots span,.cmp,img[data-cap],.lab-index"))); },{passive:true});
    addEventListener("pointerdown",function(){ curEl.classList.add("down"); },{passive:true});
    addEventListener("pointerup",function(){ curEl.classList.remove("down"); },{passive:true});
    document.documentElement.addEventListener("pointerleave",function(){ curEl.classList.add("hide"); });
  }

  /* ---------- ripple (buttons and links only) ---------- */
  addEventListener("pointerdown",function(e){
    if(reduce||!e.target.closest("button,a,.hot,.lab-dots span")) return; var p=document.createElement("div"); p.className="lab-ping";
    p.style.left=e.clientX+"px"; p.style.top=e.clientY+"px"; body.appendChild(p); setTimeout(function(){ p.remove(); },600);
  },{passive:true});

  /* ---------- axon wall renderer (cover + finale): real DXF layers in parallel projection ---------- */
  var wallData=null, wallWaiters=[];
  fetch("img/wall_layers2.json").then(function(r){ return r.json(); }).then(function(w){ wallData={curves:w.curves,aspect:.75,depthRatio:w.depth/w.width}; wallWaiters.forEach(function(f){ f(); }); });
  function makeWall(o){
    var cv=o.canvas, ctx=cv.getContext("2d"), read=o.read, mode=o.mode, on=false, raf=null, W=0, H=0, sheet=cv.parentNode;
    var AX=-Math.PI/4, yaw=AX, yawT=AX, pitch=.52, layer=22, layerT=22, t0=0, lastMove=-1e9, offset=null, idle=true, drag=null;
    var printed=0, printedT=0, band=-1, bands=4, doneFired=false;
    function size(){ var r=cv.parentNode.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*devicePixelRatio; cv.height=H*devicePixelRatio; cv.style.width=W+"px"; cv.style.height=H+"px"; }
    addEventListener("resize",function(){ if(on) size(); });
    function local(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
    function proj(X,Y,Z){ var SC=Math.min(W*(o.scw||.19),H*(o.sch||.3)), CX=W*(o.cx||.72), CY=H*(o.cy||.52); var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch); var x1=X*cy-Y*sy,y1=X*sy+Y*cy; var z1=Z*cp-y1*sp,y2=Z*sp+y1*cp; return [CX+x1*SC, CY-z1*SC+.35*SC, 4.2+y2]; }
    sheet.addEventListener("pointerdown",function(e){ if(e.button!==0||!on) return; var p=local(e); drag={x:p.x,yaw:yaw}; });
    function endDrag(){ if(!drag) return; drag=null; idle=true; lastMove=performance.now(); }
    sheet.addEventListener("pointerup",endDrag); sheet.addEventListener("pointercancel",endDrag); sheet.addEventListener("pointerleave",endDrag);
    sheet.addEventListener("pointermove",function(e){ if(!on||!wallData) return; var p=local(e), now=performance.now(); lastMove=now;
      if(drag){ yawT=drag.yaw+(p.x-drag.x)/W*Math.PI*2; idle=false; return; }
      if(idle){ offset=yaw-(p.x/W-.5)*Math.PI; idle=false; } yawT=offset+(p.x/W-.5)*Math.PI;
      if(mode==="slice") layerT=Math.round((1-Math.min(1,Math.max(0,(p.y/H-.25)/.5)))*(wallData.curves.length-1)); });
    function draw(now){
      if(!on){ raf=null; return; }
      ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); ctx.clearRect(0,0,W,H);
      if(wallData){
        var n=wallData.curves.length, reveal, L=-1, bandSize=n/bands;
        if(!drag&&now-lastMove>700){ idle=true; yawT=yaw+.004; } yaw+=(yawT-yaw)*(idle?1:drag?.25:.08);
        if(mode==="slice"){ reveal=reduce?1:Math.min(1,(now-t0)/2000); layer+=(layerT-layer)*.2; L=Math.round(layer); }
        else { printed+=(printedT-printed)*(reduce?1:.045); if(printedT-printed<.02) printed=printedT; reveal=printed>0?(printed-1)/(n-1):-1; L=Math.round(printed)-1; }
        var HGT=2*wallData.aspect, DEP=2*wallData.depthRatio*1.6;
        var P=function(q,fy){ return proj(q[0]*2-1,(q[1]-.5)*DEP,fy*HGT); };
        ctx.strokeStyle="rgba(12,25,38,.2)"; ctx.lineWidth=1; ctx.beginPath(); var g=[proj(-1.15,-.3,0),proj(1.15,-.3,0),proj(1.15,.3,0),proj(-1.15,.3,0)]; ctx.moveTo(g[0][0],g[0][1]); g.forEach(function(p){ ctx.lineTo(p[0],p[1]); }); ctx.closePath(); ctx.stroke();
        for(var k=0;k<n;k++){ var fy=k/(n-1), c=wallData.curves[k], ghost=fy>reveal+1e-6;
          if(ghost&&mode==="slice") break;
          ctx.beginPath(); var dSum=0;
          for(var i=0;i<c.length;i++){ var p=P(c[i],fy); dSum+=p[2]; i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }
          if(ghost){ ctx.strokeStyle="rgba(12,25,38,.06)"; ctx.lineWidth=1; ctx.stroke(); continue; }
          var a=Math.max(.14,Math.min(.5,.58-(dSum/c.length-3.6)*.5)), f=0, hot=false;
          if(mode==="slice"){ var dk=Math.abs(k-L); hot=dk===0; f=dk===0?1:dk<=3?(1-dk/4):0; }
          else if(band>=0){ var b0=Math.floor(band*bandSize), b1=Math.ceil((band+1)*bandSize)-1; if(k>=b0&&k<=b1){ var edge=Math.min(k-b0,b1-k); f=edge>=2?1:.5+edge*.25; } }
          ctx.strokeStyle=hot?"#2E6E99":f>0?"rgba(46,110,153,"+(a+(.9-a)*f).toFixed(2)+")":"rgba(12,25,38,"+a.toFixed(2)+")"; ctx.lineWidth=hot?2.2:1+f*.6; ctx.stroke(); }
        if(L>=0&&L<n&&(mode==="slice"?L/(n-1)<=reveal:true)){ var z=L/(n-1)*HGT, q=[proj(-1.15,-.3,z),proj(1.15,-.3,z),proj(1.15,.3,z),proj(-1.15,.3,z)];
          ctx.setLineDash([4,5]); ctx.strokeStyle="rgba(46,110,153,.5)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(q[0][0],q[0][1]); q.forEach(function(p){ ctx.lineTo(p[0],p[1]); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle="#0C1926"; ctx.lineWidth=1.2; ctx.beginPath(); q.forEach(function(p){ ctx.moveTo(p[0]-8,p[1]); ctx.lineTo(p[0]+8,p[1]); ctx.moveTo(p[0],p[1]-8); ctx.lineTo(p[0],p[1]+8); }); ctx.stroke(); }
        if(read){ if(mode==="slice") read.innerHTML="Layer "+String(L+1).padStart(2,"0")+" / "+n+"<br><span>Z "+(L/(n-1)*30*.3048).toFixed(2)+" m · 8 in layer</span>";
          else { var dec=Math.round(printedT/bandSize), pl=Math.max(0,Math.round(printed)); read.innerHTML="Decisions "+String(dec).padStart(2,"0")+" / 04<br><span>"+String(pl).padStart(2,"0")+" / "+n+" layers printed</span>";
            var done=printedT>=n&&printed>=n-.5; if(done!==doneFired){ doneFired=done; if(o.onDone) o.onDone(done); } } }
      }
      raf=requestAnimationFrame(draw);
    }
    return {
      start:function(){ if(on) return; on=true; size(); t0=performance.now(); lastMove=-1e9; idle=true; raf=requestAnimationFrame(draw); },
      stop:function(){ on=false; cancelAnimationFrame(raf); raf=null; },
      setPrinted:function(dec){ if(!wallData){ wallWaiters.push(function(){ printedT=Math.round(dec*wallData.curves.length/bands); }); return; } printedT=Math.round(dec*wallData.curves.length/bands); },
      setBand:function(b){ band=b; }
    };
  }
  var coverWall=makeWall({canvas:document.getElementById("cvWall"),read:document.getElementById("wallRead"),mode:"slice"});
  wallWaiters.push(function(){ /* cover starts its own clock on show */ });
  function cover(on){ on?coverWall.start():coverWall.stop(); }
  var askWall=null; // finale diagram is the wave-wall reveal module (ask-reveal.js)
  if(!DECK){ cover(true); if(askWall) askWall.start(); }

  /* ---------- sheet 02: stepper ---------- */
  var steps=[].slice.call(document.querySelectorAll("#steps li")), rail=document.getElementById("rail"), stepT=null, stepI=0, userStep=false;
  var peek=document.getElementById("peek"), peekImgs=[].slice.call(document.querySelectorAll("#peek img")), peekK=document.getElementById("peekK"), peekP=document.getElementById("peekP"), peekGo=document.getElementById("peekGo");
  var peekData=[
    {k:"Preview · Concepts",p:"Conceptual studies in form, generated from the house: curtain, dramatic arc, sound.",n:5,t:"Conceptual studies in form"},
    {k:"Preview · Geometry",p:"The wall panelised through the stair section, Level 1 to Level 3.",n:6,t:"The grand staircase"},
    {k:"Preview · Small prints",p:"Study prints of each concept on the lab printer, compared side by side.",n:5,t:"Conceptual studies in form"},
    {k:"Preview · Partners",p:"Three fabricators already printing at architectural scale.",n:8,t:"Fabricators"},
    {k:"Preview · Workflow",p:"Sketch to toolpath to print, documented so the next component is faster.",n:6,t:"The grand staircase"},
    {k:"Preview · Install",p:"A 1:1 prototype in the RBB lobby, where the whole office walks past it.",n:14,t:"Road to 1:1"}
  ];
  function setPeek(i,animate){
    var d=peekData[i]; if(!d) return;
    peekImgs.forEach(function(im){ im.classList.toggle("on",+im.dataset.s===i); });
    peekK.textContent=d.k; peekP.textContent=d.p; peekGo.dataset.go=d.n; peekGo.href="#s"+String(d.n).padStart(2,"0");
    peekGo.querySelector(".num").textContent=String(d.n).padStart(2,"0"); peekGo.querySelector(".name").textContent=d.t;
    // slide the frame up from under the selected step's column
    var li=steps[i], r=li.getBoundingClientRect(), pr=peek.parentNode.getBoundingClientRect();
    var x=Math.max(0,Math.min(r.left-pr.left,pr.width-peek.offsetWidth));
    if(animate){ peek.classList.remove("in"); peek.style.transition="none"; peek.style.marginLeft=x+"px"; void peek.offsetWidth; peek.style.transition=""; requestAnimationFrame(function(){ peek.classList.add("in"); }); }
    else { peek.style.marginLeft=x+"px"; peek.classList.add("in"); }
  }
  function setStep(i,animate){ stepI=i; steps.forEach(function(li,k){ li.classList.toggle("on",k===i); li.querySelector(".lab-node").classList.toggle("on",k<=i); });
    rail.style.width=(i/(steps.length-1)*100)+"%"; setPeek(i,animate!==false); }
  steps.forEach(function(li,i){ li.addEventListener("click",function(){ userStep=true; clearInterval(stepT); setStep(i,true); }); });
  var stepsBox=document.getElementById("steps");
  function stepAuto(on){ clearInterval(stepT); if(on&&!userStep&&!reduce){ stepT=setInterval(function(){ setStep((stepI+1)%steps.length); },3200); } }
  stepsBox.addEventListener("pointerenter",function(){ clearInterval(stepT); });
  stepsBox.addEventListener("pointerleave",function(){ if(cur===2) stepAuto(true); });
  setStep(0,false);
  addEventListener("resize",function(){ setPeek(stepI,false); });

  /* ---------- sheet 03: concept cycler + linework ---------- */
  var cNames=["01 · Opera curtain","02 · Dramatic arc","03 · Sound waves"], cK=0, cT=null, cUser=false, cBlend=1, cPrevK=0, cBlendT0=0;
  var cstage=document.getElementById("cstage"), cItems=[].slice.call(document.querySelectorAll("#clist .lab-index")), cImgs=[].slice.call(document.querySelectorAll("#cstage .ph img"));
  var cPanes=[].slice.call(document.querySelectorAll("#cstage .pane")), cDots=[].slice.call(document.querySelectorAll("#cDots span"));
  function setConcept(k,dir){
    k=(k+3)%3; if(k===cK&&cBlend>=1) return;
    cstage.classList.toggle("rev",dir<0);
    cImgs=[].slice.call(document.querySelectorAll("#cstage .ph img")); cItems=[].slice.call(document.querySelectorAll("#clist .lab-index"));
    cPanes=[].slice.call(document.querySelectorAll("#cstage .pane")); cDots=[].slice.call(document.querySelectorAll("#cDots span"));
    cImgs.forEach(function(im){ im.classList.toggle("was",im.classList.contains("on")&&+im.dataset.k!==k); im.classList.toggle("on",+im.dataset.k===k); });
    cItems.forEach(function(b){ b.classList.toggle("on",+b.dataset.k===k); });
    cPanes.forEach(function(p){ p.classList.toggle("on",+p.dataset.k===k); });
    cDots.forEach(function(d,i){ d.classList.toggle("on",i===k); });
    document.getElementById("cTag").textContent=cNames[k];
    cPrevK=cK; cK=k; cBlend=0; cBlendT0=performance.now();
  }
  cItems.forEach(function(b){ b.addEventListener("click",function(){ cUser=true; clearInterval(cT); setConcept(+b.dataset.k,+b.dataset.k>cK?1:-1); }); });
  cDots.forEach(function(d,i){ d.addEventListener("click",function(){ cUser=true; clearInterval(cT); setConcept(i,i>cK?1:-1); }); });
  document.getElementById("cPrev").addEventListener("click",function(){ cUser=true; clearInterval(cT); setConcept(cK-1,-1); });
  document.getElementById("cNext").addEventListener("click",function(){ cUser=true; clearInterval(cT); setConcept(cK+1,1); });
  function conceptAuto(on){ clearInterval(cT); if(on&&!cUser&&!reduce){ cT=setInterval(function(){ setConcept(cK+1,1); },5200); } }
  cstage.addEventListener("pointerenter",function(){ clearInterval(cT); });
  cstage.addEventListener("pointerleave",function(){ if(cur===3) conceptAuto(true); });
  // background linework: one drawing per concept, cross-faded on change
  var cv3=document.getElementById("cv3"), ctx3=cv3.getContext("2d"), bg3On=false, raf3=null, t3=performance.now();
  function size3(){ var r=cv3.parentNode.getBoundingClientRect(); cv3.width=r.width*devicePixelRatio; cv3.height=r.height*devicePixelRatio; cv3.style.width=r.width+"px"; cv3.style.height=r.height+"px"; }
  size3(); addEventListener("resize",size3);
  var lineArt=[
    function(W,H,t,a){ // curtain: vertical folds, gathered
      var gap=26, n=Math.ceil(W/gap)+2; ctx3.lineWidth=1;
      for(var i=0;i<n;i++){
        var x0=i*gap+Math.sin(i*.9)*7, g=Math.sin(i*.37+1)*.5+.5;
        ctx3.beginPath();
        for(var y=-10;y<=H+10;y+=8){
          var s=Math.sin(y*.011+i*.55+t*.25), x=x0+s*(14+g*14)*(.35+.65*(y/H));
          y===-10?ctx3.moveTo(x,y):ctx3.lineTo(x,y);
        }
        ctx3.strokeStyle=i%7===3?"rgba(46,110,153,"+(.22*a)+")":"rgba(12,25,38,"+(.13*a)+")"; ctx3.stroke();
      }
      // swag: three shallow catenaries across the top
      for(var k=0;k<3;k++){ ctx3.beginPath(); for(var x=0;x<=W;x+=10){ var u=(x/W)*Math.PI*3; var y=40+k*22+Math.abs(Math.sin(u))*(60+k*18)+Math.sin(t*.4+k)*3; x===0?ctx3.moveTo(x,y):ctx3.lineTo(x,y);} ctx3.strokeStyle="rgba(12,25,38,"+(.16*a)+")"; ctx3.stroke(); }
    },
    function(W,H,t,a){ // dramatic arc: calm, turbulent, calm across the width
      var gap=15, n=Math.ceil(H/gap)+1; ctx3.lineWidth=1;
      for(var i=0;i<n;i++){
        var y0=i*gap+6, peak=0; ctx3.beginPath();
        for(var x=0;x<=W;x+=6){
          var u=(x-W*.52)/(W*.16), env=Math.exp(-u*u), tur=Math.sin(x*.028+i*.7+t*.9)*Math.sin(x*.011-i*.3+t*.5);
          var y=y0+tur*env*42+Math.sin(x*.004+i*.2+t*.3)*1.8; peak=Math.max(peak,env);
          x===0?ctx3.moveTo(x,y):ctx3.lineTo(x,y);
        }
        ctx3.strokeStyle="rgba(12,25,38,"+(.13*a)+")"; ctx3.stroke();
      }
      [1/3,2/3].forEach(function(f){ ctx3.beginPath(); ctx3.moveTo(W*f,0); ctx3.lineTo(W*f,H); ctx3.strokeStyle="rgba(46,110,153,"+(.28*a)+")"; ctx3.setLineDash([3,7]); ctx3.stroke(); ctx3.setLineDash([]); });
    },
    function(W,H,t,a){ // sound: a ribbon of waves with a softer bounce beneath
      ctx3.lineWidth=1;
      for(var i=0;i<28;i++){
        ctx3.beginPath();
        for(var x=0;x<=W;x+=6){
          var amp=(H*.16)*Math.sin(x*.0028+t*.22+i*.02)*(1-Math.abs(i-14)/22);
          var y=H*.46+i*3.2+Math.sin(x*.0085+t*.75+i*.09)*amp;
          x===0?ctx3.moveTo(x,y):ctx3.lineTo(x,y);
        }
        ctx3.strokeStyle=i===14?"rgba(46,110,153,"+(.3*a)+")":"rgba(12,25,38,"+(.12*a)+")"; ctx3.stroke();
      }
      for(var j=0;j<10;j++){ ctx3.beginPath(); for(var x=0;x<=W;x+=8){ var y=H*.84+j*5+Math.sin(x*.0085+t*.75+j*.09+Math.PI)*(H*.05)*Math.sin(x*.0028+t*.22); x===0?ctx3.moveTo(x,y):ctx3.lineTo(x,y);} ctx3.strokeStyle="rgba(12,25,38,"+(.07*a)+")"; ctx3.stroke(); }
    }
  ];
  function draw3(now){
    var W=cv3.width/devicePixelRatio, H=cv3.height/devicePixelRatio, t=(now-t3)/1000;
    ctx3.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); ctx3.clearRect(0,0,W,H);
    if(cBlend<1) cBlend=Math.min(1,(now-cBlendT0)/900);
    var e=cBlend<.5?2*cBlend*cBlend:1-Math.pow(-2*cBlend+2,2)/2;
    if(e<1&&cPrevK!==cK) lineArt[cPrevK](W,H,t,1-e);
    lineArt[cK](W,H,t,e);
    if(bg3On&&!reduce) raf3=requestAnimationFrame(draw3);
  }
  function bg3(on){ bg3On=on; cancelAnimationFrame(raf3); if(on){ size3(); raf3=requestAnimationFrame(draw3); } }
  if(!DECK){ bg3(true); conceptAuto(true); }
  cImgs.forEach(function(im){ im.addEventListener("click",function(e){ if(!im.classList.contains("on")) e.stopImmediatePropagation(); },true); });

  /* ---------- sheet 04: site hotspots ---------- */
  var siteNames={entry:"A · Main entrance",bar:"B · Bar wall",stair:"C · Main staircase"};
  function setSite(k){
    document.querySelectorAll("[data-site]").forEach(function(el){ el.classList.toggle("on",el.dataset.site===k); });
    document.getElementById("axonTag").textContent=siteNames[k];
    document.getElementById("axonRec").style.display=k==="stair"?"":"none";
  }
  document.querySelectorAll(".hot,#siteOpts button").forEach(function(b){ b.addEventListener("click",function(){ setSite(b.dataset.site); }); });

  /* ---------- sheet 05: concept tabs + arc tracing ---------- */
  var concepts=document.querySelectorAll(".concept"), tabs=document.querySelectorAll("#tabs button");
  tabs.forEach(function(b){ b.addEventListener("click",function(){
    tabs.forEach(function(x){ x.classList.toggle("on",x===b); });
    concepts.forEach(function(c){ c.classList.remove("on","in"); });
    var c=document.querySelector('.concept[data-c="'+b.dataset.c+'"]'); c.classList.add("on");
    c.style.transitionDelay="0ms"; requestAnimationFrame(function(){ c.classList.add("in"); });
  }); });
  var arcKeys=document.querySelectorAll("#arcKey span");
  document.querySelectorAll('.concept[data-c="1"] figure').forEach(function(f){
    f.addEventListener("pointerenter",function(){ arcKeys.forEach(function(k){ k.classList.toggle("on",k.dataset.a===f.dataset.a); }); });
    f.addEventListener("pointerleave",function(){ arcKeys.forEach(function(k){ k.classList.remove("on"); }); });
  });

  /* ---------- sheet 06: compare slider ---------- */
  var cmp=document.getElementById("cmp"), cmpA=document.getElementById("cmpA"), cmpB=document.getElementById("cmpB"), hnd=document.getElementById("hnd"), cmpR=document.getElementById("cmpR");
  function setCmp(p){ p=Math.max(0,Math.min(100,p)); cmpA.style.clipPath="inset(0 "+(100-p)+"% 0 0)"; hnd.style.left=p+"%"; cmpR.value=p; }
  var dragging=false;
  function fromEvent(e){ var r=cmp.getBoundingClientRect(); setCmp((e.clientX-r.left)/r.width*100); }
  cmp.addEventListener("pointerdown",function(e){ dragging=true; cmp.setPointerCapture(e.pointerId); fromEvent(e); });
  cmp.addEventListener("pointermove",function(e){ if(dragging) fromEvent(e); });
  cmp.addEventListener("pointerup",function(){ dragging=false; });
  cmp.addEventListener("pointercancel",function(){ dragging=false; });
  cmpR.addEventListener("input",function(){ setCmp(+cmpR.value); });
  setCmp(50);
  var viewBtns=document.querySelectorAll("#views button"), viewAlt={1:"looking up the stair",2:"climbing the stair",3:"from the lobby",4:"at the landing",5:"on the upper flight",7:"in section"};
  var optNames={1:"Curtain",2:"Wave",3:"Dramatic arc"}, cmpV="3", cmpOpt={a:"1",b:"2"};
  var pickA=document.getElementById("pickA"), pickB=document.getElementById("pickB");
  function paintPicks(){
    [["a",pickA],["b",pickB]].forEach(function(pr){ var side=pr[0], box=pr[1]; box.querySelectorAll("button").forEach(function(x){
      var o=x.dataset.o; x.classList.toggle("on",o===cmpOpt[side]); x.disabled=(o===cmpOpt[side==="a"?"b":"a"]); }); });
    cmpR.setAttribute("aria-label","Compare "+optNames[cmpOpt.a]+" and "+optNames[cmpOpt.b]);
  }
  function loadCmp(fade){
    var go=function(){ cmpA.src=asset("option_"+cmpOpt.a+"_view_"+cmpV+".png"); cmpB.src=asset("option_"+cmpOpt.b+"_view_"+cmpV+".png");
      cmpA.alt=optNames[cmpOpt.a]+" study "+viewAlt[cmpV]; cmpB.alt=optNames[cmpOpt.b]+" study "+viewAlt[cmpV]; cmp.style.transition="opacity .45s ease"; cmp.style.opacity=1; };
    if(fade){ cmp.style.opacity=0; setTimeout(go,180); } else go();
    paintPicks();
  }
  viewBtns.forEach(function(b){ b.addEventListener("click",function(){
    viewBtns.forEach(function(x){ x.classList.toggle("on",x===b); }); cmpV=b.dataset.v; loadCmp(true);
  }); });
  [["a",pickA],["b",pickB]].forEach(function(pr){ var side=pr[0]; pr[1].querySelectorAll("button").forEach(function(x){ x.addEventListener("click",function(e){ e.stopPropagation(); if(x.disabled||x.dataset.o===cmpOpt[side]) return; cmpOpt[side]=x.dataset.o; loadCmp(true); }); }); });
  [pickA,pickB].forEach(function(box){ box.addEventListener("pointerdown",function(e){ e.stopPropagation(); }); });
  paintPicks();
  // preload the other cameras
  [1,2,3,4,5,7].forEach(function(v){ ["1","2","3"].forEach(function(o){ var im=new Image(); im.src=asset("option_"+o+"_view_"+v+".png"); }); });

  /* ---------- sheet 07: partner picker + carousel ---------- */
  var pNames=["A · Circdal · Printerior","B · Pikus 3D","C · Branch Technology"], pP=2, pI=0, pT=null, pUser=false;
  var pcar=document.getElementById("pcar");
  function pCount(p){ return document.querySelectorAll('#pcar .ph img[data-p="'+p+'"]').length; }
  function showPartnerImg(p,i,dir){
    var n=pCount(p); i=(i+n)%n;
    pcar.classList.toggle("rev",dir<0);
    document.querySelectorAll("#pcar .ph img").forEach(function(im){ var hit=+im.dataset.p===p&&+im.dataset.i===i; im.classList.toggle("was",im.classList.contains("on")&&!hit); im.classList.toggle("on",hit); });
    document.querySelectorAll("#plist .lab-index").forEach(function(b){ b.classList.toggle("on",+b.dataset.p===p); });
    document.querySelectorAll("#pThumbs .set").forEach(function(s){ s.classList.toggle("on",+s.dataset.p===p); s.querySelectorAll("button").forEach(function(b){ b.classList.toggle("on",+s.dataset.p===p&&+b.dataset.i===i); }); });
    document.getElementById("pTag").textContent=pNames[p];
    document.getElementById("pCount").textContent=String(i+1).padStart(2,"0")+" / "+String(n).padStart(2,"0");
    pP=p; pI=i;
  }
  function pStop(){ pUser=true; clearInterval(pT); }
  document.querySelectorAll("#plist .lab-index").forEach(function(b){ b.addEventListener("click",function(){ pStop(); if(+b.dataset.p!==pP) showPartnerImg(+b.dataset.p,0,+b.dataset.p>pP?1:-1); }); });
  document.querySelectorAll("#pThumbs .set").forEach(function(s){ s.querySelectorAll("button").forEach(function(b){ b.addEventListener("click",function(){ pStop(); showPartnerImg(+s.dataset.p,+b.dataset.i,+b.dataset.i>=pI?1:-1); }); }); });
  document.getElementById("pPrev").addEventListener("click",function(){ pStop(); showPartnerImg(pP,pI-1,-1); });
  document.getElementById("pNext").addEventListener("click",function(){ pStop(); showPartnerImg(pP,pI+1,1); });
  function partnerAuto(on){ clearInterval(pT); if(on&&!pUser&&!reduce){ pT=setInterval(function(){ showPartnerImg(pP,pI+1,1); },4200); } }
  pcar.addEventListener("pointerenter",function(){ clearInterval(pT); });
  pcar.addEventListener("pointerleave",function(){ if(cur===8) partnerAuto(true); });
  document.querySelectorAll("#pcar .ph img").forEach(function(im){ im.addEventListener("click",function(e){ if(!im.classList.contains("on")) e.stopImmediatePropagation(); },true); });
  if(!DECK) partnerAuto(true);

  /* ---------- sheet 09: Branch options ---------- */
  var bopts=document.getElementById("bopts");
  if(bopts){
    var bBtns=[].slice.call(bopts.querySelectorAll("button")), bPanes=[].slice.call(document.querySelectorAll("#bstage .pane, #bwhy .pane")), bRows=[].slice.call(bopts.closest(".sheet").querySelectorAll(".bcost tr")), bO=0, bT=null, bUser=false;
    function setO(i){ bO=i; bBtns.forEach(function(b,k){ b.classList.toggle("on",k===i); }); bPanes.forEach(function(p){ p.classList.toggle("on",+p.dataset.o===i); });
      bRows.forEach(function(r){ [].slice.call(r.children).forEach(function(c,k){ if(c.colSpan>1) return; c.classList.toggle("hl",k===i+1); }); }); }
    bBtns.forEach(function(b){ b.addEventListener("click",function(e){ e.stopPropagation(); bUser=true; clearInterval(bT); setO(+b.dataset.o); }); });
    function branchAuto(on){ clearInterval(bT); if(on&&!bUser&&!reduce){ bT=setInterval(function(){ setO((bO+1)%3); },5200); } }
    bopts.addEventListener("pointerenter",function(){ clearInterval(bT); });
    bopts.addEventListener("pointerleave",function(){ if(cur===12) branchAuto(true); });
    setO(0); if(!DECK) branchAuto(true);
  } else { var branchAuto=function(){}; }

  /* ---------- sheet 14: roadmap stage picker ---------- */
  var road=document.getElementById("road");
  if(road){
    var rItems=[].slice.call(road.querySelectorAll(":scope>div")), rProg=document.getElementById("roadProg");
    function setStage(k){
      rItems.forEach(function(d,i){ d.classList.toggle("on",i===k); d.classList.toggle("done",i<k); d.querySelector(".lab-node").classList.toggle("on",i===k); });
      var a=rItems[0].querySelector(".lab-node").getBoundingClientRect(), b=rItems[k].querySelector(".lab-node").getBoundingClientRect();
      rProg.style.setProperty("--w",Math.max(0,(b.left-a.left))+"px");
    }
    rItems.forEach(function(d,i){ d.addEventListener("click",function(e){ e.stopPropagation(); setStage(i); }); });
    addEventListener("resize",function(){ var k=rItems.findIndex(function(d){ return d.classList.contains("on"); }); if(k>0) setStage(k); });
  }

  /* ---------- sheet 12: cost comparison column pick ---------- */
  var ccost=document.getElementById("ccost");
  if(ccost){
    var cRows=[].slice.call(ccost.querySelectorAll("tr")), cHead=[].slice.call(ccost.querySelectorAll("th"));
    function setCol(k){ cRows.forEach(function(r){ [].slice.call(r.children).forEach(function(c,i){ c.classList.toggle("hl",i===k); }); }); }
    cHead.forEach(function(th,i){ if(i===0) return; th.style.cursor="pointer"; th.addEventListener("click",function(e){ e.stopPropagation(); setCol(i); }); });
    cRows.forEach(function(r){ [].slice.call(r.children).forEach(function(c,i){ if(i===0||c.tagName==="TH") return; c.addEventListener("click",function(e){ e.stopPropagation(); setCol(i); }); }); });
  }

  /* ---------- sheet 10: record answers ---------- */
  var askItems=[].slice.call(document.querySelectorAll("#asks li"));
  function askSync(){ var answered=0; askItems.forEach(function(li){ var any=!!li.querySelector(".pick .on"); li.classList.toggle("on",any); if(any) answered++; }); if(askWall) askWall.setPrinted(answered); }
  document.querySelectorAll("#asks .pick").forEach(function(p){
    var multi=p.children.length>2&&!p.dataset.single;
    [].forEach.call(p.children,function(b){ b.addEventListener("click",function(e){ e.stopPropagation();
      if(multi){ b.classList.toggle("on"); } else { [].forEach.call(p.children,function(x){ x.classList.toggle("on",x===b); }); }
      askSync();
    }); });
  });
  askItems.forEach(function(li,i){ li.addEventListener("pointerenter",function(){ if(askWall) askWall.setBand(i); }); li.addEventListener("pointerleave",function(){ if(askWall) askWall.setBand(-1); }); });

  /* ---------- lightbox ---------- */
  var lb=document.getElementById("lb"), lbImg=document.getElementById("lbImg"), lbP=document.getElementById("lbP"), lbK=document.getElementById("lbK");
  document.querySelectorAll("img[data-cap]").forEach(function(im){ im.addEventListener("click",function(){
    var parts=im.dataset.cap.split(" · "); lbK.textContent=parts.length>1?parts.shift():"Image"; lbP.textContent=parts.join(" · ");
    lbImg.src=im.currentSrc||im.src; lbImg.alt=im.alt; lb.classList.add("open"); lb.setAttribute("aria-hidden","false");
  }); });
  function closeLb(){ lb.classList.remove("open"); lb.setAttribute("aria-hidden","true"); }
  lb.addEventListener("click",closeLb);

  /* ---------- per-sheet hooks ---------- */
  function onSheet(i){
    cover(i===0);
    stepAuto(i===2);
    bg3(i===3); conceptAuto(i===3);
    document.documentElement.classList.toggle("on-cover",i===0);
    partnerAuto(i===8);
    branchAuto(i===12);
    if(window.stairViewer){ i===7?window.stairViewer.start():window.stairViewer.stop(); }
    if(askWall&&DECK){ i===15?askWall.start():askWall.stop(); }
  }
  try{
    if(DECK){ var start=0, m=location.hash.match(/^#s(\d\d)$/); if(m) start=Math.min(sheets.length-1,+m[1]); show(start,true); }
    else { stepAuto(true); }
  }catch(e){ failSafe(); }
})();
/* if the deck script cannot run for any reason, make sure the page still reads */
function failSafe(){
  document.documentElement.classList.remove("deck");
  document.querySelectorAll(".lab-rv").forEach(function(el){ el.classList.add("in"); });
}
window.addEventListener("error",function(){ if(!document.querySelector(".lab-rv.in")) failSafe(); });
setTimeout(function(){ if(!document.querySelector(".lab-rv.in")) failSafe(); },1500);

