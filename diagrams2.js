/* LJC scroll v2 — live vector diagrams: plan trace on the Location cover, section cut, Branch lattice, particle wall */
(function(){
  var S=window.sp2, clamp=S.clamp, ease=S.ease, reduce=matchMedia("(prefers-reduced-motion: reduce)").matches, fine=matchMedia("(pointer:fine)").matches, dpr=Math.min(devicePixelRatio||1,2);
  var $=function(s,r){ return (r||document).querySelector(s); };
  var INK="#0C1926", BLUE="#2E6E99", ICE="#8DCCFF", MONO='9px "IBM Plex Mono", monospace';
  function fit(cv){ var r=cv.getBoundingClientRect(); if(!r.width||!r.height) return null; var w=Math.round(r.width*dpr), h=Math.round(r.height*dpr); if(cv.width!==w||cv.height!==h){ cv.width=w; cv.height=h; } var ctx=cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0); return {ctx:ctx,W:r.width,H:r.height}; }
  function onScreen(el,pad){ var r=el.getBoundingClientRect(); return r.bottom>-(pad||0)&&r.top<innerHeight+(pad||0); }
  var wall=null; fetch("img/wall_layers2.json").then(function(r){ return r.json(); }).then(function(w){ wall=w; });

  /* ---- A. ground-floor plan drawn line by line from the Revit vectors, sites pulse once complete ---- */
  var plan=(function(){ var cover=$("#v1"); if(!cover) return null; var cv=$("canvas",cover), vec=null, cum=null, total=0;
    fetch("img/plan-vec.json").then(function(r){ return r.json(); }).then(function(v){ vec=v; cum=[]; total=0; v.paths.forEach(function(q){ var L=0; for(var i=2;i<q.p.length;i+=2) L+=Math.hypot((q.p[i]-q.p[i-2])*v.w,(q.p[i+1]-q.p[i-1])*v.h); total+=L; cum.push(total); }); });
    var sites=[[.95,.70],[.868,.288],[.807,.75]], names=["A","B","C"];
    return { draw:function(now){ if(!onScreen(cover)) return; var f=fit(cv); if(!f||!vec) return; var ctx=f.ctx, W=f.W, CH=f.H; ctx.clearRect(0,0,W,CH); var p1=+cover.dataset.p||0, p2=+cover.dataset.p2||0; if(p1<.5) return;
        var draw=ease(clamp(p2/.85,0,1)); if(draw<=0) return; var g=W*.07, pw=W<CH?W-2*g:Math.min(W*.5,(CH*.66)*vec.w/vec.h), ph=pw*vec.h/vec.w, px=W<CH?g:W-g-pw, py=W<CH?CH*.3-ph*.5:CH*.5-ph*.56, sx=pw, sy=ph;
        var lim=draw*total, n=vec.paths.length; ctx.lineCap="round"; ctx.lineJoin="round";
        // every stroke in sheet order up to the current length; the last few strokes are the pen, in ice blue
        for(var k=0;k<n;k++){ if(cum[k]-((k?cum[k-1]:0))<=0) continue; var start=k?cum[k-1]:0; if(start>lim) break; var q=vec.paths[k], full=cum[k]<=lim, fresh=lim-start<900; ctx.strokeStyle=fresh?ICE:"rgba(255,255,255,"+(q.w===2?.9:.62)+")"; ctx.lineWidth=q.w===2?1.3:.8; ctx.beginPath();
          if(full){ for(var i=0;i<q.p.length;i+=2){ var x=px+q.p[i]*sx, y=py+q.p[i+1]*sy; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } }
          else { var need=lim-start, acc=0; ctx.moveTo(px+q.p[0]*sx,py+q.p[1]*sy); for(i=2;i<q.p.length;i+=2){ var dx=(q.p[i]-q.p[i-2])*sx, dy=(q.p[i+1]-q.p[i-1])*sy, L=Math.hypot(dx,dy); if(acc+L>=need){ var t=(need-acc)/(L||1); ctx.lineTo(px+q.p[i-2]*sx+dx*t,py+q.p[i-1]*sy+dy*t); break; } acc+=L; ctx.lineTo(px+q.p[i]*sx,py+q.p[i+1]*sy); } }
          ctx.stroke(); }
        ctx.strokeStyle="rgba(255,255,255,.7)"; ctx.lineWidth=1; [[px-7,py-7,1,1],[px+pw+7,py-7,-1,1],[px-7,py+ph+7,1,-1],[px+pw+7,py+ph+7,-1,-1]].forEach(function(c){ ctx.beginPath(); ctx.moveTo(c[0],c[1]+13*c[3]); ctx.lineTo(c[0],c[1]); ctx.lineTo(c[0]+13*c[2],c[1]); ctx.stroke(); });
        ctx.font=MONO; ctx.fillStyle="rgba(255,255,255,.85)"; ctx.textAlign="left"; ctx.fillText("GROUND FLOOR PLAN · "+String(Math.min(n,Math.round(draw*n))).padStart(5,"0")+" / "+n+" LINES",px,py-16);
        var on=clamp((draw-.92)/.08,0,1); if(on>0){ sites.forEach(function(s,i){ var x=px+s[0]*pw, y=py+s[1]*ph, t=((now/1400)+i*.33)%1; ctx.globalAlpha=on*(1-t); ctx.strokeStyle=ICE; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,6+t*22,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=on; ctx.fillStyle=i===2?BLUE:"rgba(255,255,255,.95)"; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#fff"; ctx.stroke(); ctx.fillStyle=i===2?"#fff":INK; ctx.font='bold 9px "IBM Plex Mono", monospace'; ctx.textAlign="center"; ctx.fillText(names[i],x,y+3); }); ctx.globalAlpha=1; } } }; })();

  /* ---- E. closing: a 3D point matrix that gathers into the LJC mark as the pointer nears the centre ---- */
  var cloud=(function(){ var host=$("#c11"), cv=$("#cloud"); if(!cv) return null; var targets=null, pts=[], yaw=0, pitch=.35, a=0, aT=0, ptr=null, NX=22,NY=12,NZ=12;
    var im=new Image(); im.src="img/ljc-mark.png"; im.onload=function(){ var oc=document.createElement("canvas"); oc.width=im.width; oc.height=im.height; var c=oc.getContext("2d"); c.drawImage(im,0,0); var d=c.getImageData(0,0,oc.width,oc.height).data, raw=[]; for(var y=0;y<oc.height;y++) for(var x=0;x<oc.width;x++){ var i=(y*oc.width+x)*4; if(d[i]>200&&d[i+1]>200&&d[i+2]>200) raw.push([x/oc.width-.5,y/oc.height-.5]); }
      var N=NX*NY*NZ, step=Math.max(1,raw.length/N); targets=[]; for(var k=0;k<N;k++){ var q=raw[Math.min(raw.length-1,Math.floor(k*step))]; targets.push([q[0]+(Math.random()-.5)*.004,q[1]+(Math.random()-.5)*.004]); }
      targets.sort(function(p,q){ return (p[1]*4+p[0])-(q[1]*4+q[0]); }); };
    for(var z=0;z<NZ;z++) for(var y=0;y<NY;y++) for(var x=0;x<NX;x++) pts.push({p:[(x-(NX-1)/2)/(NX-1)*3.6,(y-(NY-1)/2)/(NY-1)*2.1,(z-(NZ-1)/2)/(NZ-1)*2.2],x:0,y:0,t:null});
    host.addEventListener("pointermove",function(e){ var r=cv.getBoundingClientRect(); ptr=[e.clientX-r.left,e.clientY-r.top]; }); host.addEventListener("pointerleave",function(){ ptr=null; });
    var tapOn=false, cue=null; if(!fine){ cue=document.createElement("div"); cue.className="tapcue"; cue.textContent="Tap"; host.appendChild(cue); host.addEventListener("click",function(){ tapOn=!tapOn; cue.classList.add("off"); }); var hint=host.querySelector(".close-hint"); if(hint) hint.style.display="none"; }
    return { draw:function(now){ if(!onScreen(host)){ if(cue&&(tapOn||cue.classList.contains("off"))){ tapOn=false; a=0; cue.classList.remove("off"); } return; } var f=fit(cv); if(!f) return; var ctx=f.ctx, W=f.W, CH=f.H; ctx.clearRect(0,0,W,CH); yaw+=ptr?.0014:.0005; var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),SC=Math.min(W*.34,CH*.5),CX=W/2,CY=CH/2;
        var near=0; if(!fine){ near=tapOn?1:0; } else if(ptr){ var d=Math.hypot(ptr[0]-CX,ptr[1]-CY); var R=Math.min(W,CH); near=clamp(1-(d-R*.18)/(R*.3),0,1); } aT=ease(near); a+=(aT-a)*(aT<a?.025:.06); host.classList.toggle("formed",a>.85);
        // assign logo targets by projected order once, so neighbours travel together
        var proj=pts.map(function(q){ var x=q.p[0]*cy-q.p[2]*sy, z=q.p[0]*sy+q.p[2]*cy; var y=q.p[1]*cp-z*sp, z2=q.p[1]*sp+z*cp; var s=1/(1+z2*.35); return [CX+x*SC*s,CY-y*SC*s,s]; });
        if(targets&&!pts[0].t){ var order=pts.map(function(q,i){ return i; }).sort(function(i,j){ return (proj[i][1]*4+proj[i][0])-(proj[j][1]*4+proj[j][0]); }); order.forEach(function(i,r){ pts[i].t=targets[r]; }); }
        var LS=Math.min(W,CH)*.58, ea=a;
        for(var i=0;i<pts.length;i++){ var q=pts[i], P=proj[i], tx=P[0], ty=P[1]; if(q.t){ tx=P[0]+(CX+q.t[0]*LS-P[0])*ea; ty=P[1]+(CY+q.t[1]*LS-P[1])*ea; } var depth=P[2], alpha=.25+.55*clamp((depth-.7)/.6,0,1); alpha=alpha+(1-alpha)*ea; var rad=(.9+1.3*depth)*(1-ea)+1.9*ea; var low=clamp((ty/CH-.55)/.45,0,1); ctx.fillStyle=low>0?"rgba("+Math.round(23+(220-23)*low)+","+Math.round(59+(236-59)*low)+","+Math.round(92+(250-92)*low)+","+alpha.toFixed(2)+")":"rgba(23,59,92,"+alpha.toFixed(2)+")"; ctx.beginPath(); ctx.arc(tx,ty,rad,0,Math.PI*2); ctx.fill(); }
        ctx.font=MONO; ctx.fillStyle="rgba(255,255,255,.8)"; ctx.textAlign="right"; ctx.fillText((pts.length)+" POINTS · "+Math.round(a*100)+"% FORMED",W-W*.07,CH-72); } }; })();

  var mods=[plan,cloud].filter(Boolean);
  (function loop(now){ if(!document.hidden) mods.forEach(function(m){ try{ m.draw(now); }catch(e){} }); requestAnimationFrame(loop); })(performance.now());
})();
