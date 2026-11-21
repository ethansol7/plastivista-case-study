(() => {
  'use strict';
  const script = document.currentScript;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const requestedBackground = new URLSearchParams(location.search).get('background');
  let dark = requestedBackground === 'light' ? false : requestedBackground === 'dark' ? true : read('pv-background-05') === 'dark';
  let moving = !reduced.matches && read('pv-motion') !== 'off';
  const canvas = document.createElement('canvas');
  canvas.id = 'ambient-field'; canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha:true });
  const controls = document.createElement('div');
  controls.className = 'ambient-controls'; controls.setAttribute('role','group'); controls.setAttribute('aria-label','Background controls');
  controls.innerHTML = `<button type="button" class="ambient-play" hidden><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4l8 6-8 6z"/></svg><span>Play music</span></button><label class="ambient-volume" hidden><span>Volume</span><input type="range" min="0" max="100" step="1" value="24" aria-label="Music volume"></label><button type="button" class="ambient-motion"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12M13 4v12"/></svg><span>Pause motion</span></button><button type="button" class="ambient-theme" aria-label="Use light background" title="Use light background"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.5"/><path d="M10 0v3m0 14v3M0 10h3m14 0h3M3 3l2 2m10 10 2 2M3 17l2-2M15 5l2-2"/></svg></button><span class="ambient-status" role="status" hidden></span>`;
  document.body.append(controls);
  if(window.self!==window.top){
    document.documentElement.classList.add('is-embedded');
    const header=document.querySelector('.masthead,.site-header');
    if(header)header.append(controls);
  }
  if(window.self===window.top)document.querySelector('.masthead')?.append(controls);
  const motion = controls.querySelector('.ambient-motion');
  const theme = controls.querySelector('.ambient-theme');
  const play = controls.querySelector('.ambient-play');
  const volume = controls.querySelector('.ambient-volume');
  let width=0, height=0, clock=0, last=0, frame=0, scroll=window.scrollY, target=scroll;
  let seed=12817;
  const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const particles=Array.from({length:135},(_,i)=>({x:random(),y:random(),phase:random()*Math.PI*2,depth:.25+random()*.75,r:i%13===0?3+random()*8:.35+random()*1.25,speed:.002+random()*.006}));
  const glows=new Map();
  function glow(isDark){
    if(glows.has(isDark))return glows.get(isDark);
    const sprite=document.createElement('canvas');sprite.width=sprite.height=64;
    const c=sprite.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);
    const color=isDark?'233,208,149':'104,198,230';
    g.addColorStop(0,`rgba(${color},.8)`);g.addColorStop(.2,`rgba(${color},.3)`);g.addColorStop(1,`rgba(${color},0)`);
    c.fillStyle=g;c.fillRect(0,0,64,64);glows.set(isDark,sprite);return sprite;
  }
  function draw(){
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);
    if(!dark)drawLightWaves();
    const count=width<600?65:135;
    // The field stays behind the work. Depth responds gently to actual page scroll.
    for(let i=0;i<count;i++){
      const p=particles[i];
      const x=((p.x*width+Math.sin(clock*.045+p.phase)*26+scroll*.012*p.depth)%(width+40)+width+40)%(width+40)-20;
      const y=((p.y*height-clock*p.speed*14-scroll*.035*p.depth)%(height+80)+height+80)%(height+80)-40;
      const shimmer=.55+.45*Math.sin(clock*.32+p.phase);
      const edge=.28+.72*Math.pow(Math.abs(x/width-.5)*2,1.4);
      ctx.globalAlpha=(dark?.43:.5)*edge*shimmer;
      if(p.r>3){ctx.drawImage(glow(dark),x-p.r*3,y-p.r*3,p.r*6,p.r*6);}
      else{
        ctx.fillStyle=dark?'#ecd7a6':'#69b4d6';ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
        if(!dark&&i%11===0){
          ctx.strokeStyle='#fff';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x+4,y);ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();
        }
      }
    }
    // Barely visible sweeping filaments suggest the material loop without a logo.
    for(let line=0;dark&&line<3;line++){
      ctx.beginPath();
      for(let x=0;x<=width;x+=12){const y=height*.58+Math.sin(x/width*4+clock*.035+line*.06+scroll*.00012)*height*.14+line*8; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.globalAlpha=dark?.035:.022;ctx.strokeStyle=dark?'#dfc98c':'#6c654e';ctx.lineWidth=1;ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function drawLightWaves(){
    // Translucent ribbons keep the white page visible beneath a cool luminous field.
    const scale=Math.min(height,1000);
    const drift=clock*.075+scroll*.00016;
    const mobile=width<600;
    const base=scale*(mobile?.25:.19);
    const bands=[
      {phase:.3,amplitude:.11,thickness:.15,color:'100,155,235',alpha:.23},
      {phase:1.65,amplitude:.085,thickness:.11,color:'83,201,230',alpha:.29},
      {phase:2.5,amplitude:.065,thickness:.075,color:'110,222,210',alpha:.24}
    ];
    bands.forEach((band,index)=>{
      const top=x=>base+index*scale*.055+Math.sin(x/width*4.1+drift+band.phase)*scale*band.amplitude+Math.sin(x/width*1.8-drift*.7)*scale*.035;
      const bottom=x=>top(x)+scale*band.thickness*(.65+.35*Math.sin(x/width*2.8+band.phase));
      const fill=ctx.createLinearGradient(0,base-scale*.18,width,base+scale*.35);
      fill.addColorStop(0,`rgba(${band.color},0)`);
      fill.addColorStop(.35,`rgba(${band.color},${band.alpha})`);
      fill.addColorStop(.7,`rgba(${band.color},${band.alpha*.75})`);
      fill.addColorStop(1,`rgba(${band.color},0)`);
      ctx.globalAlpha=1;ctx.beginPath();
      for(let x=-20;x<=width+20;x+=10){x===-20?ctx.moveTo(x,top(x)):ctx.lineTo(x,top(x));}
      for(let x=width+20;x>=-20;x-=10)ctx.lineTo(x,bottom(x));
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
      ctx.beginPath();for(let x=-20;x<=width+20;x+=10){x===-20?ctx.moveTo(x,top(x)):ctx.lineTo(x,top(x));}
      ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.3;ctx.stroke();
      ctx.beginPath();for(let x=-20;x<=width+20;x+=10){x===-20?ctx.moveTo(x,bottom(x)):ctx.lineTo(x,bottom(x));}
      ctx.strokeStyle=`rgba(${band.color},.16)`;ctx.lineWidth=.7;ctx.stroke();
    });
  }
  function tick(now){
    frame=0;if(!moving||document.hidden)return;
    if(now-last>=32){clock+=Math.min((now-last)/1000,.08);last=now;scroll+=(target-scroll)*.07;draw();}
    frame=requestAnimationFrame(tick);
  }
  function run(){cancelAnimationFrame(frame);frame=0;last=performance.now();if(moving&&!document.hidden)frame=requestAnimationFrame(tick);else draw();}
  function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);draw();}
  function update(){
    document.body.classList.toggle('is-dark',dark);
    motion.querySelector('span').textContent=moving?'Pause motion':'Resume motion';
    motion.setAttribute('aria-label',moving?'Pause background motion':'Resume background motion');
    motion.querySelector('path').setAttribute('d',moving?'M7 4v12M13 4v12':'M7 4l8 6-8 6z');
    theme.setAttribute('aria-label',dark?'Use light background':'Use dark background');theme.title=theme.getAttribute('aria-label');draw();
  }
  motion.addEventListener('click',()=>{moving=!moving;save('pv-motion',moving?'on':'off');update();run();});
  theme.addEventListener('click',()=>{dark=!dark;save('pv-background-05',dark?'dark':'light');if(requestedBackground){const url=new URL(location.href);url.searchParams.set('background',dark?'dark':'light');history.replaceState(null,'',url);}update();});
  reduced.addEventListener('change',()=>{if(reduced.matches){moving=false;update();run();}});
  window.addEventListener('resize',resize,{passive:true});window.addEventListener('scroll',()=>{target=window.scrollY;},{passive:true});
  document.addEventListener('visibilitychange',run);
  update();resize();run();

  // Sound is always opt in. The rejected oscillator soundtrack is never used.
  if(!script?.dataset.musicSrc)return;
  const audio=document.createElement('audio');audio.src=script.dataset.musicSrc;audio.preload='none';audio.loop=true;audio.id='ambient-audio';
  audio.volume=.24;document.body.append(audio);play.hidden=false;
  let intended=false;
  const status=controls.querySelector('.ambient-status');
  function audioUI(){const active=!audio.paused;play.querySelector('span').textContent=active?'Pause music':'Play music';play.querySelector('path').setAttribute('d',active?'M7 4v12M13 4v12':'M7 4l8 6-8 6z');play.setAttribute('aria-label',active?'Pause background music':'Play background music');volume.hidden=!active;}
  play.addEventListener('click',async()=>{if(!audio.paused){intended=false;audio.pause();return;}try{intended=true;status.hidden=true;await audio.play();}catch{intended=false;status.textContent='Music could not load. Try again.';status.hidden=false;}audioUI();});
  volume.querySelector('input').addEventListener('input',event=>{audio.volume=Number(event.target.value)/100;});
  audio.addEventListener('play',audioUI);audio.addEventListener('pause',audioUI);audio.addEventListener('error',()=>{status.textContent='Music could not load. Try again.';status.hidden=false;audioUI();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else if(intended)audio.play().catch(()=>{intended=false;audioUI();});});
  window.addEventListener('pagehide',()=>{intended=false;audio.pause();});
})();
