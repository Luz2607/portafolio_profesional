// Utilidades generales
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* =========================
   2D ANIMATIONS (Canvas)
   ========================= */

class Canvas2DAnim {
  constructor(canvas, type) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.type = type;
    this.w = canvas.clientWidth;
    this.h = canvas.clientHeight;
    this.mouse = { x: this.w/2, y: this.h/2, inside:false };
    this.speedFactor = 1;

    this.resize();
    this.attach();
    this.init();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    this.w = this.c.clientWidth;
    this.h = this.c.clientHeight;
    this.c.width = Math.floor(this.w * DPR);
    this.c.height = Math.floor(this.h * DPR);
    this.ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  attach() {
    window.addEventListener('resize', ()=>this.resize());
    this.c.addEventListener('mousemove', e=>{
      const r = this.c.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
      this.mouse.inside = true;
    });
    this.c.addEventListener('mouseleave', ()=>{ this.mouse.inside=false; });
    // Acelerar en hover de tarjeta
    const card = this.c.closest('.card-pro');
    card.addEventListener('mouseenter', ()=> this.speedFactor = 1.8);
    card.addEventListener('mouseleave', ()=> this.speedFactor = 1.0);
  }

  init(){
    switch(this.type){
      case 0: this.initGradientDisk(); break;
      case 1: this.initBezierRibbon(); break;
      case 2: this.initParticles(); break;
      case 3: this.initLissajous(); break;
      case 4: this.initIsometric(); break;
      case 5: this.initEclipse(); break;
    }
  }

  clear(alpha=0.2){
    // Trazo persistente suave
    this.ctx.fillStyle = `rgba(13,19,32,${alpha})`;
    this.ctx.fillRect(0,0,this.w,this.h);
  }

  loop(ts){
    switch(this.type){
      case 0: this.drawGradientDisk(ts); break;
      case 1: this.drawBezierRibbon(ts); break;
      case 2: this.drawParticles(ts); break;
      case 3: this.drawLissajous(ts); break;
      case 4: this.drawIsometric(ts); break;
      case 5: this.drawEclipse(ts); break;
    }
    requestAnimationFrame(this.loop);
  }

  /* ----- 0) Disco de gradiente con luz orbitando ----- */
  initGradientDisk(){
    this.t = 0;
  }
  drawGradientDisk(ts){
    this.t += 0.02 * this.speedFactor;
    const cx = this.w/2, cy = this.h/2;
    const r = Math.min(this.w, this.h)*0.35;

    // Fondo con gradiente radial dinámico
    const g = this.ctx.createRadialGradient(
      cx + Math.cos(this.t)*r*0.25, cy + Math.sin(this.t)*r*0.25, r*0.1,
      cx, cy, r*1.2
    );
    g.addColorStop(0, '#123');
    g.addColorStop(1, '#0a0f1a');
    this.ctx.fillStyle = g; this.ctx.fillRect(0,0,this.w,this.h);

    // Anillo
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.t*0.7);
    const ring = this.ctx.createConicGradient(this.t, 0, 0);
    ring.addColorStop(0, '#00d1ff');
    ring.addColorStop(0.5, '#6ee7ff');
    ring.addColorStop(1, '#00d1ff');
    this.ctx.lineWidth = 22;
    this.ctx.strokeStyle = ring;
    this.ctx.beginPath();
    this.ctx.arc(0,0,r,0,Math.PI*2);
    this.ctx.stroke();

    // Puntos luminosos
    for (let i=0;i<8;i++){
      const a = this.t + i * (Math.PI/4);
      const px = Math.cos(a)*r, py = Math.sin(a)*r;
      const dot = this.ctx.createRadialGradient(px,py,0, px,py,10);
      dot.addColorStop(0,'#ffffff');
      dot.addColorStop(1,'#00d1ff00');
      this.ctx.fillStyle = dot;
      this.ctx.beginPath();
      this.ctx.arc(px,py,10,0,Math.PI*2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  /* ----- 1) Cinta Bézier reactiva al mouse ----- */
  initBezierRibbon(){
    this.path = [];
    this.t = 0;
  }
  drawBezierRibbon(ts){
    this.t += 0.02 * this.speedFactor;
    this.clear(0.08);
    const {ctx,w,h,mouse} = this;
    const cx = w/2, cy = h/2;
    const mx = mouse.inside ? mouse.x : cx;
    const my = mouse.inside ? mouse.y : cy;

    // Puntos control
    const p0 = {x: cx-140, y: cy};
    const p3 = {x: cx+140, y: cy};
    const p1 = {x: cx-60, y: cy + Math.sin(this.t)*60};
    const p2 = {x: mx, y: my};

    const grad = ctx.createLinearGradient(p0.x,p0.y,p3.x,p3.y);
    grad.addColorStop(0,'#00d1ff');
    grad.addColorStop(1,'#7c3aed');

    ctx.lineWidth = 8; ctx.lineCap='round';
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.moveTo(p0.x,p0.y);
    ctx.bezierCurveTo(p1.x,p1.y, p2.x,p2.y, p3.x,p3.y);
    ctx.stroke();

    // Brillo central
    const glow = ctx.createRadialGradient(mx,my,0, mx,my,80);
    glow.addColorStop(0,'#ffffff77');
    glow.addColorStop(1,'#ffffff00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx,my,80,0,Math.PI*2);
    ctx.fill();
  }

  /* ----- 2) Partículas con repulsión al mouse ----- */
  initParticles(){
    const count = 160;
    this.ps = Array.from({length:count}).map(()=>({
      x: Math.random()*this.w,
      y: Math.random()*this.h,
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.5)*0.6
    }));
  }
  drawParticles(ts){
    this.clear(0.25);
    const {ctx,ps,mouse,w,h} = this;

    ps.forEach(p=>{
      // Fuerza de repulsión
      if (mouse.inside){
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy + 0.0001;
        const f = 14000 / d2;
        p.vx += (dx/Math.sqrt(d2))*f*0.001*this.speedFactor;
        p.vy += (dy/Math.sqrt(d2))*f*0.001*this.speedFactor;
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x<0||p.x>w) p.vx*=-1;
      if (p.y<0||p.y>h) p.vy*=-1;

      // Partícula
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,4);
      g.addColorStop(0,'#bffcff');
      g.addColorStop(1,'#00d1ff00');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,4,0,Math.PI*2); ctx.fill();
    });

    // Conexiones
    ctx.lineWidth = 1;
    ps.forEach((a,i)=>{
      for(let j=i+1;j<ps.length;j++){
        const b = ps[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d = Math.hypot(dx,dy);
        if (d<80){
          ctx.strokeStyle = `rgba(0,209,255,${(1-d/80)*0.5})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    });
  }

  /* ----- 3) Lissajous con trail y cambio de color ----- */
  initLissajous(){
    this.t = 0;
  }
  drawLissajous(ts){
    this.t += 0.02 * this.speedFactor;
    this.clear(0.06);
    const {ctx,w,h} = this;
    const A = w*0.35, B = h*0.25;
    const a = 3, b = 2, delta = Math.PI/2.5;

    ctx.lineWidth = 2.5;
    const hue = (this.t*60)%360;
    ctx.strokeStyle = `hsl(${hue} 90% 55%)`;

    ctx.beginPath();
    for (let t=0;t<Math.PI*2;t+=0.01){
      const x = w/2 + A*Math.sin(a*t + delta);
      const y = h/2 + B*Math.sin(b*t);
      (t===0) ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
  }

  /* ----- 4) Isométricos ilusorios ----- */
  initIsometric(){
    this.t = 0;
  }
  drawIsometric(ts){
    this.t += 0.02 * this.speedFactor;
    this.clear(0.12);
    const {ctx,w,h} = this;
    const size = 24;
    const cols = Math.ceil(w/size)+2;
    const rows = Math.ceil(h/size)+2;

    ctx.save();
    ctx.translate((w - cols*size)/2, (h - rows*size)/2);
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const px = x*size, py = y*size;
        const elev = Math.sin(this.t + (x+y)*0.4)*6;
        const grad = ctx.createLinearGradient(px,py,px,py+size);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(px, py - elev, size-2, size-2);

        ctx.strokeStyle = 'rgba(0,209,255,.12)';
        ctx.strokeRect(px, py - elev, size-2, size-2);
      }
    }
    ctx.restore();
  }

  /* ----- 5) Eclipse con glow ----- */
  initEclipse(){
    this.t = 0;
  }
  drawEclipse(ts){
    this.t += 0.02 * this.speedFactor;
    const {ctx,w,h} = this;
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0,0,w,h);

    const cx=w/2, cy=h/2;
    const r = Math.min(w,h)*0.28;

    // Corona luminosa
    const corona = ctx.createRadialGradient(cx,cy, r*0.6, cx,cy, r*1.4);
    corona.addColorStop(0,'#00d1ff33');
    corona.addColorStop(1,'#00d1ff00');
    ctx.fillStyle = corona;
    ctx.beginPath(); ctx.arc(cx,cy,r*1.4,0,Math.PI*2); ctx.fill();

    // Disco principal con sutil gradiente
    const disk = ctx.createRadialGradient(cx-10,cy-10, r*0.1, cx,cy, r);
    disk.addColorStop(0,'#0c1324');
    disk.addColorStop(1,'#050a16');
    ctx.fillStyle = disk;
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

    // Luna que cruza
    const off = Math.sin(this.t*0.6)*r*1.2;
    ctx.fillStyle = '#0a0f1a';
    ctx.beginPath(); ctx.arc(cx+off, cy, r*0.9, 0, Math.PI*2); ctx.fill();
  }
}

document.querySelectorAll('canvas.canvas2d').forEach(c=>{
  const type = parseInt(c.dataset.anim2d,10)||0;
  new Canvas2DAnim(c, type);
});


/* =========================
   3D ANIMATIONS (Three.js)
   ========================= */

class Scene3D {
  constructor(container, type){
    this.el = container;
    this.type = type;
    this.w = container.clientWidth;
    this.h = 300;
    this.mouse = {x:0, y:0};
    this.speedFactor = 1;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    this.renderer.setPixelRatio(DPR);
    this.renderer.setSize(this.w, this.h);
    this.renderer.setClearColor(0x0d1320, 1);
    container.appendChild(this.renderer.domElement);

    // Scene + Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, this.w/this.h, 0.1, 100);
    this.camera.position.set(0,0,6);

    // Lights base
    this.ambient = new THREE.AmbientLight(0x304050, 0.6);
    this.scene.add(this.ambient);
    this.key = new THREE.DirectionalLight(0xffffff, 1);
    this.key.position.set(3,4,5);
    this.scene.add(this.key);

    // Interacción
    const card = this.el.closest('.card-pro');
    card.addEventListener('mouseenter', ()=> this.speedFactor = 1.8);
    card.addEventListener('mouseleave', ()=> this.speedFactor = 1.0);
    this.el.addEventListener('mousemove', e=>{
      const r = this.el.getBoundingClientRect();
      this.mouse.x = ( (e.clientX - r.left) / r.width ) * 2 - 1;
      this.mouse.y = ( (e.clientY - r.top) / r.height) * 2 - 1;
    });

    window.addEventListener('resize', ()=>this.onResize());

    // Init per type
    this.init();
    this.t = 0;
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  onResize(){
    this.w = this.el.clientWidth;
    this.h = 300;
    this.camera.aspect = this.w/this.h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.w,this.h);
  }

  init(){
    switch(this.type){
      case 0: this.initCubeLightOrbit(); break;
      case 1: this.initSphereSpot(); break;
      case 2: this.initTorusKnotHSL(); break;
      case 3: this.initGalaxyPoints(); break;
      case 4: this.initMorphIcosa(); break;
      case 5: this.initInstancedGrid(); break;
    }
  }

  /* ----- 0) Cubo con luz móvil (PointLight orbitando) ----- */
  initCubeLightOrbit(){
    const geo = new THREE.BoxGeometry(2,2,2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x00d1ff,
      roughness: 0.35,
      metalness: 0.5,
      clearcoat: 0.4
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    this.pl = new THREE.PointLight(0xffeeaa, 2, 20, 2);
    this.scene.add(this.pl);
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16,16),
      new THREE.MeshBasicMaterial({ color:0xffeeaa })
    );
    this.pl.add(this.sphere);
  }
  drawCubeLightOrbit(dt){
    this.mesh.rotation.x += 0.01*this.speedFactor;
    this.mesh.rotation.y += 0.012*this.speedFactor;
    const r = 3.2;
    const a = this.t*0.9;
    this.pl.position.set(Math.cos(a)*r, Math.sin(a*1.4)*1.2, Math.sin(a)*r);
  }

  /* ----- 1) Esfera con Spotlight escaneando ----- */
  initSphereSpot(){
    const geo = new THREE.SphereGeometry(1.6, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x86f0ff, roughness: 0.35, metalness: 0.2, emissive:0x0a1122, emissiveIntensity:0.2
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    this.spot = new THREE.SpotLight(0x88ccff, 2.2, 20, Math.PI/6, 0.25, 1.5);
    this.spot.position.set(0, 3.5, 3.5);
    this.scene.add(this.spot);
    this.spot.target = this.mesh;

    this.rim = new THREE.DirectionalLight(0x2266ff, 0.6);
    this.rim.position.set(-3,-2,5);
    this.scene.add(this.rim);
  }
  drawSphereSpot(dt){
    this.mesh.rotation.y += 0.01*this.speedFactor;
    const a = this.t*0.7;
    this.spot.position.x = Math.sin(a)*3.5;
    this.spot.position.y = 2.5 + Math.cos(a*1.2)*0.8;
  }

  /* ----- 2) TorusKnot con color HSL cambiante ----- */
  initTorusKnotHSL(){
    const geo = new THREE.TorusKnotGeometry(1.0, 0.35, 220, 24);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness:0.25, metalness:0.7 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
  }
  drawTorusKnotHSL(dt){
    const hue = ( (this.t*30) % 360 )/360;
    this.mesh.material.color.setHSL(hue, 0.8, 0.6);
    this.mesh.rotation.x += 0.012*this.speedFactor;
    this.mesh.rotation.y += 0.016*this.speedFactor;
    // Parallax por mouse
    this.mesh.position.x = this.mouse.x*0.5;
    this.mesh.position.y = -this.mouse.y*0.3;
  }

  /* ----- 3) Galaxia de puntos (Particles) ----- */
  initGalaxyPoints(){
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const r = Math.random()*2.6;
      const a = Math.random()*Math.PI*2;
      pos[i*3]   = Math.cos(a)*r;
      pos[i*3+1] = (Math.random()-0.5)*1.2;
      pos[i*3+2] = Math.sin(a)*r;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({ size: 0.03, color: 0x88eaff, transparent:true, opacity:0.9 });
    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }
  drawGalaxyPoints(dt){
    this.points.rotation.y += 0.0025*this.speedFactor;
    this.points.rotation.x = this.mouse.y*0.1;
  }

  /* ----- 4) Icosaedro deformado (vertex displacement) ----- */
  initMorphIcosa(){
    const geo = new THREE.IcosahedronGeometry(1.6, 3);
    this.basePos = geo.attributes.position.array.slice();
    const mat = new THREE.MeshStandardMaterial({ color:0x8efcff, roughness:0.25, metalness:0.4, flatShading:false });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
  }
  drawMorphIcosa(dt){
    const pos = this.mesh.geometry.attributes.position.array;
    for(let i=0;i<pos.length;i+=3){
      const x=pos[i], y=pos[i+1], z=pos[i+2];
      const bx=this.basePos[i], by=this.basePos[i+1], bz=this.basePos[i+2];
      const n = Math.sin(0.6*this.t + (bx+by+bz));
      const s = 1 + n*0.08*this.speedFactor;
      pos[i]   = bx * s;
      pos[i+1] = by * s;
      pos[i+2] = bz * s;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.rotation.y += 0.008*this.speedFactor;
    this.mesh.rotation.x += 0.004*this.speedFactor;
  }

  /* ----- 5) Instanced grid ondulante ----- */
  initInstancedGrid(){
    const COUNT = 18;
    const inst = COUNT*COUNT;
    const geo = new THREE.BoxGeometry(0.18,0.18,0.18);
    const mat = new THREE.MeshStandardMaterial({ color:0x00d1ff, roughness:0.3, metalness:0.5 });
    this.mesh = new THREE.InstancedMesh(geo, mat, inst);
    this.scene.add(this.mesh);
    this.count=COUNT;
    this.tmp = new THREE.Object3D();
  }
  drawInstancedGrid(dt){
    const N = this.count;
    const t = this.t*1.1*this.speedFactor;
    const centerX = this.mouse.x * 4; // centro de onda con mouse
    const centerY = this.mouse.y * 4;
    let id=0;
    for(let i=0;i<N;i++){
      for(let j=0;j<N;j++){
        const x = (i - N/2)*0.25;
        const y = (j - N/2)*0.25;
        const d = Math.hypot(i - centerX, j - centerY);
        const z = Math.sin(d*0.25 - t)*0.35;
        this.tmp.position.set(x, z, y);
        this.tmp.rotation.set(0, 0, 0);
        const s = 0.9 + (Math.sin(d*0.25 - t)*0.1);
        this.tmp.scale.setScalar(s);
        this.tmp.updateMatrix();
        this.mesh.setMatrixAt(id++, this.tmp.matrix);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  animate(){
    this.t += 0.02;
    // movimiento suave de cámara según mouse
    this.camera.position.x += (this.mouse.x*0.6 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouse.y*0.4 - this.camera.position.y) * 0.05;
    this.camera.lookAt(0,0,0);

    switch(this.type){
      case 0: this.drawCubeLightOrbit(); break;
      case 1: this.drawSphereSpot(); break;
      case 2: this.drawTorusKnotHSL(); break;
      case 3: this.drawGalaxyPoints(); break;
      case 4: this.drawMorphIcosa(); break;
      case 5: this.drawInstancedGrid(); break;
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

document.querySelectorAll('.canvas3d').forEach(el=>{
  const type = parseInt(el.dataset.anim3d,10)||0;
  new Scene3D(el, type);
});
