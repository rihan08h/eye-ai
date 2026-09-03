import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Brain, Zap, ScanEye, WifiOff, GitBranch, Bot, BarChart3, FileText } from 'lucide-react';

const ORBITAL_BADGES = [
  { label: 'AI Analysis', sub: '5-Stage DR Classification', icon: Brain, color: '#06b6d4', pos: 'top-[12%] right-[8%]' },
  { label: 'Offline Screening', sub: 'Works Anywhere', icon: WifiOff, color: '#3b82f6', pos: 'top-[12%] left-[8%]' },
  { label: 'Grad-CAM', sub: 'Explainable Heatmaps', icon: ScanEye, color: '#8b5cf6', pos: 'top-[40%] left-[2%]' },
  { label: 'Referral Support', sub: 'Connect Specialists', icon: GitBranch, color: '#ef4444', pos: 'top-[40%] right-[2%]' },
  { label: 'Fast Results', sub: 'In Seconds', icon: Zap, color: '#f59e0b', pos: 'bottom-[25%] left-[6%]' },
  { label: 'Patient Registry', sub: 'Track & Follow-up', icon: FileText, color: '#10b981', pos: 'bottom-[25%] right-[6%]' },
  { label: 'AI Assistant', sub: 'Guidance & Support', icon: Bot, color: '#ec4899', pos: 'bottom-[5%] right-[20%]' },
];

export default function HeroRetina3D() {
  const mountRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth;
    const height = currentMount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // ── Retinal Texture ──────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createRadialGradient(512, 256, 10, 512, 256, 420);
    bgGrad.addColorStop(0, '#7f1d1d');
    bgGrad.addColorStop(0.3, '#450a0a');
    bgGrad.addColorStop(0.7, '#1e0505');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle texture noise
    for (let i = 0; i < 3000; i++) {
      const tx = Math.random() * 1024;
      const ty = Math.random() * 512;
      ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${30 + Math.random() * 30}, ${30 + Math.random() * 30}, ${Math.random() * 0.15})`;
      ctx.fillRect(tx, ty, 1.5, 1.5);
    }

    // Optic Disc glow
    const discGrad = ctx.createRadialGradient(690, 252, 4, 690, 252, 52);
    discGrad.addColorStop(0, '#fde68a');
    discGrad.addColorStop(0.5, '#f59e0b');
    discGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(690, 252, 52, 0, Math.PI * 2);
    ctx.fill();

    // Vascular network — multiple widths
    const drawVessel = (sx, sy, branches, alpha, width_px) => {
      ctx.lineWidth = width_px;
      ctx.strokeStyle = `rgba(251, 100, 120, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      let x = sx, y = sy;
      for (let i = 0; i < branches; i++) {
        x += (Math.random() - 0.42) * 60;
        y += (Math.random() - 0.5) * 70;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    for (let i = 0; i < 12; i++) drawVessel(690, 252, 9, 0.9, 2.5);
    for (let i = 0; i < 20; i++) drawVessel(690, 252, 7, 0.55, 1.5);
    for (let i = 0; i < 30; i++) drawVessel(690, 252, 5, 0.25, 0.8);

    // Macular area dark zone
    const macGrad = ctx.createRadialGradient(490, 252, 5, 490, 252, 70);
    macGrad.addColorStop(0, 'rgba(10,5,5,0.6)');
    macGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = macGrad;
    ctx.beginPath();
    ctx.arc(490, 252, 70, 0, Math.PI * 2);
    ctx.fill();

    // AI scan ring (macular)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(490, 252, 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const retinaTexture = new THREE.CanvasTexture(canvas);

    // ── Main Sphere ──────────────────────────────────────────────────────────
    const geo = new THREE.SphereGeometry(1.7, 72, 72);
    const mat = new THREE.MeshStandardMaterial({
      map: retinaTexture,
      roughness: 0.2,
      metalness: 0.15,
      emissive: new THREE.Color(0x0d1426),
      emissiveIntensity: 0.5,
    });
    const sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);

    // ── Holographic Wireframe Shell ──────────────────────────────────────────
    const wireGeo = new THREE.SphereGeometry(1.78, 36, 36);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.09,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wireMesh);

    // ── Orbit Rings ──────────────────────────────────────────────────────────
    const makeRing = (r, rx, ry, color, opacity) => {
      const g = new THREE.RingGeometry(r - 0.01, r + 0.01, 160);
      const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity });
      const ring = new THREE.Mesh(g, m);
      ring.rotation.x = rx;
      ring.rotation.y = ry;
      scene.add(ring);
      return ring;
    };
    const ring1 = makeRing(2.2, Math.PI / 3, Math.PI / 6, 0x06b6d4, 0.4);
    const ring2 = makeRing(2.55, -Math.PI / 3.2, Math.PI / 3, 0x3b82f6, 0.28);
    const ring3 = makeRing(2.9, Math.PI / 2.2, 0, 0x8b5cf6, 0.15);

    // ── Ambient Particles ────────────────────────────────────────────────────
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(200 * 3);
    for (let i = 0; i < 200 * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 10;
      pPos[i + 1] = (Math.random() - 0.5) * 10;
      pPos[i + 2] = (Math.random() - 0.5) * 8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0.45 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const l1 = new THREE.PointLight(0x06b6d4, 3.5, 14);
    l1.position.set(3.5, 2, 4);
    scene.add(l1);
    const l2 = new THREE.PointLight(0x3b82f6, 2.5, 12);
    l2.position.set(-3, -2, 2);
    scene.add(l2);
    const l3 = new THREE.PointLight(0x8b5cf6, 1.5, 10);
    l3.position.set(0, -3, -2);
    scene.add(l3);

    // ── Mouse Parallax ───────────────────────────────────────────────────────
    const handleMouseMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Animation Loop ───────────────────────────────────────────────────────
    let animId;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sphere.rotation.y = t * 0.14;
      wireMesh.rotation.y = t * 0.17;
      wireMesh.rotation.x = Math.sin(t * 0.08) * 0.06;
      ring1.rotation.z = t * 0.06;
      ring2.rotation.z = -t * 0.045;
      ring3.rotation.z = t * 0.03;
      particles.rotation.y = t * 0.018;

      camera.position.x += (mousePos.current.x * 0.4 - camera.position.x) * 0.035;
      camera.position.y += (mousePos.current.y * 0.4 - camera.position.y) * 0.035;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const handleResize = () => {
      if (!currentMount) return;
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) currentMount.removeChild(renderer.domElement);
      geo.dispose(); mat.dispose(); wireGeo.dispose(); wireMat.dispose();
      pGeo.dispose(); pMat.dispose(); retinaTexture.dispose(); renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] select-none">
      {/* WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Radial Glow Behind Sphere */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-r from-cyan-500/12 via-blue-600/18 to-purple-600/12 blur-[90px]" />
      </div>

      {/* Orbital Feature Badges — positioned around the sphere like reference */}
      {ORBITAL_BADGES.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.label}
            className={`absolute ${badge.pos} flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md pointer-events-none z-10`}
            style={{
              background: 'rgba(6,10,22,0.75)',
              borderColor: `${badge.color}40`,
              boxShadow: `0 0 18px -4px ${badge.color}30`,
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${badge.color}18`, color: badge.color }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-white whitespace-nowrap">{badge.label}</p>
              <p className="text-[9px] text-slate-400 whitespace-nowrap">{badge.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
