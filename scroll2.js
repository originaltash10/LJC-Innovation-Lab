/* LJC Innovation Lab — scroll v2 behaviour: inertial scroll + one RAF that drives every scroll-mapped scene */
(function(){
  var html=document.documentElement, body=document.body, reduce=matchMedia("(prefers-reduced-motion: reduce)").matches, fine=matchMedia("(pointer:fine)").matches;
  html.classList.add("js","sp2","sp-hero");
  var W=innerWidth, H=innerHeight;
  function clamp(v,a,b){ return v<a?a:v>b?b:v; }
  function ease(t){ return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  var $=function(s,r){ return (r||document).querySelector(s); }, $$=function(s,r){ return [].slice.call((r||document).querySelectorAll(s)); };

  /* ---------- inertial wheel scroll (native scroll stays the source of truth) ---------- */
  var smooth=html.dataset.smooth!=="off"&&!reduce&&fine, target=scrollY, cur=scrollY, animating=false, lockY=null;
  function maxY(){ return body.scrollHeight-innerHeight; }
  function step(){ cur+=(target-cur)*.1; if(Math.abs(target-cur)<.4){ cur=target; scrollTo(0,cur); animating=false; return; } scrollTo(0,cur); requestAnimationFrame(step); }
  function kick(){ if(!animating){ animating=true; requestAnimationFrame(step); } }
  addEventListener("wheel",function(e){ if(!smooth||e.ctrlKey) return; if(e.target.closest&&e.target.closest("#stair3d,#wave-wall-diagram,.menu,.lbx")) return; e.preventDefault(); var d=e.deltaY*(e.deltaMode===1?18:e.deltaMode===2?innerHeight:1); if(!animating){ cur=scrollY; target=cur; } target=clamp(target+d,0,maxY()); if(lockY!==null&&target>lockY) target=lockY; kick(); },{passive:false});
  addEventListener("scroll",function(){ if(lockY!==null&&scrollY>lockY+1){ scrollTo(0,lockY); } if(!animating) cur=target=scrollY; },{passive:true});
  function goTo(y){ y=clamp(y,0,maxY()); if(!smooth){ scrollTo({top:y,behavior:reduce?"auto":"smooth"}); return; } cur=scrollY; target=y; kick(); }

  /* ---------- enter reveals ---------- */
  $$(".tl").forEach(function(h){ var out=[], i=0; h.childNodes.forEach(function(nd){ var wrap=function(txt,tag){ txt.split(/(\s+)/).forEach(function(w){ if(/^\s+$/.test(w)){ out.push(" "); return; } if(!w) return; var s='<span class="w"><i style="transition-delay:'+(i*.06)+'s">'+w+'</i></span>'; out.push(tag?"<"+tag+">"+s+"</"+tag+">":s); i++; }); }; if(nd.nodeType===3) wrap(nd.textContent); else wrap(nd.textContent,nd.tagName.toLowerCase()); }); h.innerHTML=out.join(""); });
  // reveals are checked every frame against the viewport and are reversible: scroll back up and they play out again
  var pending=$$("[data-rv],[data-stagger],[data-mask],.tl,.sc-head,.cbars,.xhb");
  function reveals(){ for(var i=0;i<pending.length;i++){ var el=pending[i]; if(!heroReady&&el.closest("#c0")) continue; var r=el.getBoundingClientRect(); el.classList.toggle("in",r.top<H*.92||r.bottom<0); } }
  var heroReady=false; setTimeout(function(){ heroReady=true; lastY=-1; },500);
  var glyphs="0123456789";
  $$(".num-s").forEach(function(el){ el.dataset.final=el.textContent; el.textContent=el.textContent.replace(/\d/g,"0"); });
  function scramble(el){ if(el.dataset.done) return; el.dataset.done=1; var fin=el.dataset.final, t0=performance.now(), dur=1000+Math.random()*500;
    (function tick(now){ var p=Math.min(1,(now-t0)/dur), out=""; for(var k=0;k<fin.length;k++){ var ch=fin[k]; if(!/\d/.test(ch)){ out+=ch; continue; } out+=p>=(k+1)/fin.length*.85?ch:glyphs[Math.floor(Math.random()*10)]; } el.textContent=out; if(p<1) requestAnimationFrame(tick); else el.textContent=fin; })(t0); }
  var ioN=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ scramble(en.target); ioN.unobserve(en.target); } }); },{threshold:.6});
  $$(".num-s").forEach(function(el){ ioN.observe(el); });

  /* ---------- HUD: section label, counter, layer gauge, dots, index ---------- */
  var secs=$$("section.sc"), hudT=$("#hudT"), hudN=$("#hudN"), hudNs=$("span",hudN), hudL=$("#hudL"), hudG=$("#hudG"), dots=$("#hudDots"), dotLinks=[], curSec=-1;
  // later sections paint over earlier ones (covers rise over a held section, the next section slides over the cover)
  $$(".sc,.cover").forEach(function(el,i){ el.style.zIndex=i+1; }); secs.forEach(function(s,i){ s.dataset.from=i%2?"right":"left"; });
  secs.forEach(function(s,i){ var a=document.createElement("a"); a.href="#"+s.id; a.innerHTML='<span class="n">'+(s.dataset.title||"")+'</span><i></i>'; a.addEventListener("click",function(e){ e.preventDefault(); goTo(s.offsetTop); }); dots.appendChild(a); dotLinks.push(a); });
  var menu=$("#menu"), burger=$("#burger"), cols=$("#menuCols");
  secs.forEach(function(s,i){ if(i===0) return; var a=document.createElement("a"); a.className="lab-index"; a.href="#"+s.id; a.innerHTML='<span class="num">'+String(i).padStart(2,"0")+'</span><span class="name">'+s.dataset.title+'</span><span class="lab-kicker">'+(s.dataset.kicker||"")+'</span>'; a.addEventListener("click",function(e){ e.preventDefault(); toggleMenu(false); goTo(s.offsetTop); }); cols.appendChild(a); });
  function toggleMenu(o){ if(o===undefined) o=!menu.classList.contains("open"); menu.classList.toggle("open",o); burger.classList.toggle("open",o); menu.setAttribute("aria-hidden",!o); }
  burger.addEventListener("click",function(){ toggleMenu(); });
  addEventListener("keydown",function(e){ if(e.key==="Escape") toggleMenu(false); });
  function setSec(i){ if(i===curSec) return; curSec=i; var s=secs[i]; hudT.classList.add("swap"); setTimeout(function(){ hudT.textContent=s.dataset.title; hudT.classList.remove("swap"); },220); hudNs.textContent=String(i).padStart(2,"0")+" / "+String(secs.length-1).padStart(2,"0"); hudN.classList.remove("tick"); void hudN.offsetWidth; hudN.classList.add("tick"); dotLinks.forEach(function(a,k){ a.classList.toggle("on",k===i); }); }

  /* ---------- cursor ---------- */
  if(fine&&!reduce&&html.dataset.cursor!=="off"){ var cu=$("#cur"), lbl=$(".lbl",cu); html.classList.add("cursor-on");
    addEventListener("pointermove",function(e){ cu.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"; cu.classList.remove("hide"); var t=e.target.closest&&e.target.closest("[data-cur]"); if(t){ lbl.textContent=t.dataset.cur; cu.classList.add("lbl-on"); cu.classList.remove("hov"); } else { cu.classList.remove("lbl-on"); cu.classList.toggle("hov",!!(e.target.closest&&e.target.closest("a,button,input,.rail span"))); } },{passive:true});
    addEventListener("pointerdown",function(){ cu.classList.add("down"); }); addEventListener("pointerup",function(){ cu.classList.remove("down"); }); document.addEventListener("mouseleave",function(){ cu.classList.add("hide"); }); }

  /* ---------- scenes ---------- */
  var desktop=function(){ return innerWidth>1100; };
  // 00 hero: framed render grows to the viewport edge, then the print head scans the built wall
  // the layered wall: drawn in full on arrival, turns with the pointer, un-prints layer by layer as the render takes over
  var axon=(function(){ var cv=$("#cvWall"), ctx=cv.getContext("2d"), host=cv.parentNode, read=$("#wallRead"), CW=0,CH=0, data=null, yaw=-Math.PI/4, yawT=yaw, pitch=.52, reveal=0, revealT=0, scrollR=1, t0=0, on=true, raf=null, lastMove=-1e9, offset=null, idle=true, drag=null, spinDir=1, lastX=null, scrollP=0;
    fetch("img/wall_layers2.json").then(function(r){ return r.json(); }).then(function(w){ data={curves:w.curves,aspect:.75,depthRatio:w.depth/w.width}; t0=performance.now()+300; });
    function size(){ var r=cv.getBoundingClientRect(); CW=r.width; CH=r.height; var dprW=Math.min(devicePixelRatio||1,2); cv.width=CW*dprW; cv.height=CH*dprW; } size(); addEventListener("resize",size);
    function proj(X,Y,Z){ var por=CW<CH*1.2, SC=por?Math.min(CW*.4,CH*.3):Math.min(CW*.25,CH*.36), CX=por?CW*.5:CW*.6, CY=por?CH*.42:CH*.5; var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch); var x1=X*cy-Y*sy,y1=X*sy+Y*cy; var z1=Z*cp-y1*sp,y2=Z*sp+y1*cp; return [CX+x1*SC, CY-z1*SC+.35*SC, 4.2+y2]; }
    function local(e){ var r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
    host.addEventListener("pointerdown",function(e){ if(e.button!==0||(e.target.closest&&e.target.closest(".frame,.txt,.hud"))) return; var p=local(e); drag={x:p.x,yaw:yaw}; });
    function endDrag(){ if(!drag) return; drag=null; idle=true; lastMove=performance.now(); }
    host.addEventListener("pointerup",endDrag); host.addEventListener("pointercancel",endDrag); host.addEventListener("pointerleave",endDrag);
    host.addEventListener("pointermove",function(e){ if(!data) return; var p=local(e), now=performance.now(); lastMove=now; ptr=p; if(lastX!==null&&Math.abs(p.x-lastX)>1) spinDir=p.x<lastX?1:-1; lastX=p.x; if(drag){ yawT=drag.yaw-(p.x-drag.x)/CW*Math.PI*2; idle=false; return; } if(idle){ offset=yaw+(p.x/CW-.5)*Math.PI; idle=false; } yawT=offset-(p.x/CW-.5)*Math.PI; });
    host.addEventListener("pointerleave",function(){ ptr=null; });
    var ptr=null, Ls=0;
    function draw(now){ if(!on){ raf=null; return; } if(!CW||!CH) size(); var dprD=Math.min(devicePixelRatio||1,2); ctx.setTransform(dprD,0,0,dprD,0,0); ctx.clearRect(0,0,CW,CH);
      if(data&&CW&&CH){ var n=data.curves.length; if(!drag&&now-lastMove>700){ idle=true; yawT=yaw+.004*spinDir; } yaw+=(yawT-yaw)*(idle?1:drag?.25:.08); var intro=reduce?1:clamp((now-t0)/3200,0,1); intro=1-Math.pow(1-intro,2); revealT=Math.min(intro,scrollR); reveal+=(revealT-reveal)*.1; var top=Math.max(0,Math.floor(reveal*(n-1)+1e-6)), Lt=top;
        var HGT=2*data.aspect, DEP=2*data.depthRatio*1.6, P=function(q,fy){ return proj(q[0]*2-1,(q[1]-.5)*DEP,fy*HGT); };
        // the highlighted layer follows the pointer height, but only across layers still printed
        if(ptr&&!drag){ var bd=1e9; for(var kk=0;kk<=top;kk++){ var yy=proj(0,0,kk/(n-1)*HGT)[1]; var dd=Math.abs(yy-ptr.y); if(dd<bd){ bd=dd; Lt=kk; } } }
        if(!fine&&!drag) Lt=top; Ls+=(Lt-Ls)*.25; var L=Math.min(top,Math.round(Ls));
        ctx.strokeStyle="rgba(12,25,38,"+(.3*Math.min(1,reveal*4)).toFixed(2)+")"; ctx.lineWidth=1; ctx.beginPath(); var g=[proj(-1.15,-.3,0),proj(1.15,-.3,0),proj(1.15,.3,0),proj(-1.15,.3,0)]; ctx.moveTo(g[0][0],g[0][1]); g.forEach(function(p){ ctx.lineTo(p[0],p[1]); }); ctx.closePath(); ctx.stroke();
        for(var k=0;k<n;k++){ var fy=k/(n-1); if(fy>reveal+1e-6) break; var c=data.curves[k]; ctx.beginPath(); var dSum=0; var frac=fy+1/(n-1)>reveal?Math.min(1,(reveal-fy)*(n-1)):1, m=Math.max(2,Math.round(c.length*frac));
          for(var i=0;i<m;i++){ var p=P(c[i],fy); dSum+=p[2]; i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); }
          var a=Math.max(.3,Math.min(.72,.78-(dSum/m-3.6)*.5)), dk=Math.abs(k-L), hot=dk===0, f=hot?1:dk<=3?(1-dk/4):0;
          ctx.strokeStyle=hot?"#2E6E99":f>0?"rgba(46,110,153,"+(a+(.9-a)*f).toFixed(2)+")":"rgba(12,25,38,"+a.toFixed(2)+")"; ctx.lineWidth=hot?2.2:1+f*.6; ctx.stroke(); }
        if(reveal>.01){ var z=L/(n-1)*HGT, q=[proj(-1.15,-.3,z),proj(1.15,-.3,z),proj(1.15,.3,z),proj(-1.15,.3,z)]; ctx.setLineDash([4,5]); ctx.strokeStyle="rgba(46,110,153,.5)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(q[0][0],q[0][1]); q.forEach(function(p){ ctx.lineTo(p[0],p[1]); }); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle="#0C1926"; ctx.lineWidth=1.2; ctx.beginPath(); q.forEach(function(p){ ctx.moveTo(p[0]-8,p[1]); ctx.lineTo(p[0]+8,p[1]); ctx.moveTo(p[0],p[1]-8); ctx.lineTo(p[0],p[1]+8); }); ctx.stroke(); }
        read.innerHTML="Layer "+String(L+1).padStart(2,"0")+" / "+n+"<br><span>Z "+(L/(n-1)*30*.3048).toFixed(2)+" m · 8 in layer · "+(scrollP<.02?(intro<1?"printing":"built · drag to turn · hover a layer"):"un-printing")+"</span>"; }
      raf=requestAnimationFrame(draw); }
    raf=requestAnimationFrame(draw);
    return { set:function(p){ scrollP=p; scrollR=reduce?(p<.45?1:0):1-clamp(p/.42,0,1); }, active:function(v){ if(v&&!on){ on=true; raf=requestAnimationFrame(draw); } else if(!v&&on) on=false; } }; })();
  var hero=(function(){ var sec=$("#c0"), frame=$(".frame",sec), plate=$(".plate",sec), img=$("img",frame), txt=$(".txt",sec), scan=$(".scan",sec), scanT=$("span",scan), base={};
    function measure(){ var g=txt.offsetLeft||W*.07; var w=Math.min(W*.26,400,(H*.44)/1.25), h=w*1.25; base={l:W-g-w,t:H-h-96,w:w,h:h}; }
    measure();
    return { measure:measure, update:function(y){ var p=clamp(y/(sec.offsetHeight-H),0,1), e=ease(clamp((p-.42)/.36,0,1)), wash=ease(clamp((p-.36)/.26,0,1)); axon.set(p); axon.active(y<sec.offsetHeight); var out=1-clamp((p-.88)/.1,0,1); frame.style.opacity=wash*out;
      if(base.fw!==W||base.fh!==H){ base.fw=W; base.fh=H; frame.style.left="0px"; frame.style.top="0px"; frame.style.width=W+"px"; frame.style.height=H+"px"; frame.style.transform=""; plate.style.opacity=0; }
      img.style.transform="scale("+(1.1-.1*e)+")";
      var tf=clamp((p-.28)/.16,0,1); txt.style.opacity=1-tf; txt.style.transform="translate("+(-40*tf)+"px,"+(desktop()?"-50%":"0")+")"; txt.style.pointerEvents=tf>.6?"none":"";
      sec.classList.toggle("full",p>.5&&p<.9); var sp=clamp((p-.82)/.17,0,1); sec.classList.toggle("scan-on",p>.82&&p<.995); scan.style.top=(sp*100)+"%"; scanT.textContent="Layer "+String(Math.round(sp*46)).padStart(3,"0")+" / 046 · 8 in"; } }; })();
  // 01 process: pinned; each step slides in from the right and stacks on the pile, the numeral follows the latest arrival
  var proc=(function(){ var sec=$("#c1"), lis=$$("#c1 .steps li"), digs=$$("#c1 .big span"), bar=$("#c1 .prog i"), lab=$("#c1 .prog span"), last=-1;
    return { update:function(){ var T=null, best=0; if(desktop()){ var p=clamp(-sec.getBoundingClientRect().top/(sec.offsetHeight-H),0,1); T=clamp((p-.03)/.9,0,1)*6.3; }
      lis.forEach(function(li,j){ var a=T===null?ease(clamp((H*.9-li.getBoundingClientRect().top)/(H*.22),0,1)):ease(clamp((T-j)/.85,0,1)); li.style.opacity=a.toFixed(3); li.style.transform="translate3d("+((1-a)*70).toFixed(2)+"vw,0,0)"; if(a>.5) best=j; });
      if(best===last) return; last=best; lis.forEach(function(li,j){ li.classList.toggle("on",j===best); li.classList.toggle("dim",j<best); }); digs.forEach(function(d,j){ d.classList.toggle("on",j===best); d.classList.toggle("past",j<best); }); bar.style.setProperty("--w",((best+1)/lis.length*100)+"%"); lab.textContent="Step "+String(best+1).padStart(2,"0")+" / 06"; } }; })();
  // 03 concepts: each study arrives, turns to show its ambient-occlusion face, then the strip moves on
  var film=(function(){ var sec=$("#c3"), strip=$(".film",sec), panels=$$(".cpanel",sec), cards=panels.map(function(p){ return $(".card",p); }), sides=panels.map(function(p){ return $(".side",p); }), rail=$$(".rail span",sec), k=0;
    rail.forEach(function(r,i){ r.addEventListener("click",function(){ var h=sec.offsetHeight-H; goTo(sec.offsetTop+h*(.04+.72*(i/3))+h*.01); }); });
    return { update:function(){ if(!desktop()) return; var rt=sec.getBoundingClientRect().top, raw=clamp((H-rt)/H,0,1), p=clamp(-rt/(sec.offsetHeight-H),0,1); var T=clamp((p-.04)/.72,0,.9999)*3, i=Math.floor(T), u=T-i; k=i+(i<2?ease(clamp((u-.8)/.2,0,1)):0); var pw=panels[0].offsetWidth, gap=parseFloat(getComputedStyle(strip).gap)||0; strip.style.transform="translate3d("+(-k*(pw+gap)).toFixed(1)+"px,0,0)";
      panels.forEach(function(pn,j){ var d=clamp(Math.abs(j-k),0,1), en=ease(clamp((raw-.15-j*.1)/(.85-j*.1),0,1)); pn.style.transform="scale("+(1-.1*d).toFixed(3)+") rotateX("+((1-en)*-90).toFixed(2)+"deg)"; pn.style.opacity=((1-.55*d)*en).toFixed(3); $(".cp",pn).style.opacity=(1-clamp(d*2.2,0,1)).toFixed(3); var ry=j<i?360:j===i?180*ease(clamp((u-.12)/.28,0,1))+180*ease(clamp((u-.5)/.28,0,1)):0; cards[j].style.transform="rotateY("+ry.toFixed(2)+"deg)"; cards[j].classList.toggle("ao",ry>180); if(sides[j]){ var st=ry>270?"03 · Ambient occlusion":ry>90?"02 · Study render":"01 · Reference"; if(sides[j].textContent!==st) sides[j].textContent=st; } });
      rail.forEach(function(r,j){ r.classList.toggle("on",i===j); r.style.setProperty("--p",(clamp(T-j,0,1)*100)+"%"); }); } }; })();
  // 04 location: scroll steps A→B→C, clicks override until the next step
  var sitesK={entry:"A · Main entrance",bar:"B · Bar wall",stair:"C · Main staircase"}, lastK4=-1;
  function setSite(k){ $$("[data-site]").forEach(function(el){ el.classList.toggle("on",el.dataset.site===k); }); $("#axonTag").textContent=sitesK[k]; }
  $$(".hot,.sites button").forEach(function(b){ b.addEventListener("click",function(){ setSite(b.dataset.site); }); });
  var loc=(function(){ var sec=$("#c4"); return { update:function(){ var rt=sec.getBoundingClientRect().top, p=desktop()?clamp(-rt/(sec.offsetHeight-H),0,1):clamp((H*.5-rt)/Math.max(1,sec.offsetHeight-H*.2),0,1), k=Math.min(2,Math.floor(clamp((p-.04)/.9,0,.999)*3)); if(k!==lastK4){ lastK4=k; setSite(["entry","bar","stair"][k]); } } }; })();
  // 07 fabricators: a covered card settles back and dims
  var fabs=$$(".fab"), c7=$("#c7");
  function stack(){ c7.classList.remove("flat"); var base=parseFloat(getComputedStyle(html).getPropertyValue("--sp-top"))||100; fabs.forEach(function(f,i){ f.style.top=Math.min(base+i*18,H-f.offsetHeight-24)+"px"; }); for(var i=0;i<fabs.length-1;i++){ var r=fabs[i].getBoundingClientRect(), rn=fabs[i+1].getBoundingClientRect(); var c=clamp((r.bottom-rn.top)/r.height,0,1); fabs[i].style.transform="scale("+(1-.06*c).toFixed(4)+")"; fabs[i].style.setProperty("--v",(c*.55).toFixed(3)); } }
  // covers: the slab rises over the held section during its first 100vh, then holds while the next section slides over
  var covers=$$(".cover").map(function(c){ var o={el:c,slab:$(".slab",c),img:$("img",c),open:$("img.open",c),cv:$("canvas.frames",c),vid:$("video.src",c),white:$(".white",c),ct:$(".ct",c),frames:null,lastIdx:-1}; if(o.vid) cacheFrames(o); return o; });
  // curtain: the clip is decoded once into a frame cache so scroll can scrub it smoothly in both directions
  function cacheFrames(o){ var N=48, v=o.vid; v.addEventListener("error",function(){ o.frames=null; }); fetch(v.dataset.src).then(function(r){ return r.blob(); }).then(function(b){ v.src=URL.createObjectURL(b); return new Promise(function(res,rej){ var t=setTimeout(function(){ rej(new Error("video timeout")); },20000); var go=function(){ if(v.readyState>=2){ clearTimeout(t); res(); } }; v.addEventListener("canplay",go); v.addEventListener("loadeddata",go); v.load(); go(); }); }).then(function(){ var D=v.duration, out=[], i=0; function next(){ if(i>=N){ o.frames=out; o.lastIdx=-1; return; } v.addEventListener("seeked",function(){ createImageBitmap(v).then(function(bm){ out.push(bm); i++; next(); }).catch(function(){ o.frames=null; }); },{once:true}); v.currentTime=Math.min(D-.04,i/(N-1)*D); } next(); }).catch(function(){ o.frames=null; }); }
  function drawFrame(o,sp){ var fr=o.frames; if(!fr){ return; } var r=o.cv.getBoundingClientRect(), W=Math.round(r.width*Math.min(devicePixelRatio,2)), Hh=Math.round(r.height*Math.min(devicePixelRatio,2)); if(o.cv.width!==W||o.cv.height!==Hh){ o.cv.width=W; o.cv.height=Hh; o.lastIdx=-1; } var f=sp*(fr.length-1), a=Math.floor(f), b=Math.min(fr.length-1,a+1), t=f-a; var key=a+":"+t.toFixed(2); if(key===o.lastIdx) return; o.lastIdx=key; var ctx=o.cv.getContext("2d"), bm=fr[a], sc=Math.max(W/bm.width,Hh/bm.height), dw=bm.width*sc, dh=bm.height*sc, dx=(W-dw)/2, dy=(Hh-dh)/2; ctx.globalAlpha=1; ctx.drawImage(bm,dx,dy,dw,dh); if(t>0.02&&b!==a){ ctx.globalAlpha=t; ctx.drawImage(fr[b],dx,dy,dw,dh); ctx.globalAlpha=1; } o.cv.classList.add("ready"); }
  function coversUpd(){ covers.forEach(function(c){ var r=c.el.getBoundingClientRect(); if(r.bottom<0||r.top>H){ c.el.dataset.p=0; return; } var p1=clamp(-r.top/H,0,1), p2=clamp((-r.top-H)/H,0,1), dk=desktop(); if(!dk){ var rise=c.el.id==="v2"||c.el.id==="v3"; p1=rise?clamp(-r.top/H,0,1):1; p2=clamp((-r.top-(rise?H:0))/Math.max(1,c.el.offsetHeight-H-(rise?H:0)),0,1); if(rise){ var em=ease(p1); c.slab.style.transform="translate3d(0,"+((1-em)*100).toFixed(2)+"%,0)"; c.img.style.transform="translate3d(0,"+(-(1-em)*10).toFixed(2)+"%,0) scale(1.12)"; } } if(dk){ var e=ease(p1); c.slab.style.transform="translate3d(0,"+((1-e)*100).toFixed(2)+"%,0)"; c.img.style.transform="translate3d(0,"+(-(1-e)*10-p2*6).toFixed(2)+"%,0) scale(1.12)"; } c.ct.classList.toggle("on",p1>.72); c.el.dataset.p=p1; c.el.dataset.p2=p2;
      if(c.vid){ var sp=clamp(p2/(dk?.75:.6),0,1); if(c.frames) drawFrame(c,sp); else if(c.open) c.open.style.opacity=ease(sp); var zoom=1+.18*ease(clamp((p2-(dk?.72:.6))/(dk?.26:.25),0,1)); c.slab.style.setProperty("--zoom",zoom.toFixed(4)); c.white.style.opacity=dk?clamp((p2-.86)/.13,0,1):ease(clamp((p2-.74)/.26,0,1)); c.ct.classList.toggle("off",p2>(dk?.3:.42)); } }); }
  // touch: once scrolling stops near the top of a pinned cover, settle onto it (never while the finger is down)
  if(!fine&&!reduce){ var settleT=null, settleEls=$$(".cover.curtain,.cover#v1"); var settle=function(){ settleEls.forEach(function(el){ var t=el.getBoundingClientRect().top; if(t>8&&t<H*.3) scrollTo({top:scrollY+t,behavior:"smooth"}); }); }; addEventListener("scroll",function(){ clearTimeout(settleT); settleT=setTimeout(settle,220); },{passive:true}); }
  var holds=$$(".sc.hold>.pin");
  function holdsUpd(){ holds.forEach(function(p){ p.style.top=Math.min(0,H-p.offsetHeight)+"px"; }); }
  // 09 road: blue rule draws down as the list passes the viewport centre
  var road=$("#road"), roadNodes=$$("#road>div");
  function roadUpd(){ var r=road.getBoundingClientRect(); var p=clamp((H*.62-r.top)/r.height,0,1); road.style.setProperty("--h",(p*100)+"%"); roadNodes.forEach(function(n){ var on=(n.offsetTop+8)/r.height<=p+.02; n.classList.toggle("on",on); $(".lab-node",n).classList.toggle("on",on); }); }
  // parallax windows
  var wins=$$("[data-win]");
  function winUpd(){ if(reduce) return; wins.forEach(function(el){ var r=el.getBoundingClientRect(); if(r.bottom<0||r.top>H) return; var c=(r.top+r.height/2-H/2)/H; $("img",el).style.transform="translate3d(0,"+(c*-9).toFixed(2)+"%,0) scale(1.18)"; }); }

  /* ---------- the loop ---------- */
  var lastY=-1, lastW=0;
  function frame(){ var y=scrollY; if(innerWidth!==lastW){ lastW=innerWidth; W=innerWidth; H=innerHeight; hero.measure(); lastY=-1; } if(y!==lastY){ lastY=y; var max=maxY()||1; html.classList.toggle("sp-hero",y<H*.5);
      var ci=0; secs.forEach(function(s,i){ if(s.offsetTop-H*.4<=y) ci=i; }); setSec(ci);
      var pr=y/max; hudL.textContent="Layer "+String(Math.round(pr*46)).padStart(3,"0")+" / 046"; hudG.style.setProperty("--h",(pr*100)+"%");
      reveals(); hero.update(y); proc.update(); film.update(); loc.update(); stack(); roadUpd(); winUpd(); coversUpd(); holdsUpd(); }
    requestAnimationFrame(frame); }
  requestAnimationFrame(frame);

  /* ---------- compare ---------- */
  var cmp=$("#cmp"), cmpA=$("#cmpA"), cmpB=$("#cmpB"), cmpR=$("#cmpR");
  function setX(v){ cmp.style.setProperty("--x",v+"%"); cmpR.value=v; }
  cmpR.addEventListener("input",function(){ setX(+cmpR.value); });
  cmp.addEventListener("pointerdown",function(e){ cmp.setPointerCapture(e.pointerId); var mv=function(ev){ var r=cmp.getBoundingClientRect(); setX(Math.min(100,Math.max(0,(ev.clientX-r.left)/r.width*100))); }; mv(e); cmp.addEventListener("pointermove",mv); cmp.addEventListener("pointerup",function u(){ cmp.removeEventListener("pointermove",mv); cmp.removeEventListener("pointerup",u); },{once:true}); });
  setX(0);
  var ioC=new IntersectionObserver(function(es){ es.forEach(function(en){ if(!en.isIntersecting) return; ioC.unobserve(cmp); var t0=performance.now(); (function sweep(now){ var p=Math.min(1,(now-t0)/1600); setX(ease(p)*50); if(p<1) requestAnimationFrame(sweep); })(t0); }); },{threshold:.5});
  ioC.observe(cmp);
  var viewAlt={1:"looking up the stair",2:"climbing the stair",3:"from the lobby",4:"at the landing",5:"on the upper flight"};
  $$("#views button").forEach(function(b){ b.addEventListener("click",function(){ $$("#views button").forEach(function(x){ x.classList.toggle("on",x===b); }); var v=b.dataset.v; cmpA.src="img/opt/web_option_1_view_"+v+".webp"; cmpB.src="img/opt/web_option_2_view_"+v+".webp"; cmpA.alt="Curtain study "+viewAlt[v]; cmpB.alt="Wave study "+viewAlt[v]; }); });
  [1,2,3,4,5].forEach(function(v){ ["1","2"].forEach(function(o){ var im=new Image(); im.src="img/opt/web_option_"+o+"_view_"+v+".webp"; }); });

  // mobile studies: the front face’s two images become separate slides, each with the tag text it had on the turn
  if(!desktop()){ $$("#c3 .cpanel .face.f").forEach(function(f){ var ta=$(".ta",f), tc=$(".tc",f); [["a",ta],["c",tc]].forEach(function(p){ var im=$("img."+p[0],f); if(!im) return; var w=document.createElement("div"); w.className="mslide"; im.parentNode.insertBefore(w,im); w.appendChild(im); var t=document.createElement("span"); t.className="lab-tag"; t.textContent=p[1]?p[1].textContent:""; w.appendChild(t); }); }); }
  /* ---------- lightbox: click any study face to see the full image ---------- */
  var lbx=$("#lbx"), lbxImg=$("img",lbx), lbxTag=$(".lab-tag",lbx), lbxOpen=false;
  function openLbx(img,tag){ lbxImg.src=img.currentSrc||img.src; lbxImg.alt=img.alt; lbxTag.textContent=tag||img.alt; lbx.classList.add("open"); lbx.setAttribute("aria-hidden","false"); lbxOpen=true; }
  function closeLbx(){ lbx.classList.remove("open"); lbx.setAttribute("aria-hidden","true"); lbxOpen=false; setTimeout(function(){ if(!lbxOpen) lbxImg.removeAttribute("src"); },450); }
  $$("#c3 .face").forEach(function(f){ f.addEventListener("click",function(e){ var im=[].filter.call(f.querySelectorAll("img"),function(x){ return getComputedStyle(x).display!=="none"; })[0]; if(!im) return; var t=[].filter.call(f.querySelectorAll(".lab-tag, .lab-tag span"),function(x){ return getComputedStyle(x).display!=="none"&&!x.querySelector("span"); })[0]; openLbx(im,t&&t.textContent); }); });
  lbx.addEventListener("click",function(e){ if(!e.target.closest("img")) closeLbx(); });
  $(".x",lbx).addEventListener("click",closeLbx);
  addEventListener("keydown",function(e){ if(e.key==="Escape"&&lbxOpen) closeLbx(); });

  $$("[data-zoom]").forEach(function(z){ z.addEventListener("click",function(e){ var im=e.target.closest("img"); if(!im||e.target.closest(".th:not(.wide)")) return; openLbx(im,im.dataset.cap||im.alt); }); });
  // fabricator galleries + Branch option switcher
  $$(".fab .gal").forEach(function(g){ var main=$(".main img",g), cap=$(".gcap",g); if(!main) return; $$(".th button",g).forEach(function(b){ b.addEventListener("click",function(e){ e.stopPropagation(); var im=$("img",b); $$(".th button",g).forEach(function(x){ x.classList.toggle("on",x===b); }); main.style.opacity=0; setTimeout(function(){ main.src=im.getAttribute("src"); main.alt=im.alt; main.dataset.cap=im.dataset.cap; main.style.opacity=1; },180); if(cap) cap.textContent=im.dataset.cap||im.alt; }); }); });
  $$("#bopts button").forEach(function(b){ b.addEventListener("click",function(){ var o=b.dataset.o; $$("#bopts button").forEach(function(x){ x.classList.toggle("on",x===b); }); $$("#bstage .pane,#bwhy .pane").forEach(function(p){ p.classList.toggle("on",p.dataset.o===o); }); $$("#bct tr").forEach(function(tr){ [].forEach.call(tr.children,function(td,i){ td.classList.toggle("sel",i===+o+1&&!td.hasAttribute("colspan")); }); }); }); });
  $$("#bct tr").forEach(function(tr){ [].forEach.call(tr.children,function(td,i){ td.classList.toggle("sel",i===1&&!td.hasAttribute("colspan")); }); });

  /* ---------- ask chips ---------- */
  $$(".asks .pick").forEach(function(g){ var single=g.children.length<=2; [].forEach.call(g.children,function(b){ b.addEventListener("click",function(){ if(single) [].forEach.call(g.children,function(x){ x.classList.toggle("on",x===b); }); else b.classList.toggle("on"); }); }); });

  /* ---------- 3D modules only render near their section ---------- */
  var io3=new IntersectionObserver(function(es){ es.forEach(function(en){ var id=en.target.id; if(id==="stair3d"&&window.stairViewer){ en.isIntersecting?window.stairViewer.start():window.stairViewer.stop(); } if(id==="wave-wall-diagram"&&window.waveWallReveal&&window.waveWallReveal.setActive) window.waveWallReveal.setActive(en.isIntersecting); }); },{threshold:.05});
  ["stair3d","wave-wall-diagram"].forEach(function(id){ var el=document.getElementById(id); if(el) io3.observe(el); });
  setSec(0);
  window.sp2={clamp:clamp,ease:ease,desktop:desktop,H:function(){ return H; }};
})();
