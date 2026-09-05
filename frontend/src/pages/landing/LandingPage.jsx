import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/* ============================================================================

   RetinaAI — landing page

   Drop-in for a React + Vite app. No external dependencies, no Tailwind.

   All styles are scoped under .ra-root and injected once below.

   Wire it up:

     <Route path="/" element={<RetinaLanding onStartScreening={() => nav('/screening')}

                                            onSignIn={() => nav('/login')} />} />

   Both handlers are optional; they fall back to normal <a href> navigation.

   ========================================================================== */

/* ---------------------------------------------------------------- utilities */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const lerp = (a, b, t) => a + (b - a) * t;

function useReducedMotion() {

  const [reduced, setReduced] = useState(false);

  useEffect(() => {

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const on = () => setReduced(mq.matches);

    on();

    mq.addEventListener?.("change", on);

    return () => mq.removeEventListener?.("change", on);

  }, []);

  return reduced;

}

function useFinePointer() {

  const [fine, setFine] = useState(false);

  useEffect(() => {

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");

    const on = () => setFine(mq.matches);

    on();

    mq.addEventListener?.("change", on);

    return () => mq.removeEventListener?.("change", on);

  }, []);

  return fine;

}

/* Reveals content once when it enters the viewport. One quiet transition,

   not a different animation per section. */

function useReveal() {

  const ref = useRef(null);

  useEffect(() => {

    const el = ref.current;

    if (!el) return;

    if (!("IntersectionObserver" in window)) {

      el.setAttribute("data-in", "true");

      return;

    }

    const io = new IntersectionObserver(

      (entries) => {

        entries.forEach((e) => {

          if (e.isIntersecting) {

            e.target.setAttribute("data-in", "true");

            io.unobserve(e.target);

          }

        });

      },

      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }

    );

    io.observe(el);

    return () => io.disconnect();

  }, []);

  return ref;

}

/* Deterministic RNG so the vessel tree is identical on every render/resize. */

function mulberry32(seed) {

  let a = seed >>> 0;

  return function () {

    a |= 0;

    a = (a + 0x6d2b79f5) | 0;

    let t = Math.imul(a ^ (a >>> 15), 1 | a);

    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  };

}

/* ------------------------------------------------------- fundus rendering --

   The hero visual is a procedurally drawn fundus photograph: optic disc,

   branching vessel tree, macula, vignette. The Grad-CAM layer is drawn on a

   second buffer and masked to a soft circle that follows the pointer, so the

   explanation is literally something you uncover by moving your hand.

--------------------------------------------------------------------------- */

const LESIONS = [

  { x: 0.365, y: 0.435, r: 0.15, label: "Microaneurysms", side: "left" },

  { x: 0.605, y: 0.615, r: 0.13, label: "Hard exudates", side: "right" },

  { x: 0.53, y: 0.315, r: 0.1, label: "Haemorrhage", side: "right" },

];

function buildVessels(seed = 7) {

  const rnd = mulberry32(seed);

  const segs = [];

  const disc = { x: 0.735, y: 0.47 };

  const grow = (x, y, angle, len, width, depth) => {

    if (depth <= 0 || width < 0.0012) return;

    const steps = 3;

    let px = x;

    let py = y;

    let a = angle;

    for (let i = 0; i < steps; i++) {

      a += (rnd() - 0.5) * 0.42;

      const l = len / steps;

      const nx = px + Math.cos(a) * l;

      const ny = py + Math.sin(a) * l;

      segs.push({

        x1: px,

        y1: py,

        x2: nx,

        y2: ny,

        w: width * (1 - i * 0.06),

        d: depth,

      });

      px = nx;

      py = ny;

    }

    const branches = depth > 3 ? 2 : rnd() > 0.35 ? 2 : 1;

    for (let b = 0; b < branches; b++) {

      const spread = (rnd() * 0.55 + 0.18) * (b === 0 ? -1 : 1);

      grow(px, py, a + spread, len * (0.68 + rnd() * 0.16), width * 0.68, depth - 1);

    }

  };

  const trunks = 7;

  for (let i = 0; i < trunks; i++) {

    const a = Math.PI * 0.62 + (i / (trunks - 1)) * Math.PI * 0.76 + (rnd() - 0.5) * 0.16;

    grow(disc.x, disc.y, a, 0.19 + rnd() * 0.05, 0.011, 5);

  }

  return { segs, disc };

}

function paintFundus(ctx, size, vessels, opts = {}) {

  const { segs, disc } = vessels;

  const { flat = false } = opts;

  const S = size;

  const cx = S / 2;

  const cy = S / 2;

  const R = S * 0.5;

  ctx.clearRect(0, 0, S, S);

  ctx.save();

  ctx.beginPath();

  ctx.arc(cx, cy, R, 0, Math.PI * 2);

  ctx.clip();

  // Retinal tissue

  const g = ctx.createRadialGradient(cx * 0.9, cy * 0.85, R * 0.05, cx, cy, R);

  g.addColorStop(0, "#e29a56");

  g.addColorStop(0.42, "#c46a2c");

  g.addColorStop(0.78, "#8e3f16");

  g.addColorStop(1, "#4b1d0b");

  ctx.fillStyle = g;

  ctx.fillRect(0, 0, S, S);

  // Choroidal mottling

  const rnd = mulberry32(19);

  ctx.globalAlpha = 0.06;

  for (let i = 0; i < 90; i++) {

    const a = rnd() * Math.PI * 2;

    const d = Math.sqrt(rnd()) * R;

    const rr = S * (0.01 + rnd() * 0.05);

    ctx.fillStyle = rnd() > 0.5 ? "#f2b273" : "#5e260c";

    ctx.beginPath();

    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr, 0, Math.PI * 2);

    ctx.fill();

  }

  ctx.globalAlpha = 1;

  // Macula

  const mg = ctx.createRadialGradient(S * 0.42, S * 0.5, 0, S * 0.42, S * 0.5, S * 0.17);

  mg.addColorStop(0, "rgba(74,26,10,0.75)");

  mg.addColorStop(1, "rgba(74,26,10,0)");

  ctx.fillStyle = mg;

  ctx.fillRect(0, 0, S, S);

  // Vessels

  ctx.lineCap = "round";

  for (const s of segs) {

    ctx.strokeStyle = s.d > 3 ? "rgba(104,21,14,0.92)" : "rgba(126,34,22,0.8)";

    ctx.lineWidth = Math.max(0.6, s.w * S);

    ctx.beginPath();

    ctx.moveTo(s.x1 * S, s.y1 * S);

    ctx.lineTo(s.x2 * S, s.y2 * S);

    ctx.stroke();

  }

  // Vessel sheen

  ctx.globalAlpha = 0.16;

  for (const s of segs) {

    if (s.d < 4) continue;

    ctx.strokeStyle = "#ffb27a";

    ctx.lineWidth = Math.max(0.4, s.w * S * 0.32);

    ctx.beginPath();

    ctx.moveTo(s.x1 * S, s.y1 * S);

    ctx.lineTo(s.x2 * S, s.y2 * S);

    ctx.stroke();

  }

  ctx.globalAlpha = 1;

  // Optic disc

  const dg = ctx.createRadialGradient(

    disc.x * S, disc.y * S, S * 0.005,

    disc.x * S, disc.y * S, S * 0.085

  );

  dg.addColorStop(0, "#ffe9c0");

  dg.addColorStop(0.55, "#f3c887");

  dg.addColorStop(1, "rgba(214,140,66,0)");

  ctx.fillStyle = dg;

  ctx.beginPath();

  ctx.arc(disc.x * S, disc.y * S, S * 0.085, 0, Math.PI * 2);

  ctx.fill();

  // Lesion texture — small, quiet, physically plausible

  const lr = mulberry32(41);

  for (const L of LESIONS) {

    const n = 9;

    for (let i = 0; i < n; i++) {

      const a = lr() * Math.PI * 2;

      const d = Math.sqrt(lr()) * L.r * 0.42 * S;

      const rr = S * (0.0035 + lr() * 0.006);

      ctx.fillStyle = L.label === "Hard exudates" ? "rgba(255,229,170,0.82)" : "rgba(96,14,10,0.85)";

      ctx.beginPath();

      ctx.arc(L.x * S + Math.cos(a) * d, L.y * S + Math.sin(a) * d, rr, 0, Math.PI * 2);

      ctx.fill();

    }

  }

  // Vignette

  const v = ctx.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);

  v.addColorStop(0, "rgba(0,0,0,0)");

  v.addColorStop(1, "rgba(6,12,14,0.92)");

  ctx.fillStyle = v;

  ctx.fillRect(0, 0, S, S);

  if (!flat) {

    // Capture highlight

    const h = ctx.createRadialGradient(S * 0.3, S * 0.24, 0, S * 0.3, S * 0.24, S * 0.5);

    h.addColorStop(0, "rgba(255,238,214,0.16)");

    h.addColorStop(1, "rgba(255,238,214,0)");

    ctx.fillStyle = h;

    ctx.fillRect(0, 0, S, S);

  }

  ctx.restore();

}

function paintHeat(ctx, size, t) {

  const S = size;

  ctx.clearRect(0, 0, S, S);

  ctx.save();

  ctx.beginPath();

  ctx.arc(S / 2, S / 2, S * 0.5, 0, Math.PI * 2);

  ctx.clip();

  ctx.globalCompositeOperation = "lighter";

  LESIONS.forEach((L, i) => {

    const pulse = 1 + Math.sin(t * 0.0011 + i * 1.7) * 0.06;

    const r = L.r * S * pulse;

    const g = ctx.createRadialGradient(L.x * S, L.y * S, 0, L.x * S, L.y * S, r);

    g.addColorStop(0.0, "rgba(255,64,32,0.95)");

    g.addColorStop(0.22, "rgba(255,132,24,0.72)");

    g.addColorStop(0.48, "rgba(238,214,44,0.4)");

    g.addColorStop(0.74, "rgba(52,201,140,0.2)");

    g.addColorStop(1.0, "rgba(24,184,212,0)");

    ctx.fillStyle = g;

    ctx.beginPath();

    ctx.arc(L.x * S, L.y * S, r, 0, Math.PI * 2);

    ctx.fill();

  });

  // Low-activation wash so the map reads as a field, not three dots

  const w = ctx.createRadialGradient(S * 0.48, S * 0.5, S * 0.1, S * 0.48, S * 0.5, S * 0.46);

  w.addColorStop(0, "rgba(24,184,212,0.16)");

  w.addColorStop(1, "rgba(24,184,212,0)");

  ctx.fillStyle = w;

  ctx.fillRect(0, 0, S, S);

  ctx.restore();

}

/* --------------------------------------------------------- the hero visual */

function FundusStage({ reduced, fine }) {

  const wrapRef = useRef(null);

  const canvasRef = useRef(null);

  const state = useRef({

    // pointer in stage space, 0..1

    px: 0.5, py: 0.42,

    lx: 0.5, ly: 0.42,     // lerped lens

    rx: 0, ry: 0,          // lerped tilt

    trx: 0, try_: 0,

    engaged: false,

    size: 0,

  });

  const buffers = useRef({ base: null, heat: null });

  const vessels = useMemo(() => buildVessels(7), []);

  const rebuild = useCallback(() => {

    const cv = canvasRef.current;

    const wrap = wrapRef.current;

    if (!cv || !wrap) return;

    const rect = wrap.getBoundingClientRect();

    const css = Math.max(200, Math.min(rect.width, rect.height));

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const S = Math.round(css * dpr);

    cv.width = S;

    cv.height = S;

    cv.style.width = css + "px";

    cv.style.height = css + "px";

    const mk = () => {

      const c = document.createElement("canvas");

      c.width = S;

      c.height = S;

      return c;

    };

    const base = mk();

    paintFundus(base.getContext("2d"), S, vessels);

    buffers.current = { base, heat: mk() };

    state.current.size = S;

  }, [vessels]);

  useLayoutEffect(() => {

    rebuild();

    const wrap = wrapRef.current;

    if (!wrap) return;

    const ro = new ResizeObserver(() => rebuild());

    ro.observe(wrap);

    return () => ro.disconnect();

  }, [rebuild]);

  useEffect(() => {

    const wrap = wrapRef.current;

    const cv = canvasRef.current;

    if (!wrap || !cv) return;

    const ctx = cv.getContext("2d");

    let raf = 0;

    let t0 = performance.now();

    const onMove = (e) => {

      const r = wrap.getBoundingClientRect();

      const s = state.current;

      s.px = clamp((e.clientX - r.left) / r.width, -0.4, 1.4);

      s.py = clamp((e.clientY - r.top) / r.height, -0.4, 1.4);

      s.engaged = true;

      // Tilt is driven from the whole viewport so the object feels physical,

      // not like a widget that only wakes up on hover.

      s.trx = clamp((0.5 - e.clientY / window.innerHeight) * 13, -9, 9);

      s.try_ = clamp((e.clientX / window.innerWidth - 0.5) * 17, -11, 11);

    };

    const onLeave = () => { state.current.engaged = false; };

    if (fine && !reduced) {

      window.addEventListener("pointermove", onMove, { passive: true });

      window.addEventListener("pointerleave", onLeave);

    }

    const frame = (now) => {

      const t = now - t0;

      const s = state.current;

      const S = s.size;

      const { base, heat } = buffers.current;

      if (S && base && heat) {

        // Idle: the lens drifts on a slow Lissajous path so touch users and

        // anyone sitting still still see the map being read.

        let tx = s.px, ty = s.py;

        if (!s.engaged || reduced) {

          tx = 0.5 + Math.cos(t * 0.00034) * 0.2;

          ty = 0.48 + Math.sin(t * 0.00047) * 0.19;

        }

        s.lx = lerp(s.lx, tx, reduced ? 1 : 0.085);

        s.ly = lerp(s.ly, ty, reduced ? 1 : 0.085);

        s.rx = lerp(s.rx, reduced ? 0 : s.trx, 0.06);

        s.ry = lerp(s.ry, reduced ? 0 : s.try_, 0.06);

        wrap.style.setProperty("--rx", s.rx.toFixed(3) + "deg");

        wrap.style.setProperty("--ry", s.ry.toFixed(3) + "deg");

        wrap.style.setProperty("--lx", (s.lx * 100).toFixed(2) + "%");

        wrap.style.setProperty("--ly", (s.ly * 100).toFixed(2) + "%");

        const hctx = heat.getContext("2d");

        paintHeat(hctx, S, reduced ? 0 : t);

        // Mask the activation map to a soft disc under the pointer

        hctx.globalCompositeOperation = "destination-in";

        const lensR = S * 0.3;

        const m = hctx.createRadialGradient(

          s.lx * S, s.ly * S, lensR * 0.16,

          s.lx * S, s.ly * S, lensR

        );

        m.addColorStop(0, "rgba(255,255,255,1)");

        m.addColorStop(0.62, "rgba(255,255,255,0.82)");

        m.addColorStop(1, "rgba(255,255,255,0)");

        hctx.fillStyle = m;

        hctx.fillRect(0, 0, S, S);

        hctx.globalCompositeOperation = "source-over";

        ctx.clearRect(0, 0, S, S);

        ctx.drawImage(base, 0, 0);

        ctx.globalAlpha = 0.9;

        ctx.drawImage(heat, 0, 0);

        ctx.globalAlpha = 1;

      }

      raf = requestAnimationFrame(frame);

    };

    raf = requestAnimationFrame(frame);

    return () => {

      cancelAnimationFrame(raf);

      window.removeEventListener("pointermove", onMove);

      window.removeEventListener("pointerleave", onLeave);

    };

  }, [fine, reduced]);

  return (

    <div className="ra-stage" ref={wrapRef} aria-hidden="true">

      <div className="ra-stage__depth">

        <div className="ra-stage__glow" />

        <div className="ra-stage__plate">

          <canvas ref={canvasRef} className="ra-fundus" />

          <div className="ra-stage__ring" />

          <div className="ra-stage__lens" />

        </div>

        <div className="ra-chip ra-chip--tl">

          <span className="ra-chip__k">Right eye · 45° fundus</span>

          <span className="ra-chip__v">IMG_00418</span>

        </div>

        <div className="ra-chip ra-chip--br">

          <span className="ra-chip__k">Grade</span>

          <span className="ra-chip__v ra-chip__v--lg">Moderate NPDR</span>

          <div className="ra-meter"><i style={{ "--w": "94.8%" }} /></div>

          <span className="ra-chip__k">Confidence 94.8%</span>

        </div>

      </div>

    </div>

  );

}

/* ---------------------------------------------------- Grad-CAM comparison */

function CompareFigure() {

  const wrapRef = useRef(null);

  const aRef = useRef(null);

  const bRef = useRef(null);

  const [pos, setPos] = useState(52);

  const dragging = useRef(false);

  const vessels = useMemo(() => buildVessels(7), []);

  const draw = useCallback(() => {

    const wrap = wrapRef.current;

    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const S = Math.round(Math.min(rect.width, rect.height) * dpr);

    [aRef.current, bRef.current].forEach((c) => {

      if (!c) return;

      c.width = S;

      c.height = S;

    });

    const a = aRef.current?.getContext("2d");

    const b = bRef.current?.getContext("2d");

    if (!a || !b) return;

    paintFundus(a, S, vessels, { flat: true });

    paintFundus(b, S, vessels, { flat: true });

    const heat = document.createElement("canvas");

    heat.width = heat.height = S;

    paintHeat(heat.getContext("2d"), S, 0);

    b.globalAlpha = 0.82;

    b.drawImage(heat, 0, 0);

    b.globalAlpha = 1;

  }, [vessels]);

  useLayoutEffect(() => {

    draw();

    const wrap = wrapRef.current;

    if (!wrap) return;

    const ro = new ResizeObserver(draw);

    ro.observe(wrap);

    return () => ro.disconnect();

  }, [draw]);

  const setFromEvent = (clientX) => {

    const r = wrapRef.current.getBoundingClientRect();

    setPos(clamp(((clientX - r.left) / r.width) * 100, 2, 98));

  };

  const onKey = (e) => {

    if (e.key === "ArrowLeft") { setPos((p) => clamp(p - 4, 2, 98)); e.preventDefault(); }

    if (e.key === "ArrowRight") { setPos((p) => clamp(p + 4, 2, 98)); e.preventDefault(); }

    if (e.key === "Home") { setPos(2); e.preventDefault(); }

    if (e.key === "End") { setPos(98); e.preventDefault(); }

  };

  useEffect(() => {

    const move = (e) => { if (dragging.current) setFromEvent(e.clientX); };

    const up = () => { dragging.current = false; };

    window.addEventListener("pointermove", move);

    window.addEventListener("pointerup", up);

    return () => {

      window.removeEventListener("pointermove", move);

      window.removeEventListener("pointerup", up);

    };

  }, []);

  return (

    <div className="ra-compare">

      <div

        className="ra-compare__frame"

        ref={wrapRef}

        style={{ "--pos": pos + "%" }}

        onPointerDown={(e) => { dragging.current = true; setFromEvent(e.clientX); }}

      >

        <canvas ref={aRef} className="ra-compare__img" />

        <div className="ra-compare__clip">

          <canvas ref={bRef} className="ra-compare__img" />

        </div>

        <span className="ra-compare__tag ra-compare__tag--l">Fundus image</span>

        <span className="ra-compare__tag ra-compare__tag--r">Grad-CAM overlay</span>

        <div

          className="ra-compare__handle"

          role="slider"

          tabIndex={0}

          aria-label="Reveal the Grad-CAM overlay"

          aria-valuemin={0}

          aria-valuemax={100}

          aria-valuenow={Math.round(pos)}

          aria-valuetext={`Overlay revealed ${Math.round(pos)} percent`}

          onKeyDown={onKey}

        >

          <span className="ra-compare__grip" />

        </div>

      </div>

      <p className="ra-compare__hint">Drag the divider, or use the arrow keys, to compare.</p>

    </div>

  );

}

/* ------------------------------------------------------------ cursor lens */

function CursorLens({ enabled }) {

  const dot = useRef(null);

  const ring = useRef(null);

  useEffect(() => {

    if (!enabled) return;

    const s = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, scale: 1 };

    let raf = 0;

    const move = (e) => {

      s.x = e.clientX;

      s.y = e.clientY;

      const t = e.target;

      const hot = t instanceof Element && t.closest("a,button,[role='slider'],input,summary,.ra-tilt");

      s.scale = hot ? 1.9 : 1;

      document.documentElement.style.setProperty("--ra-cursor-op", "1");

    };

    const leave = () => document.documentElement.style.setProperty("--ra-cursor-op", "0");

    const loop = () => {

      s.rx = lerp(s.rx, s.x, 0.16);

      s.ry = lerp(s.ry, s.y, 0.16);

      if (dot.current) dot.current.style.transform = `translate3d(${s.x}px,${s.y}px,0) translate(-50%,-50%)`;

      if (ring.current)

        ring.current.style.transform = `translate3d(${s.rx}px,${s.ry}px,0) translate(-50%,-50%) scale(${s.scale})`;

      raf = requestAnimationFrame(loop);

    };

    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", move, { passive: true });

    document.addEventListener("pointerleave", leave);

    return () => {

      cancelAnimationFrame(raf);

      window.removeEventListener("pointermove", move);

      document.removeEventListener("pointerleave", leave);

    };

  }, [enabled]);

  if (!enabled) return null;

  return (

    <>

      <span ref={ring} className="ra-cursor ra-cursor--ring" aria-hidden="true" />

      <span ref={dot} className="ra-cursor ra-cursor--dot" aria-hidden="true" />

    </>

  );

}

/* --------------------------------------------------------------- tilt card */

function Tilt({ children, className = "", strength = 7, as: Tag = "div", ...rest }) {

  const ref = useRef(null);

  const raf = useRef(0);

  const target = useRef({ rx: 0, ry: 0, mx: 50, my: 50 });

  const cur = useRef({ rx: 0, ry: 0, mx: 50, my: 50 });

  const run = () => {

    const el = ref.current;

    if (!el) return;

    const c = cur.current;

    const t = target.current;

    c.rx = lerp(c.rx, t.rx, 0.12);

    c.ry = lerp(c.ry, t.ry, 0.12);

    c.mx = lerp(c.mx, t.mx, 0.12);

    c.my = lerp(c.my, t.my, 0.12);

    el.style.setProperty("--trx", c.rx.toFixed(3) + "deg");

    el.style.setProperty("--try", c.ry.toFixed(3) + "deg");

    el.style.setProperty("--mx", c.mx.toFixed(2) + "%");

    el.style.setProperty("--my", c.my.toFixed(2) + "%");

    if (Math.abs(c.rx - t.rx) > 0.01 || Math.abs(c.ry - t.ry) > 0.01 || Math.abs(c.mx - t.mx) > 0.1) {

      raf.current = requestAnimationFrame(run);

    } else {

      raf.current = 0;

    }

  };

  const kick = () => { if (!raf.current) raf.current = requestAnimationFrame(run); };

  const onMove = (e) => {

    const el = ref.current;

    if (!el) return;

    const r = el.getBoundingClientRect();

    const px = (e.clientX - r.left) / r.width;

    const py = (e.clientY - r.top) / r.height;

    target.current = {

      rx: (0.5 - py) * strength,

      ry: (px - 0.5) * strength,

      mx: px * 100,

      my: py * 100,

    };

    kick();

  };

  const onLeave = () => { target.current = { rx: 0, ry: 0, mx: 50, my: 50 }; kick(); };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (

    <Tag ref={ref} className={`ra-tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>

      <span className="ra-tilt__sheen" aria-hidden="true" />

      <span className="ra-tilt__inner">{children}</span>

    </Tag>

  );

}

/* ------------------------------------------------------------------ marks */

const Mark = ({ size = 26 }) => (

  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">

    <path d="M2 16c4.4-6.7 8.9-10 13.6-10S24.9 9.3 30 16c-4.7 6.7-9.4 10-14.2 10S6.4 22.7 2 16Z"

      stroke="var(--ra-accent)" strokeWidth="1.6" strokeLinejoin="round" />

    <circle cx="16" cy="16" r="5.1" stroke="var(--ra-accent)" strokeWidth="1.6" />

    <circle cx="16" cy="16" r="1.9" fill="var(--ra-accent-2)" />

  </svg>

);

const Icon = ({ name }) => {

  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

  const paths = {

    offline: <><path d="M4 13a8 8 0 0 1 13-6.2" {...p} /><path d="M20 11a8 8 0 0 1-13 6.2" {...p} /><path d="M17 3v4h-4M7 21v-4h4" {...p} /></>,

    lock: <><rect x="4" y="10" width="16" height="10" rx="2.4" {...p} /><path d="M8 10V7a4 4 0 0 1 8 0v3" {...p} /><path d="M12 14v2.4" {...p} /></>,

    field: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" {...p} /><circle cx="12" cy="10" r="2.6" {...p} /></>,

  };

  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;

};

/* ------------------------------------------------------------------- page */

export function RetinaLanding({ onStartScreening, onSignIn, onRequestPilot }) {

  const reduced = useReducedMotion();

  const fine = useFinePointer();

  const [scrolled, setScrolled] = useState(false);

  const [menu, setMenu] = useState(false);

  useEffect(() => {

    const on = () => setScrolled(window.scrollY > 12);

    on();

    window.addEventListener("scroll", on, { passive: true });

    return () => window.removeEventListener("scroll", on);

  }, []);

  useEffect(() => {

    document.body.style.overflow = menu ? "hidden" : "";

    return () => { document.body.style.overflow = ""; };

  }, [menu]);

  const go = (handler, href) => (e) => {

    if (handler) { e.preventDefault(); handler(); }

    setMenu(false);

  };

  const nav = [

    ["Platform", "#platform"],

    ["How it works", "#how"],

    ["Technology", "#technology"],

    ["Impact", "#impact"],

  ];

  const r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal(),

    r5 = useReveal(), r6 = useReveal(), r7 = useReveal();

  return (

    <div className={`ra-root${reduced ? " ra-root--still" : ""}`}>

      <style>{CSS}</style>

      <CursorLens enabled={fine && !reduced} />

      <a className="ra-skip" href="#main">Skip to content</a>

      {/* ------------------------------------------------------------ nav */}

      <header className={`ra-nav${scrolled ? " is-scrolled" : ""}`}>

        <div className="ra-container ra-nav__bar">

          <a className="ra-logo" href="/" onClick={() => setMenu(false)}>

            <Mark />

            <span>Retina<em>AI</em></span>

          </a>

          <nav className="ra-nav__links" aria-label="Primary">

            {nav.map(([label, href]) => (

              <a key={href} href={href}>{label}</a>

            ))}

          </nav>

          <div className="ra-nav__actions">

            <a className="ra-btn ra-btn--ghost" href="/login" onClick={go(onSignIn)}>Sign in</a>

            <a className="ra-btn ra-btn--primary" href="/screening" onClick={go(onStartScreening)}>

              Start screening <span aria-hidden="true">→</span>

            </a>

          </div>

          <button

            className="ra-burger"

            aria-expanded={menu}

            aria-controls="ra-menu"

            aria-label={menu ? "Close menu" : "Open menu"}

            onClick={() => setMenu((m) => !m)}

          >

            <span /><span />

          </button>

        </div>

      </header>

      <div id="ra-menu" className={`ra-sheet${menu ? " is-open" : ""}`} hidden={!menu}>

        <nav aria-label="Mobile">

          {nav.map(([label, href]) => (

            <a key={href} href={href} onClick={() => setMenu(false)}>{label}</a>

          ))}

        </nav>

        <div className="ra-sheet__actions">

          <a className="ra-btn ra-btn--ghost" href="/login" onClick={go(onSignIn)}>Sign in</a>

          <a className="ra-btn ra-btn--primary" href="/screening" onClick={go(onStartScreening)}>

            Start screening <span aria-hidden="true">→</span>

          </a>

        </div>

      </div>

      <main id="main">

        {/* --------------------------------------------------------- hero */}

        <section className="ra-hero">

          <div className="ra-hero__field" aria-hidden="true" />

          <div className="ra-container ra-hero__grid">

            <div className="ra-hero__copy" ref={r1} data-reveal>

              <p className="ra-eyebrow"><i /> Explainable AI for retinal health</p>

              <h1 className="ra-h1">

                Find retinal disease early.<br />Show the clinician why.

              </h1>

              <p className="ra-lede">

                RetinaAI grades a fundus image in seconds and marks the exact regions behind

                the result — in clinics, community health centres, and places where the nearest

                ophthalmologist is a day away.

              </p>

              <div className="ra-cta-row">

                <a className="ra-btn ra-btn--primary ra-btn--lg" href="/screening" onClick={go(onStartScreening)}>

                  Start screening <span aria-hidden="true">→</span>

                </a>

                <a className="ra-btn ra-btn--line ra-btn--lg" href="#platform">Explore the platform</a>

              </div>

              <dl className="ra-facts">

                <div><dt>Analysis time</dt><dd>11s</dd></div>

                <div><dt>Agreement with graders</dt><dd>94.8%</dd></div>

                <div><dt>Connectivity needed</dt><dd>None</dd></div>

              </dl>

            </div>

            <div className="ra-hero__visual" ref={r2} data-reveal>

              <FundusStage reduced={reduced} fine={fine} />

              <p className="ra-hero__caption">

                {fine ? "Move your cursor across the scan to read the activation map."

                      : "Touch and drag across the scan to read the activation map."}

              </p>

            </div>

          </div>

        </section>

        {/* -------------------------------------------------------- trust */}

        <section className="ra-strip">

          <div className="ra-container ra-strip__in">

            <p>Running in district hospitals, primary health centres and camp screening programmes across Karnataka, Telangana and Andhra Pradesh.</p>

            <ul>

              <li>DPDP-aligned records</li>

              <li>DICOM &amp; JPEG intake</li>

              <li>English · हिन्दी · తెలుగు</li>

            </ul>

          </div>

        </section>

        {/* ---------------------------------------------- explainable ai */}

        <section className="ra-section" id="platform">

          <div className="ra-container ra-split" ref={r3} data-reveal>

            <div className="ra-split__copy">

              <p className="ra-label">Explainability</p>

              <h2 className="ra-h2">A grade is not enough. The evidence has to travel with it.</h2>

              <p className="ra-body">

                Every result carries a Grad-CAM map generated from the same network that made the

                call. The clinician sees which vessels, exudates and haemorrhages drove the grade,

                so a second opinion takes seconds rather than a referral.

              </p>

              <ul className="ra-ticks">

                <li>Region-level activation, not a single score</li>

                <li>Grade, confidence and evidence exported as one PDF</li>

                <li>Low-confidence cases routed to a human grader automatically</li>

              </ul>

            </div>

            <div className="ra-split__figure">

              <CompareFigure />

              <Tilt className="ra-result" strength={5}>

                <p className="ra-result__k">Detection result</p>

                <p className="ra-result__grade">Moderate NPDR</p>

                <div className="ra-result__row">

                  <span>Confidence</span>

                  <div className="ra-meter"><i style={{ "--w": "94.8%" }} /></div>

                  <span>94.8%</span>

                </div>

                <p className="ra-result__rec">

                  Refer to ophthalmology within 3 months. Repeat imaging at follow-up.

                </p>

              </Tilt>

            </div>

          </div>

        </section>

        {/* ------------------------------------------------------- how it works */}

        <section className="ra-section ra-section--alt" id="how">

          <div className="ra-container" ref={r4} data-reveal>

            <div className="ra-head">

              <p className="ra-label">How it works</p>

              <h2 className="ra-h2">Four steps, one visit</h2>

            </div>

            <ol className="ra-steps">

              {[

                ["Capture", "A health worker photographs both eyes with a handheld or tabletop fundus camera. No dilation workflow changes."],

                ["Analyse", "The model grades the image on device in about eleven seconds. Nothing waits on a network connection."],

                ["Explain", "Grad-CAM marks the regions behind the grade, alongside confidence and image-quality flags."],

                ["Refer", "Positive and uncertain cases enter a referral queue with the evidence attached, tracked to outcome."],

              ].map(([t, d], i) => (

                <li key={t} style={{ "--i": i }}>

                  <span className="ra-steps__n">{String(i + 1).padStart(2, "0")}</span>

                  <h3>{t}</h3>

                  <p>{d}</p>

                </li>

              ))}

            </ol>

          </div>

        </section>

        {/* -------------------------------------------------- real-world care */}

        <section className="ra-section" id="technology">

          <div className="ra-container ra-split ra-split--tight" ref={r5} data-reveal>

            <div className="ra-split__copy">

              <p className="ra-label">Built for real-world care</p>

              <h2 className="ra-h2">Designed for the conditions the clinic actually has</h2>

              <p className="ra-body">

                Most screening tools assume a stable connection, a trained grader and a quiet room.

                RetinaAI assumes none of those, and still produces a record an ophthalmologist can act on.

              </p>

            </div>

            <div className="ra-features">

              {[

                ["offline", "Works offline", "Inference runs locally. Results, images and audit entries sync when a connection returns — no queue is lost if the camp ends before the network comes back."],

                ["lock", "Records with boundaries", "Role-scoped access, full audit trail and patient-level consent. Images stay in the deployment's own storage."],

                ["field", "Made for field teams", "One-handed capture flow, image-quality checks at the point of capture, and printable summaries for patients who have no smartphone."],

              ].map(([icon, t, d]) => (

                <Tilt key={t} className="ra-feature" strength={5}>

                  <span className="ra-feature__icon"><Icon name={icon} /></span>

                  <h3>{t}</h3>

                  <p>{d}</p>

                </Tilt>

              ))}

            </div>

          </div>

        </section>

        {/* ------------------------------------------------------- dashboard */}

        <section className="ra-section ra-section--alt">

          <div className="ra-container" ref={r6} data-reveal>

            <div className="ra-head ra-head--center">

              <p className="ra-label">The workspace</p>

              <h2 className="ra-h2">Every screening, from capture to closed referral</h2>

              <p className="ra-body ra-body--center">

                Programme managers see volume and yield. Clinicians see the queue that needs them today.

              </p>

            </div>

            <Tilt className="ra-dash" strength={4}>

              <div className="ra-dash__chrome"><span /><span /><span /><b>RetinaAI · Screening overview</b></div>

              <div className="ra-dash__body">

                <div className="ra-dash__kpis">

                  {[["Screened this week", "1,284", "+18%"], ["Referable found", "146", "11.4%"], ["Median turnaround", "11s", "stable"], ["Referrals closed", "89", "+6%"]].map(([k, v, d]) => (

                    <div key={k}><span>{k}</span><strong>{v}</strong><em>{d}</em></div>

                  ))}

                </div>

                <div className="ra-dash__cols">

                  <div className="ra-dash__panel">

                    <p className="ra-dash__ph">Screenings by day</p>

                    <div className="ra-bars">

                      {[42, 58, 51, 74, 66, 88, 61].map((h, i) => (

                        <i key={i} style={{ "--h": h + "%", "--d": i * 55 + "ms" }} />

                      ))}

                    </div>

                    <div className="ra-bars__x"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div>

                  </div>

                  <div className="ra-dash__panel">

                    <p className="ra-dash__ph">Referral queue</p>

                    <ul className="ra-queue">

                      {[["P-10442", "Severe NPDR", "urgent"], ["P-10438", "Moderate NPDR", "soon"], ["P-10431", "Low confidence", "review"], ["P-10429", "Mild NPDR", "routine"]].map(([id, g, s]) => (

                        <li key={id}><b>{id}</b><span>{g}</span><em className={`ra-pill ra-pill--${s}`}>{s}</em></li>

                      ))}

                    </ul>

                  </div>

                </div>

              </div>

            </Tilt>

          </div>

        </section>

        {/* ---------------------------------------------------------- impact */}

        <section className="ra-section" id="impact">

          <div className="ra-container" ref={r7} data-reveal>

            <div className="ra-impact">

              <div className="ra-impact__copy">

                <p className="ra-label">Impact</p>

                <h2 className="ra-h2">Diabetic retinopathy is preventable blindness. Screening is the bottleneck.</h2>

                <p className="ra-body">

                  India has roughly one ophthalmologist for every 100,000 people, and most of them

                  practise in cities. Screening at the point of primary care is the only way the

                  numbers work — and it only works if the tool explains itself.

                </p>

                <a className="ra-btn ra-btn--line" href="/pilot" onClick={go(onRequestPilot)}>Request a pilot</a>

              </div>

              <dl className="ra-stats">

                {[["1 in 3", "adults with diabetes develop retinopathy"], ["90%", "of vision loss is avoidable with timely treatment"], ["11s", "median time from capture to graded result"], ["0", "specialist visits needed to complete a screening"]].map(([n, d]) => (

                  <div key={n}><dt>{n}</dt><dd>{d}</dd></div>

                ))}

              </dl>

            </div>

          </div>

        </section>

        {/* ------------------------------------------------------------- cta */}

        <section className="ra-cta">

          <div className="ra-container ra-cta__in">

            <h2 className="ra-h2">Start with one clinic. Scale to a district.</h2>

            <p className="ra-body ra-body--center">

              Bring your own cameras and staff. We will have your first site screening within a week.

            </p>

            <div className="ra-cta-row ra-cta-row--center">

              <a className="ra-btn ra-btn--primary ra-btn--lg" href="/screening" onClick={go(onStartScreening)}>

                Start screening <span aria-hidden="true">→</span>

              </a>

              <a className="ra-btn ra-btn--line ra-btn--lg" href="/pilot" onClick={go(onRequestPilot)}>Talk to the team</a>

            </div>

          </div>

        </section>

      </main>

      {/* ---------------------------------------------------------- footer */}

      <footer className="ra-footer">

        <div className="ra-container ra-footer__grid">

          <div>

            <a className="ra-logo" href="/"><Mark size={22} /><span>Retina<em>AI</em></span></a>

            <p className="ra-footer__note">Explainable retinal screening for the places specialists cannot reach.</p>

          </div>

          <nav aria-label="Product"><h4>Product</h4>

            <a href="#platform">Platform</a><a href="#how">How it works</a><a href="#technology">Technology</a><a href="/screening" onClick={go(onStartScreening)}>Start screening</a>

          </nav>

          <nav aria-label="Organisation"><h4>Organisation</h4>

            <a href="/about">About</a><a href="/research">Research</a><a href="/pilot" onClick={go(onRequestPilot)}>Pilot programme</a><a href="/contact">Contact</a>

          </nav>

          <nav aria-label="Legal"><h4>Legal</h4>

            <a href="/privacy">Privacy</a><a href="/security">Security</a><a href="/terms">Terms</a>

          </nav>

        </div>

        <div className="ra-container ra-footer__base">

          <p>© {new Date().getFullYear()} RetinaAI</p>

          <p>Screening support tool. Not a substitute for clinical diagnosis.</p>

        </div>

      </footer>

    </div>

  );

}

/* ============================================================================

   Styles — all scoped under .ra-root so nothing leaks into the rest of the app

   ========================================================================== */

const CSS = `

@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

.ra-root{

  --ra-bg:#071014;

  --ra-bg-2:#0a161b;

  --ra-surface:#0f1d23;

  --ra-surface-2:#132630;

  --ra-text:#f2f6f7;

  --ra-text-2:#a3b1b7;

  --ra-muted:#6f8188;

  --ra-accent:#18b8d4;

  --ra-accent-2:#3d6ee8;

  --ra-warm:#e08a3c;

  --ra-ok:#34c98c;

  --ra-warn:#f5b942;

  --ra-danger:#ef5b5b;

  --ra-line:rgba(255,255,255,.085);

  --ra-line-2:rgba(255,255,255,.16);

  --ra-r-sm:10px; --ra-r-md:16px; --ra-r-lg:26px;

  --ra-max:1280px;

  --ra-gutter:clamp(1.25rem,4vw,3rem);

  --ra-nav-h:72px;

  --ra-section:clamp(4.5rem,9vw,8rem);

  background:var(--ra-bg);

  color:var(--ra-text);

  font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;

  font-size:16px;

  line-height:1.6;

  -webkit-font-smoothing:antialiased;

  overflow-x:clip;

  position:relative;

  isolation:isolate;

}

.ra-root *,.ra-root *::before,.ra-root *::after{box-sizing:border-box}

.ra-root h1,.ra-root h2,.ra-root h3,.ra-root h4,.ra-root p,.ra-root ul,.ra-root ol,.ra-root dl,.ra-root dd,.ra-root figure{margin:0;padding:0}

.ra-root ul,.ra-root ol{list-style:none}

.ra-root img,.ra-root canvas,.ra-root svg{display:block;max-width:100%}

.ra-root a{color:inherit;text-decoration:none}

.ra-root button{font:inherit;color:inherit;background:none;border:0}

.ra-root :focus-visible{outline:2px solid var(--ra-accent);outline-offset:3px;border-radius:6px}

.ra-skip{position:absolute;left:-9999px;top:0;z-index:200;background:var(--ra-accent);color:#04222a;padding:.7rem 1rem;border-radius:0 0 10px 0;font-weight:600}

.ra-skip:focus{left:0}

.ra-container{width:min(100% - var(--ra-gutter)*2,var(--ra-max));margin-inline:auto}

/* ------------------------------------------------------------- typography */

.ra-h1{

  font-size:clamp(2.35rem,4.6vw,3.9rem);

  line-height:1.05;

  letter-spacing:-.028em;

  font-weight:600;

  text-wrap:balance;

  max-width:16ch;

}

.ra-h2{

  font-size:clamp(1.75rem,2.9vw,2.6rem);

  line-height:1.13;

  letter-spacing:-.024em;

  font-weight:600;

  text-wrap:balance;

  max-width:22ch;

}

.ra-head--center .ra-h2,.ra-cta .ra-h2{max-width:26ch;margin-inline:auto}

.ra-root h3{font-size:1.0625rem;line-height:1.35;letter-spacing:-.012em;font-weight:600}

.ra-lede{font-size:clamp(1.02rem,1.15vw,1.14rem);color:var(--ra-text-2);max-width:52ch;margin-top:1.15rem}

.ra-body{color:var(--ra-text-2);max-width:56ch}

.ra-body--center{margin-inline:auto;text-align:center;max-width:50ch}

.ra-label{

  font-size:.8125rem;font-weight:600;letter-spacing:.01em;color:var(--ra-accent);

  display:flex;align-items:center;gap:.6rem;margin-bottom:.9rem;

}

.ra-label::before{content:"";width:22px;height:1px;background:var(--ra-accent);opacity:.6}

.ra-head--center .ra-label{justify-content:center}

.ra-eyebrow{

  display:inline-flex;align-items:center;gap:.55rem;

  font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;font-weight:600;

  color:var(--ra-text-2);

  border:1px solid var(--ra-line);border-radius:999px;

  padding:.4rem .85rem .4rem .7rem;background:rgba(255,255,255,.03);

}

.ra-eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--ra-accent);box-shadow:0 0 0 4px rgba(24,184,212,.16)}

.ra-root--still .ra-eyebrow i{animation:none}

.ra-eyebrow i{animation:ra-pulse 2.6s ease-in-out infinite}

@keyframes ra-pulse{0%,100%{box-shadow:0 0 0 3px rgba(24,184,212,.1)}50%{box-shadow:0 0 0 6px rgba(24,184,212,.22)}}

/* ------------------------------------------------------------------ reveal */

[data-reveal]{opacity:0;transform:translate3d(0,14px,0);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}

[data-reveal][data-in="true"]{opacity:1;transform:none}

.ra-root--still [data-reveal]{opacity:1;transform:none;transition:none}

/* ---------------------------------------------------------------- buttons */

.ra-btn{

  display:inline-flex;align-items:center;justify-content:center;gap:.5rem;

  min-height:44px;padding:.68rem 1.1rem;border-radius:12px;

  font-weight:600;font-size:.94rem;letter-spacing:-.005em;

  transition:background .22s,color .22s,border-color .22s,transform .22s,box-shadow .22s;

  will-change:transform;

}

.ra-btn--lg{min-height:52px;padding:.85rem 1.45rem;font-size:1rem}

.ra-btn--primary{background:var(--ra-accent);color:#03212a;box-shadow:0 8px 26px -14px rgba(24,184,212,.9)}

.ra-btn--primary:hover{background:#3fd0e8;transform:translateY(-1px)}

.ra-btn--line{border:1px solid var(--ra-line-2);color:var(--ra-text)}

.ra-btn--line:hover{border-color:var(--ra-accent);color:var(--ra-accent);background:rgba(24,184,212,.06)}

.ra-btn--ghost{color:var(--ra-text-2)}

.ra-btn--ghost:hover{color:var(--ra-text)}

.ra-btn span{transition:transform .22s}

.ra-btn:hover span{transform:translateX(3px)}

/* -------------------------------------------------------------------- nav */

.ra-nav{position:sticky;top:0;z-index:60;transition:background .3s,border-color .3s,backdrop-filter .3s;border-bottom:1px solid transparent}

.ra-nav.is-scrolled{background:rgba(7,16,20,.78);backdrop-filter:blur(14px);border-bottom-color:var(--ra-line)}

.ra-nav__bar{height:var(--ra-nav-h);display:flex;align-items:center;gap:clamp(1rem,3vw,2.5rem)}

.ra-logo{display:inline-flex;align-items:center;gap:.55rem;font-weight:700;letter-spacing:-.02em;font-size:1.06rem}

.ra-logo em{font-style:normal;color:var(--ra-accent)}

.ra-nav__links{display:flex;gap:clamp(1rem,2vw,1.9rem);margin-inline-start:auto;font-size:.94rem;color:var(--ra-text-2)}

.ra-nav__links a{position:relative;padding:.35rem 0;transition:color .2s}

.ra-nav__links a::after{content:"";position:absolute;left:0;right:100%;bottom:0;height:1px;background:var(--ra-accent);transition:right .28s cubic-bezier(.2,.7,.2,1)}

.ra-nav__links a:hover{color:var(--ra-text)}

.ra-nav__links a:hover::after{right:0}

.ra-nav__actions{display:flex;align-items:center;gap:.5rem;margin-inline-start:clamp(1rem,2vw,1.75rem)}

.ra-burger{display:none;width:44px;height:44px;margin-inline-start:auto;position:relative;cursor:pointer}

.ra-burger span{position:absolute;left:12px;right:12px;height:1.6px;background:var(--ra-text);transition:transform .28s,opacity .2s}

.ra-burger span:first-child{top:19px}

.ra-burger span:last-child{top:25px}

.ra-burger[aria-expanded="true"] span:first-child{transform:translateY(3px) rotate(45deg)}

.ra-burger[aria-expanded="true"] span:last-child{transform:translateY(-3px) rotate(-45deg)}

.ra-sheet{position:fixed;inset:var(--ra-nav-h) 0 0;z-index:55;background:rgba(7,16,20,.97);backdrop-filter:blur(16px);padding:2rem var(--ra-gutter);display:flex;flex-direction:column;gap:1.5rem}

.ra-sheet nav{display:flex;flex-direction:column}

.ra-sheet nav a{padding:1rem 0;border-bottom:1px solid var(--ra-line);font-size:1.15rem;font-weight:500}

.ra-sheet__actions{display:grid;gap:.75rem}

.ra-sheet__actions .ra-btn{width:100%}

/* ------------------------------------------------------------------- hero */

.ra-hero{position:relative;padding-block:clamp(3rem,6vw,5.5rem) clamp(3.5rem,7vw,6rem);overflow:clip}

.ra-hero__field{

  position:absolute;inset:-20% -10% auto;height:120%;z-index:-1;

  background:

    radial-gradient(46% 40% at 74% 30%,rgba(24,184,212,.16),transparent 70%),

    radial-gradient(38% 44% at 18% 8%,rgba(61,110,232,.14),transparent 70%);

  filter:blur(6px);

}

.ra-hero__grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,1fr);gap:clamp(2rem,5vw,4.5rem);align-items:center}

.ra-cta-row{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:2rem}

.ra-cta-row--center{justify-content:center}

.ra-facts{display:flex;flex-wrap:wrap;gap:clamp(1.25rem,3vw,2.75rem);margin-top:2.75rem;padding-top:1.75rem;border-top:1px solid var(--ra-line)}

.ra-facts dt{font-size:.8rem;color:var(--ra-muted)}

.ra-facts dd{font-size:1.4rem;font-weight:600;letter-spacing:-.02em;margin-top:.15rem}

.ra-hero__visual{display:flex;flex-direction:column;align-items:center;gap:1rem}

.ra-hero__caption{font-size:.82rem;color:var(--ra-muted);text-align:center;max-width:34ch}

/* 3D stage */

.ra-stage{width:100%;aspect-ratio:1;max-width:min(520px,86vw);perspective:1200px;perspective-origin:50% 45%}

.ra-stage__depth{

  position:relative;width:100%;height:100%;

  transform-style:preserve-3d;

  transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));

  will-change:transform;

}

.ra-stage__glow{

  position:absolute;inset:6%;border-radius:50%;transform:translateZ(-90px);

  background:radial-gradient(circle,rgba(24,184,212,.4),rgba(61,110,232,.14) 55%,transparent 72%);

  filter:blur(38px);

}

.ra-stage__plate{

  position:absolute;inset:0;display:grid;place-items:center;

  transform-style:preserve-3d;transform:translateZ(12px);

}

.ra-fundus{

  border-radius:50%;

  box-shadow:0 40px 90px -40px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.07);

}

.ra-stage__ring{

  position:absolute;inset:-3.5%;border-radius:50%;

  border:1px solid rgba(255,255,255,.12);

  transform:translateZ(44px);

  background:conic-gradient(from 0deg,transparent 0 78%,rgba(24,184,212,.55) 88%,transparent 100%);

  -webkit-mask:radial-gradient(circle,transparent 0 calc(50% - 2px),#000 calc(50% - 2px));

  mask:radial-gradient(circle,transparent 0 calc(50% - 2px),#000 calc(50% - 2px));

  animation:ra-spin 14s linear infinite;

}

.ra-root--still .ra-stage__ring{animation:none}

@keyframes ra-spin{to{transform:translateZ(44px) rotate(360deg)}}

.ra-stage__lens{

  position:absolute;width:26%;aspect-ratio:1;left:var(--lx,50%);top:var(--ly,45%);

  transform:translate(-50%,-50%) translateZ(58px);

  border-radius:50%;border:1px solid rgba(255,255,255,.34);

  box-shadow:inset 0 0 26px rgba(255,255,255,.1);

  pointer-events:none;

}

.ra-stage__lens::after{

  content:"";position:absolute;inset:38%;border-radius:50%;border:1px solid rgba(24,184,212,.7);

}

.ra-chip{

  position:absolute;display:grid;gap:.2rem;

  background:rgba(10,22,27,.82);backdrop-filter:blur(12px);

  border:1px solid var(--ra-line-2);border-radius:14px;

  padding:.7rem .85rem;min-width:150px;

  box-shadow:0 24px 50px -28px rgba(0,0,0,.95);

}

.ra-chip--tl{top:2%;left:-4%;transform:translateZ(78px)}

.ra-chip--br{bottom:1%;right:-6%;transform:translateZ(96px)}

.ra-chip__k{font-size:.68rem;color:var(--ra-muted);letter-spacing:.01em}

.ra-chip__v{font-size:.86rem;font-weight:600}

.ra-chip__v--lg{font-size:1.02rem;letter-spacing:-.015em}

.ra-meter{height:4px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin:.3rem 0 .18rem}

.ra-meter i{display:block;height:100%;width:var(--w,0%);border-radius:99px;background:linear-gradient(90deg,var(--ra-accent),var(--ra-ok))}

/* ------------------------------------------------------------------ strip */

.ra-strip{border-block:1px solid var(--ra-line);background:var(--ra-bg-2)}

.ra-strip__in{display:flex;flex-wrap:wrap;gap:1rem 2.5rem;align-items:center;justify-content:space-between;padding-block:1.35rem}

.ra-strip p{color:var(--ra-text-2);font-size:.92rem;max-width:58ch}

.ra-strip ul{display:flex;flex-wrap:wrap;gap:1.25rem;font-size:.82rem;color:var(--ra-muted)}

.ra-strip li{display:flex;align-items:center;gap:.45rem}

.ra-strip li::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--ra-accent);opacity:.75}

/* --------------------------------------------------------------- sections */

.ra-section{padding-block:var(--ra-section)}

.ra-section--alt{background:var(--ra-bg-2);border-block:1px solid var(--ra-line)}

.ra-head{margin-bottom:clamp(2rem,4vw,3.25rem)}

.ra-head--center{text-align:center}

.ra-split{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:clamp(2rem,5vw,4.5rem);align-items:center}

.ra-split--tight{align-items:start;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}

.ra-split__copy .ra-body{margin-top:1.1rem}

.ra-ticks{margin-top:1.6rem;display:grid;gap:.7rem}

.ra-ticks li{display:flex;gap:.65rem;color:var(--ra-text-2);font-size:.95rem}

.ra-ticks li::before{content:"";flex:none;width:16px;height:16px;margin-top:.28rem;border-radius:50%;border:1px solid rgba(24,184,212,.5);background:radial-gradient(circle,var(--ra-accent) 0 3px,transparent 3.5px)}

/* --------------------------------------------------------------- compare */

.ra-split__figure{display:grid;gap:1.25rem;grid-template-columns:minmax(0,1fr);align-content:start}

.ra-compare{display:grid;gap:.6rem}

.ra-compare__frame{

  position:relative;aspect-ratio:1;width:100%;max-width:520px;margin-inline:auto;

  border-radius:var(--ra-r-lg);overflow:hidden;cursor:ew-resize;touch-action:pan-y;

  border:1px solid var(--ra-line-2);background:#050c0f;

  box-shadow:0 40px 80px -50px rgba(0,0,0,.95);

}

.ra-compare__img{position:absolute;inset:0;width:100%;height:100%}

.ra-compare__clip{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--pos)) 0 0)}

.ra-compare__tag{

  position:absolute;bottom:.85rem;font-size:.7rem;letter-spacing:.04em;text-transform:uppercase;

  background:rgba(5,12,15,.72);border:1px solid var(--ra-line);border-radius:999px;padding:.3rem .6rem;color:var(--ra-text-2);

  backdrop-filter:blur(8px);

}

.ra-compare__tag--l{left:.85rem}

.ra-compare__tag--r{right:.85rem}

.ra-compare__handle{

  position:absolute;top:0;bottom:0;left:var(--pos);width:2px;background:rgba(255,255,255,.75);

  transform:translateX(-1px);display:grid;place-items:center;cursor:ew-resize;

}

.ra-compare__grip{

  width:38px;height:38px;border-radius:50%;background:rgba(7,16,20,.85);border:1px solid rgba(255,255,255,.5);

  display:grid;place-items:center;backdrop-filter:blur(8px);

}

.ra-compare__grip::before{content:"‹ ›";font-size:.9rem;color:#fff;letter-spacing:1px}

.ra-compare__hint{font-size:.78rem;color:var(--ra-muted);text-align:center}

.ra-result{padding:1.15rem 1.25rem;border-radius:var(--ra-r-md);border:1px solid var(--ra-line);background:var(--ra-surface)}

.ra-result__k{font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ra-muted)}

.ra-result__grade{font-size:1.3rem;font-weight:600;letter-spacing:-.02em;margin-top:.2rem}

.ra-result__row{display:flex;align-items:center;gap:.75rem;margin:.7rem 0 .6rem;font-size:.8rem;color:var(--ra-text-2)}

.ra-result__row .ra-meter{flex:1;margin:0}

.ra-result__rec{font-size:.9rem;color:var(--ra-text-2);border-top:1px solid var(--ra-line);padding-top:.7rem}

/* ------------------------------------------------------------------ steps */

.ra-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border-top:1px solid var(--ra-line)}

.ra-steps li{padding:1.75rem 1.5rem 0 0;border-right:1px solid var(--ra-line);position:relative}

.ra-steps li:last-child{border-right:0}

.ra-steps li::before{content:"";position:absolute;top:-1px;left:0;width:0;height:1px;background:var(--ra-accent);transition:width .8s cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--i) * 120ms)}

[data-in="true"] .ra-steps li::before{width:calc(100% - 1.5rem)}

.ra-steps li:last-child::before{width:0}

[data-in="true"] .ra-steps li:last-child::before{width:100%}

.ra-steps__n{font-size:.75rem;font-weight:600;color:var(--ra-accent)}

.ra-steps h3{margin:.5rem 0 .5rem}

.ra-steps p{font-size:.92rem;color:var(--ra-text-2);max-width:32ch}

/* --------------------------------------------------------------- features */

.ra-features{display:grid;gap:1rem}

.ra-feature{padding:1.4rem 1.5rem;border-radius:var(--ra-r-md);border:1px solid var(--ra-line);background:var(--ra-surface)}

.ra-feature__icon{display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:rgba(24,184,212,.1);color:var(--ra-accent);border:1px solid rgba(24,184,212,.22);margin-bottom:.9rem}

.ra-feature h3{margin-bottom:.4rem}

.ra-feature p{font-size:.93rem;color:var(--ra-text-2);max-width:56ch}

/* tilt shell */

.ra-tilt{position:relative;transform-style:preserve-3d;transform:perspective(900px) rotateX(var(--trx,0deg)) rotateY(var(--try,0deg));transition:border-color .3s,box-shadow .3s;will-change:transform;overflow:hidden}

.ra-tilt:hover{border-color:var(--ra-line-2);box-shadow:0 30px 60px -40px rgba(0,0,0,.9)}

.ra-tilt__sheen{position:absolute;inset:0;pointer-events:none;background:radial-gradient(300px circle at var(--mx,50%) var(--my,50%),rgba(24,184,212,.12),transparent 62%);opacity:0;transition:opacity .3s}

.ra-tilt:hover .ra-tilt__sheen{opacity:1}

.ra-tilt__inner{display:block;transform:translateZ(22px)}

.ra-root--still .ra-tilt{transform:none}

/* -------------------------------------------------------------- dashboard */

.ra-dash{margin-top:clamp(1.5rem,3vw,2.5rem);border-radius:var(--ra-r-lg);border:1px solid var(--ra-line-2);background:linear-gradient(180deg,var(--ra-surface),var(--ra-bg));box-shadow:0 60px 120px -70px rgba(0,0,0,1)}

.ra-dash__chrome{display:flex;align-items:center;gap:.45rem;padding:.75rem 1.1rem;border-bottom:1px solid var(--ra-line);font-size:.78rem;color:var(--ra-muted)}

.ra-dash__chrome span{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.14)}

.ra-dash__chrome b{margin-inline-start:.75rem;font-weight:500}

.ra-dash__body{padding:clamp(1rem,2.4vw,1.75rem);display:grid;gap:1rem}

.ra-dash__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.75rem}

.ra-dash__kpis>div{padding:.9rem 1rem;border:1px solid var(--ra-line);border-radius:var(--ra-r-sm);background:rgba(255,255,255,.02);display:grid;gap:.12rem}

.ra-dash__kpis span{font-size:.72rem;color:var(--ra-muted)}

.ra-dash__kpis strong{font-size:1.35rem;letter-spacing:-.02em;font-weight:600}

.ra-dash__kpis em{font-style:normal;font-size:.72rem;color:var(--ra-ok)}

.ra-dash__cols{display:grid;grid-template-columns:1.15fr 1fr;gap:.75rem}

.ra-dash__panel{padding:1rem;border:1px solid var(--ra-line);border-radius:var(--ra-r-sm);background:rgba(255,255,255,.02)}

.ra-dash__ph{font-size:.78rem;color:var(--ra-text-2);margin-bottom:.9rem}

.ra-bars{display:flex;align-items:flex-end;gap:.5rem;height:120px}

.ra-bars i{flex:1;height:var(--h);border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--ra-accent),rgba(61,110,232,.55));transform-origin:bottom;transform:scaleY(0);transition:transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d)}

[data-in="true"] .ra-bars i{transform:scaleY(1)}

.ra-root--still .ra-bars i{transform:scaleY(1);transition:none}

.ra-bars__x{display:flex;justify-content:space-between;margin-top:.5rem;font-size:.68rem;color:var(--ra-muted)}

.ra-queue{display:grid;gap:.45rem}

.ra-queue li{display:grid;grid-template-columns:auto 1fr auto;gap:.6rem;align-items:center;padding:.55rem .65rem;border-radius:8px;background:rgba(255,255,255,.03);font-size:.8rem}

.ra-queue b{font-weight:600;color:var(--ra-text)}

.ra-queue span{color:var(--ra-text-2)}

.ra-pill{font-style:normal;font-size:.68rem;padding:.16rem .5rem;border-radius:99px;border:1px solid currentColor}

.ra-pill--urgent{color:var(--ra-danger)}

.ra-pill--soon{color:var(--ra-warn)}

.ra-pill--review{color:var(--ra-accent)}

.ra-pill--routine{color:var(--ra-muted)}

/* ----------------------------------------------------------------- impact */

.ra-impact{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(2rem,5vw,4rem);align-items:center}

.ra-impact .ra-btn{margin-top:1.75rem}

.ra-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--ra-line);border:1px solid var(--ra-line);border-radius:var(--ra-r-md);overflow:hidden}

.ra-stats>div{background:var(--ra-bg);padding:1.5rem 1.35rem}

.ra-stats dt{font-size:clamp(1.7rem,3vw,2.3rem);font-weight:600;letter-spacing:-.03em;color:var(--ra-accent)}

.ra-stats dd{font-size:.86rem;color:var(--ra-text-2);margin-top:.3rem;max-width:24ch}

/* -------------------------------------------------------------------- cta */

.ra-cta{padding-block:var(--ra-section);border-top:1px solid var(--ra-line);background:

  radial-gradient(60% 100% at 50% 0%,rgba(24,184,212,.12),transparent 70%),var(--ra-bg-2)}

.ra-cta__in{text-align:center;display:grid;gap:1rem;justify-items:center}

/* ----------------------------------------------------------------- footer */

.ra-footer{border-top:1px solid var(--ra-line);padding-block:clamp(2.5rem,5vw,4rem) 1.5rem}

.ra-footer__grid{display:grid;grid-template-columns:1.6fr repeat(3,1fr);gap:2rem}

.ra-footer__note{font-size:.87rem;color:var(--ra-muted);margin-top:.8rem;max-width:34ch}

.ra-footer h4{font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;color:var(--ra-muted);margin-bottom:.85rem;font-weight:600}

.ra-footer nav{display:flex;flex-direction:column;gap:.55rem;font-size:.9rem;color:var(--ra-text-2)}

.ra-footer nav a:hover{color:var(--ra-accent)}

.ra-footer__base{display:flex;flex-wrap:wrap;gap:.5rem 1.5rem;justify-content:space-between;margin-top:2.5rem;padding-top:1.25rem;border-top:1px solid var(--ra-line);font-size:.78rem;color:var(--ra-muted)}

/* ----------------------------------------------------------------- cursor */

.ra-cursor{position:fixed;top:0;left:0;z-index:120;pointer-events:none;border-radius:50%;opacity:var(--ra-cursor-op,0);transition:opacity .3s}

.ra-cursor--dot{width:5px;height:5px;background:var(--ra-accent)}

.ra-cursor--ring{width:30px;height:30px;border:1px solid rgba(24,184,212,.55);transition:opacity .3s,width .2s,height .2s;backdrop-filter:invert(4%)}

/* ------------------------------------------------------------ responsive */

@media (max-width:1080px){

  .ra-split,.ra-split--tight,.ra-impact,.ra-hero__grid{grid-template-columns:minmax(0,1fr)}

  .ra-hero__grid{gap:2.75rem}

  .ra-h1,.ra-h2{max-width:20ch}

  .ra-steps{grid-template-columns:repeat(2,minmax(0,1fr))}

  .ra-steps li{padding-bottom:1.5rem;border-bottom:1px solid var(--ra-line)}

  .ra-steps li:nth-child(2n){border-right:0}

  .ra-steps li:nth-child(n+3){border-bottom:0}

  .ra-dash__cols{grid-template-columns:minmax(0,1fr)}

}

@media (max-width:900px){

  .ra-nav__links,.ra-nav__actions{display:none}

  .ra-burger{display:block}

  .ra-dash__kpis{grid-template-columns:repeat(2,minmax(0,1fr))}

}

@media (max-width:720px){

  .ra-root{--ra-section:clamp(3.25rem,11vw,4.5rem)}

  .ra-chip--tl{left:0;top:-2%}

  .ra-chip--br{right:0;bottom:-2%}

  .ra-chip{min-width:0;padding:.55rem .7rem}

  .ra-steps{grid-template-columns:minmax(0,1fr)}

  .ra-steps li{border-right:0;border-bottom:1px solid var(--ra-line);padding-right:0;padding-bottom:1.4rem}

  .ra-steps li:last-child{border-bottom:0}

  .ra-steps p{max-width:none}

  .ra-stats{grid-template-columns:minmax(0,1fr)}

  .ra-footer__grid{grid-template-columns:repeat(2,minmax(0,1fr))}

  .ra-facts{gap:1.1rem 1.75rem}

  .ra-facts dd{font-size:1.2rem}

  .ra-cta-row .ra-btn{flex:1 1 100%}

}

@media (max-width:420px){

  .ra-footer__grid{grid-template-columns:minmax(0,1fr)}

  .ra-dash__kpis{grid-template-columns:minmax(0,1fr)}

}

@media (prefers-reduced-motion:reduce){

  .ra-root *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}

}

`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <RetinaLanding
      onStartScreening={() => {
        if (isAuthenticated) {
          navigate('/screenings/new');
        } else {
          navigate('/login', { state: { from: { pathname: '/screenings/new' } } });
        }
      }}
      onSignIn={() => navigate('/login')}
      onRequestPilot={() => navigate('/login')}
    />
  );
}
