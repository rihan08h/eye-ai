import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/* ============================================================================

   RetinaAI — Sign in / Sign up

   Drop-in for React + Vite. No dependencies. Styles scoped under .ra-auth.

   Routes:

     <Route path="/login"  element={<SignIn  ... />} />

     <Route path="/signup" element={<SignUp ... />} />

   AUTH LOGIC IS YOURS. Pass your existing calls in:

     onSubmit({ ...fields })   -> your API call. Throw an Error to show a message.

     onSuccess(result)         -> where you redirect / set the JWT.

     onGoogle()  OR  googleAuthUrl="/api/auth/google"

         If NEITHER is passed, the Google button and its divider are not

         rendered at all. Nothing fake is shown.

     onNavigate(path)          -> your router push, for the tabs and footer links.

     apiBase="/api"            -> only used by the fallback fetch when you do

                                  not pass onSubmit.

   ========================================================================== */

/* ------------------------------------------------------------------ utils */

const lerp = (a, b, t) => a + (b - a) * t;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function useReducedMotion() {

  const [r, setR] = useState(false);

  useEffect(() => {

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const on = () => setR(mq.matches);

    on();

    mq.addEventListener?.("change", on);

    return () => mq.removeEventListener?.("change", on);

  }, []);

  return r;

}

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

/* ------------------------------------------------------- retina visual ----

   Same procedural fundus language as the landing page, but calmer: it scans

   on its own instead of chasing the cursor, so it never competes with the

   form for attention.

--------------------------------------------------------------------------- */

const LESIONS = [

  { x: 0.365, y: 0.435, r: 0.15 },

  { x: 0.605, y: 0.615, r: 0.13 },

  { x: 0.53, y: 0.315, r: 0.1 },

];

function buildVessels(seed = 7) {

  const rnd = mulberry32(seed);

  const segs = [];

  const disc = { x: 0.735, y: 0.47 };

  const grow = (x, y, angle, len, width, depth) => {

    if (depth <= 0 || width < 0.0012) return;

    let px = x, py = y, a = angle;

    for (let i = 0; i < 3; i++) {

      a += (rnd() - 0.5) * 0.42;

      const l = len / 3;

      const nx = px + Math.cos(a) * l;

      const ny = py + Math.sin(a) * l;

      segs.push({ x1: px, y1: py, x2: nx, y2: ny, w: width * (1 - i * 0.06), d: depth });

      px = nx; py = ny;

    }

    const branches = depth > 3 ? 2 : rnd() > 0.35 ? 2 : 1;

    for (let b = 0; b < branches; b++) {

      const spread = (rnd() * 0.55 + 0.18) * (b === 0 ? -1 : 1);

      grow(px, py, a + spread, len * (0.68 + rnd() * 0.16), width * 0.68, depth - 1);

    }

  };

  for (let i = 0; i < 7; i++) {

    const a = Math.PI * 0.62 + (i / 6) * Math.PI * 0.76 + (rnd() - 0.5) * 0.16;

    grow(disc.x, disc.y, a, 0.19 + rnd() * 0.05, 0.011, 5);

  }

  return { segs, disc };

}

function paintFundus(ctx, S, { segs, disc }) {

  const c = S / 2, R = S * 0.5;

  ctx.clearRect(0, 0, S, S);

  ctx.save();

  ctx.beginPath();

  ctx.arc(c, c, R, 0, Math.PI * 2);

  ctx.clip();

  const g = ctx.createRadialGradient(c * 0.9, c * 0.85, R * 0.05, c, c, R);

  g.addColorStop(0, "#e29a56");

  g.addColorStop(0.42, "#c46a2c");

  g.addColorStop(0.78, "#8e3f16");

  g.addColorStop(1, "#4b1d0b");

  ctx.fillStyle = g;

  ctx.fillRect(0, 0, S, S);

  const rnd = mulberry32(19);

  ctx.globalAlpha = 0.06;

  for (let i = 0; i < 70; i++) {

    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R;

    ctx.fillStyle = rnd() > 0.5 ? "#f2b273" : "#5e260c";

    ctx.beginPath();

    ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, S * (0.01 + rnd() * 0.05), 0, Math.PI * 2);

    ctx.fill();

  }

  ctx.globalAlpha = 1;

  const mg = ctx.createRadialGradient(S * 0.42, S * 0.5, 0, S * 0.42, S * 0.5, S * 0.17);

  mg.addColorStop(0, "rgba(74,26,10,0.75)");

  mg.addColorStop(1, "rgba(74,26,10,0)");

  ctx.fillStyle = mg;

  ctx.fillRect(0, 0, S, S);

  ctx.lineCap = "round";

  for (const s of segs) {

    ctx.strokeStyle = s.d > 3 ? "rgba(104,21,14,0.92)" : "rgba(126,34,22,0.8)";

    ctx.lineWidth = Math.max(0.6, s.w * S);

    ctx.beginPath();

    ctx.moveTo(s.x1 * S, s.y1 * S);

    ctx.lineTo(s.x2 * S, s.y2 * S);

    ctx.stroke();

  }

  const dg = ctx.createRadialGradient(disc.x * S, disc.y * S, S * 0.005, disc.x * S, disc.y * S, S * 0.085);

  dg.addColorStop(0, "#ffe9c0");

  dg.addColorStop(0.55, "#f3c887");

  dg.addColorStop(1, "rgba(214,140,66,0)");

  ctx.fillStyle = dg;

  ctx.beginPath();

  ctx.arc(disc.x * S, disc.y * S, S * 0.085, 0, Math.PI * 2);

  ctx.fill();

  const v = ctx.createRadialGradient(c, c, R * 0.6, c, c, R);

  v.addColorStop(0, "rgba(0,0,0,0)");

  v.addColorStop(1, "rgba(6,12,14,0.95)");

  ctx.fillStyle = v;

  ctx.fillRect(0, 0, S, S);

  ctx.restore();

}

function AuthVisual({ reduced }) {

  const wrap = useRef(null);

  const cv = useRef(null);

  const base = useRef(null);

  const size = useRef(0);

  const vessels = useMemo(() => buildVessels(7), []);

  useLayoutEffect(() => {

    const build = () => {

      const el = cv.current, w = wrap.current;

      if (!el || !w) return;

      const css = Math.max(160, Math.min(w.clientWidth, w.clientHeight));

      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const S = Math.round(css * dpr);

      el.width = S; el.height = S;

      el.style.width = css + "px"; el.style.height = css + "px";

      const b = document.createElement("canvas");

      b.width = S; b.height = S;

      paintFundus(b.getContext("2d"), S, vessels);

      base.current = b;

      size.current = S;

    };

    build();

    const ro = new ResizeObserver(build);

    if (wrap.current) ro.observe(wrap.current);

    return () => ro.disconnect();

  }, [vessels]);

  useEffect(() => {

    const el = cv.current;

    if (!el) return;

    const ctx = el.getContext("2d");

    let raf = 0;

    const t0 = performance.now();

    const frame = (now) => {

      const S = size.current;

      const b = base.current;

      if (S && b) {

        const t = reduced ? 4200 : now - t0;

        ctx.clearRect(0, 0, S, S);

        ctx.drawImage(b, 0, 0);

        ctx.save();

        ctx.beginPath();

        ctx.arc(S / 2, S / 2, S * 0.5, 0, Math.PI * 2);

        ctx.clip();

        ctx.globalCompositeOperation = "lighter";

        // Activation regions fade up as the sweep passes them

        const cycle = (t % 9000) / 9000;

        LESIONS.forEach((L, i) => {

          const phase = clamp(Math.sin((cycle * Math.PI * 2) - i * 0.9), 0, 1);

          const a = 0.25 + phase * 0.75;

          const r = L.r * S * (1 + phase * 0.08);

          const g = ctx.createRadialGradient(L.x * S, L.y * S, 0, L.x * S, L.y * S, r);

          g.addColorStop(0, `rgba(255,64,32,${0.85 * a})`);

          g.addColorStop(0.24, `rgba(255,132,24,${0.6 * a})`);

          g.addColorStop(0.5, `rgba(238,214,44,${0.32 * a})`);

          g.addColorStop(0.76, `rgba(52,201,140,${0.16 * a})`);

          g.addColorStop(1, "rgba(24,184,212,0)");

          ctx.fillStyle = g;

          ctx.beginPath();

          ctx.arc(L.x * S, L.y * S, r, 0, Math.PI * 2);

          ctx.fill();

        });

        if (!reduced) {

          // Scan sweep

          const y = (cycle * 1.25 - 0.12) * S;

          const sw = ctx.createLinearGradient(0, y - S * 0.09, 0, y + S * 0.02);

          sw.addColorStop(0, "rgba(24,184,212,0)");

          sw.addColorStop(0.82, "rgba(24,184,212,0.16)");

          sw.addColorStop(1, "rgba(180,246,255,0.42)");

          ctx.fillStyle = sw;

          ctx.fillRect(0, y - S * 0.09, S, S * 0.11);

        }

        ctx.restore();

      }

      raf = requestAnimationFrame(frame);

    };

    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);

  }, [reduced]);

  return (

    <div className="ra-visual" ref={wrap} aria-hidden="true">

      <div className="ra-visual__glow" />

      <canvas ref={cv} className="ra-visual__canvas" />

      <div className="ra-visual__ring" />

    </div>

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

const GoogleMark = () => (

  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">

    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />

    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />

    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />

    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />

  </svg>

);

const Spinner = () => <span className="ra-spinner" aria-hidden="true" />;

/* ----------------------------------------------------------------- fields */

function Field({ id, label, hint, error, children, action }) {

  return (

    <div className={`ra-field${error ? " has-error" : ""}`}>

      <div className="ra-field__top">

        <label htmlFor={id}>{label}</label>

        {action}

      </div>

      {children}

      {error ? (

        <p className="ra-field__msg" id={`${id}-error`}>

          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">

            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />

            <path d="M8 4.5v4.2M8 11.2v.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

          </svg>

          {error}

        </p>

      ) : hint ? (

        <p className="ra-field__hint" id={`${id}-hint`}>{hint}</p>

      ) : null}

    </div>

  );

}

function PasswordInput({ id, value, onChange, onBlur, error, hint, autoComplete, placeholder }) {

  const [show, setShow] = useState(false);

  return (

    <div className="ra-pw">

      <input

        id={id}

        name={id}

        type={show ? "text" : "password"}

        className="ra-input"

        value={value}

        onChange={onChange}

        onBlur={onBlur}

        autoComplete={autoComplete}

        placeholder={placeholder}

        aria-invalid={error ? "true" : undefined}

        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}

        required

      />

      <button

        type="button"

        className="ra-pw__toggle"

        onClick={() => setShow((s) => !s)}

        aria-pressed={show}

        aria-label={show ? "Hide password" : "Show password"}

      >

        {show ? (

          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">

            <path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8" />

            <path d="M6.6 6.7C4.6 8 3 10 2 12c2 4 6 7 10 7 1.8 0 3.4-.5 4.8-1.3M20.9 15.1C21.5 14.2 22 13.1 22 12c-2-4-6-7-10-7-.8 0-1.6.1-2.3.3" />

          </svg>

        ) : (

          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">

            <path d="M2 12c2-4 6-7 10-7s8 3 10 7c-2 4-6 7-10 7s-8-3-10-7Z" />

            <circle cx="12" cy="12" r="3" />

          </svg>

        )}

      </button>

    </div>

  );

}

function strengthOf(pw) {

  if (!pw) return { score: 0, label: "" };

  let s = 0;

  if (pw.length >= 8) s++;

  if (pw.length >= 12) s++;

  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;

  if (/\d/.test(pw)) s++;

  if (/[^\w\s]/.test(pw)) s++;

  const score = Math.min(4, s);

  return { score, label: ["Too short", "Weak", "Fair", "Strong", "Very strong"][score] };

}

/* ------------------------------------------------------------------ shell */

function AuthShell({ mode, onNavigate, children }) {

  const reduced = useReducedMotion();

  const go = (path) => (e) => {

    if (onNavigate) { e.preventDefault(); onNavigate(path); }

  };

  return (

    <div className="ra-auth">

      <style>{CSS}</style>

      <a className="ra-skip" href="#auth-form">Skip to the form</a>

      <div className="ra-auth__grid">

        <section className="ra-panel ra-panel--form">

          <header className="ra-panel__head">

            <a className="ra-logo" href="/" onClick={go("/")}>

              <Mark />

              <span>Retina<em>AI</em></span>

            </a>

            <nav className="ra-tabs" aria-label="Account">

              <a href="/login" onClick={go("/login")} aria-current={mode === "signin" ? "page" : undefined}>Sign in</a>

              <a href="/signup" onClick={go("/signup")} aria-current={mode === "signup" ? "page" : undefined}>Create account</a>

              <span className="ra-tabs__ink" data-mode={mode} aria-hidden="true" />

            </nav>

          </header>

          <div className="ra-panel__body" id="auth-form">{children}</div>

          <footer className="ra-panel__foot">

            <p>Clinical data stays inside your deployment. Access is role-scoped and audited.</p>

          </footer>

        </section>

        <aside className="ra-panel ra-panel--brand" aria-hidden="true">

          <div className="ra-brand__in">

            <p className="ra-brand__eyebrow"><i />Explainable AI for retinal screening</p>

            <h2 className="ra-brand__title">

              {mode === "signin"

                ? "Your screening queue, with the evidence attached."

                : "Set up a site and start screening this week."}

            </h2>

            <AuthVisual reduced={reduced} />

            <ul className="ra-brand__points">

              <li>Grad-CAM evidence on every grade</li>

              <li>Runs offline, syncs when the network returns</li>

              <li>Built with district hospitals and camp programmes</li>

            </ul>

          </div>

        </aside>

      </div>

    </div>

  );

}

/* ------------------------------------------------------------ social block */

function SocialBlock({ onGoogle, googleAuthUrl, busy, label }) {

  if (!onGoogle && !googleAuthUrl) return null;

  const click = () => {

    if (onGoogle) onGoogle();

    else window.location.href = googleAuthUrl;

  };

  return (

    <>

      <button type="button" className="ra-social" onClick={click} disabled={busy}>

        <GoogleMark />

        {label}

      </button>

      <div className="ra-or"><span>or use your email</span></div>

    </>

  );

}

function ErrorBanner({ message }) {

  return (

    <div className="ra-alert" role="alert">

      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">

        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />

        <path d="M8 4.4v4.3M8 11.2v.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />

      </svg>

      <span>{message}</span>

    </div>

  );

}

async function postJSON(url, body) {

  const res = await fetch(url, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    credentials: "include",

    body: JSON.stringify(body),

  });

  let data = null;

  try { data = await res.json(); } catch { /* empty body is fine */ }

  if (!res.ok) throw new Error(data?.message || data?.error || `Request failed (${res.status})`);

  return data;

}

/* =========================================================== SIGN IN page */

export function SignIn({

  onSubmit,

  onSuccess,

  onGoogle,

  googleAuthUrl,

  onNavigate,

  apiBase = "/api",

  error: externalError,

}) {

  const [values, setValues] = useState({ email: "", password: "" });

  const [remember, setRemember] = useState(true);

  const [touched, setTouched] = useState({});

  const [errors, setErrors] = useState({});

  const [formError, setFormError] = useState("");

  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const validate = (v) => {

    const e = {};

    if (!v.email.trim()) e.email = "Enter your work email.";

    else if (!EMAIL_RE.test(v.email.trim())) e.email = "That email address is not valid.";

    if (!v.password) e.password = "Enter your password.";

    return e;

  };

  useEffect(() => {

    setErrors(validate(values));

  }, [values]);

  const submit = async (e) => {

    e.preventDefault();

    const found = validate(values);

    setErrors(found);

    setTouched({ email: true, password: true });

    if (Object.keys(found).length) return;

    setFormError("");

    setBusy(true);

    try {

      const payload = { email: values.email.trim().toLowerCase(), password: values.password, remember };

      const result = onSubmit

        ? await onSubmit(payload)

        : await postJSON(`${apiBase}/auth/login`, payload);

      onSuccess?.(result);

    } catch (err) {

      setFormError(err?.message || "We could not sign you in. Try again.");

    } finally {

      setBusy(false);

    }

  };

  const shown = (k) => (touched[k] ? errors[k] : undefined);

  return (

    <AuthShell mode="signin" onNavigate={onNavigate}>

      <h1 className="ra-title">Welcome back</h1>

      <p className="ra-sub">Sign in to your clinical workspace.</p>

      {(formError || externalError) && <ErrorBanner message={formError || externalError} />}

      <SocialBlock onGoogle={onGoogle} googleAuthUrl={googleAuthUrl} busy={busy} label="Continue with Google" />

      <form className="ra-form" onSubmit={submit} noValidate>

        <Field id="email" label="Work email" error={shown("email")}>

          <input

            id="email" name="email" type="email" className="ra-input"

            value={values.email} onChange={set("email")} onBlur={blur("email")}

            autoComplete="email" placeholder="you@hospital.org"

            aria-invalid={shown("email") ? "true" : undefined}

            aria-describedby={shown("email") ? "email-error" : undefined}

            required

          />

        </Field>

        <Field

          id="password"

          label="Password"

          error={shown("password")}

          action={

            <a className="ra-link" href="/forgot-password"

               onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate("/forgot-password"); } }}>

              Forgot password?

            </a>

          }

        >

          <PasswordInput

            id="password" value={values.password} onChange={set("password")} onBlur={blur("password")}

            error={shown("password")} autoComplete="current-password" placeholder="••••••••••••"

          />

        </Field>

        <label className="ra-check">

          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />

          <span>Keep me signed in on this device</span>

        </label>

        <button className="ra-submit" type="submit" disabled={busy}>

          {busy ? <><Spinner /> Signing in</> : <>Sign in <span aria-hidden="true">→</span></>}

        </button>

      </form>

      <p className="ra-switch">

        New to RetinaAI?{" "}

        <a href="/signup" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate("/signup"); } }}>

          Create an account

        </a>

      </p>

    </AuthShell>

  );

}

/* =========================================================== SIGN UP page */

export function SignUp({

  onSubmit,

  onSuccess,

  onGoogle,

  googleAuthUrl,

  onNavigate,

  apiBase = "/api",

  roles = ["Clinician", "Health worker", "Programme admin"],

  error: externalError,

}) {

  const [values, setValues] = useState({

    fullName: "", email: "", organization: "", role: roles[0], password: "", confirm: "",

  });

  const [touched, setTouched] = useState({});

  const [errors, setErrors] = useState({});

  const [formError, setFormError] = useState("");

  const [busy, setBusy] = useState(false);

  const [agree, setAgree] = useState(false);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const pw = strengthOf(values.password);

  const validate = (v) => {

    const e = {};

    if (v.fullName.trim().length < 2) e.fullName = "Enter your full name.";

    if (!v.email.trim()) e.email = "Enter your work email.";

    else if (!EMAIL_RE.test(v.email.trim())) e.email = "That email address is not valid.";

    if (v.organization.trim().length < 2) e.organization = "Enter the clinic, hospital or programme you work with.";

    if (v.password.length < 8) e.password = "Use at least 8 characters.";

    if (v.confirm !== v.password) e.confirm = "Both passwords must match.";

    return e;

  };

  useEffect(() => { setErrors(validate(values)); }, [values]);

  const submit = async (e) => {

    e.preventDefault();

    const found = validate(values);

    setErrors(found);

    setTouched({ fullName: true, email: true, organization: true, password: true, confirm: true });

    if (Object.keys(found).length) return;

    if (!agree) { setFormError("Accept the terms and privacy notice to continue."); return; }

    setFormError("");

    setBusy(true);

    try {

      const payload = {

        fullName: values.fullName.trim(),

        email: values.email.trim().toLowerCase(),

        organization: values.organization.trim(),

        role: values.role,

        password: values.password,

      };

      const result = onSubmit

        ? await onSubmit(payload)

        : await postJSON(`${apiBase}/auth/register`, payload);

      onSuccess?.(result);

    } catch (err) {

      setFormError(err?.message || "We could not create your account. Try again.");

    } finally {

      setBusy(false);

    }

  };

  const shown = (k) => (touched[k] ? errors[k] : undefined);

  return (

    <AuthShell mode="signup" onNavigate={onNavigate}>

      <h1 className="ra-title">Create your account</h1>

      <p className="ra-sub">One account covers screening, referrals and reporting for your site.</p>

      {(formError || externalError) && <ErrorBanner message={formError || externalError} />}

      <SocialBlock onGoogle={onGoogle} googleAuthUrl={googleAuthUrl} busy={busy} label="Sign up with Google" />

      <form className="ra-form" onSubmit={submit} noValidate>

        <Field id="fullName" label="Full name" error={shown("fullName")}>

          <input

            id="fullName" name="fullName" className="ra-input" value={values.fullName}

            onChange={set("fullName")} onBlur={blur("fullName")} autoComplete="name" placeholder="Dr. Ananya Rao"

            aria-invalid={shown("fullName") ? "true" : undefined}

            aria-describedby={shown("fullName") ? "fullName-error" : undefined} required

          />

        </Field>

        <Field id="email" label="Work email" error={shown("email")}>

          <input

            id="email" name="email" type="email" className="ra-input" value={values.email}

            onChange={set("email")} onBlur={blur("email")} autoComplete="email" placeholder="you@hospital.org"

            aria-invalid={shown("email") ? "true" : undefined}

            aria-describedby={shown("email") ? "email-error" : undefined} required

          />

        </Field>

        <div className="ra-row">

          <Field id="organization" label="Clinic or organisation" error={shown("organization")}>

            <input

              id="organization" name="organization" className="ra-input" value={values.organization}

              onChange={set("organization")} onBlur={blur("organization")} autoComplete="organization"

              placeholder="District Hospital, Kolar"

              aria-invalid={shown("organization") ? "true" : undefined}

              aria-describedby={shown("organization") ? "organization-error" : undefined} required

            />

          </Field>

          <Field id="role" label="Your role">

            <div className="ra-select">

              <select id="role" name="role" className="ra-input" value={values.role} onChange={set("role")}>

                {roles.map((r) => <option key={r} value={r}>{r}</option>)}

              </select>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">

                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />

              </svg>

            </div>

          </Field>

        </div>

        <Field id="password" label="Password" error={shown("password")} hint="At least 8 characters.">

          <PasswordInput

            id="password" value={values.password} onChange={set("password")} onBlur={blur("password")}

            error={shown("password")} hint="At least 8 characters." autoComplete="new-password" placeholder="••••••••••••"

          />

          {values.password && (

            <div className="ra-strength" data-score={pw.score}>

              <span /><span /><span /><span />

              <b aria-live="polite">{pw.label}</b>

            </div>

          )}

        </Field>

        <Field id="confirm" label="Confirm password" error={shown("confirm")}>

          <PasswordInput

            id="confirm" value={values.confirm} onChange={set("confirm")} onBlur={blur("confirm")}

            error={shown("confirm")} autoComplete="new-password" placeholder="••••••••••••"

          />

        </Field>

        <label className="ra-check">

          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />

          <span>I accept the <a className="ra-link" href="/terms">terms</a> and the <a className="ra-link" href="/privacy">privacy notice</a>.</span>

        </label>

        <button className="ra-submit" type="submit" disabled={busy}>

          {busy ? <><Spinner /> Creating account</> : <>Create account <span aria-hidden="true">→</span></>}

        </button>

      </form>

      <p className="ra-switch">

        Already have an account?{" "}

        <a href="/login" onClick={(e) => { if (onNavigate) { e.preventDefault(); onNavigate("/login"); } }}>

          Sign in

        </a>

      </p>

    </AuthShell>

  );

}

export default SignIn;

/* ========================================================================== */

const CSS = `

@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

.ra-auth{

  --ra-bg:#071014;

  --ra-bg-2:#0a161b;

  --ra-surface:#0f1d23;

  --ra-text:#f2f6f7;

  --ra-text-2:#a3b1b7;

  --ra-muted:#6f8188;

  --ra-accent:#18b8d4;

  --ra-accent-2:#3d6ee8;

  --ra-ok:#34c98c;

  --ra-warn:#f5b942;

  --ra-danger:#ef6b6b;

  --ra-line:rgba(255,255,255,.09);

  --ra-line-2:rgba(255,255,255,.17);

  --ra-gutter:clamp(1.25rem,5vw,3.5rem);

  min-height:100vh;min-height:100dvh;

  background:var(--ra-bg);color:var(--ra-text);

  font-family:'Instrument Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;

  font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;

  overflow-x:clip;isolation:isolate;

}

.ra-auth *,.ra-auth *::before,.ra-auth *::after{box-sizing:border-box}

.ra-auth h1,.ra-auth h2,.ra-auth p,.ra-auth ul{margin:0;padding:0}

.ra-auth ul{list-style:none}

.ra-auth a{color:inherit;text-decoration:none}

.ra-auth button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}

.ra-auth canvas,.ra-auth svg{display:block;max-width:100%}

.ra-auth :focus-visible{outline:2px solid var(--ra-accent);outline-offset:3px;border-radius:8px}

.ra-skip{position:absolute;left:-9999px;top:0;z-index:20;background:var(--ra-accent);color:#03212a;padding:.7rem 1rem;font-weight:600}

.ra-skip:focus{left:0}

.ra-auth__grid{

  min-height:100vh;min-height:100dvh;

  display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);

}

/* ------------------------------------------------------------ form panel */

.ra-panel--form{

  display:flex;flex-direction:column;

  padding:clamp(1.5rem,3vw,2.5rem) var(--ra-gutter);

  max-width:min(100%,620px);width:100%;margin-inline:auto;

}

.ra-panel__head{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}

.ra-logo{display:inline-flex;align-items:center;gap:.55rem;font-weight:700;letter-spacing:-.02em;font-size:1.05rem}

.ra-logo em{font-style:normal;color:var(--ra-accent)}

.ra-tabs{position:relative;display:flex;gap:.25rem;padding:.25rem;border:1px solid var(--ra-line);border-radius:999px;background:rgba(255,255,255,.03)}

.ra-tabs a{position:relative;z-index:1;padding:.42rem .85rem;border-radius:999px;font-size:.85rem;font-weight:500;color:var(--ra-text-2);transition:color .25s}

.ra-tabs a[aria-current="page"]{color:#03212a}

.ra-tabs__ink{position:absolute;z-index:0;top:.25rem;bottom:.25rem;left:.25rem;width:calc(50% - .25rem);border-radius:999px;background:var(--ra-accent);transition:transform .32s cubic-bezier(.2,.7,.2,1)}

.ra-tabs__ink[data-mode="signup"]{transform:translateX(100%)}

.ra-panel__body{flex:1;display:flex;flex-direction:column;justify-content:center;padding-block:clamp(2rem,5vw,3rem);max-width:440px;width:100%}

.ra-panel__foot{font-size:.76rem;color:var(--ra-muted);border-top:1px solid var(--ra-line);padding-top:1rem;max-width:440px}

.ra-title{font-size:clamp(1.75rem,3vw,2.15rem);line-height:1.1;letter-spacing:-.028em;font-weight:600}

.ra-sub{color:var(--ra-text-2);margin-top:.5rem;font-size:.97rem;max-width:42ch}

/* --------------------------------------------------------------- social */

.ra-social{

  display:flex;align-items:center;justify-content:center;gap:.65rem;

  width:100%;min-height:52px;margin-top:1.75rem;

  border-radius:12px;background:#fff;color:#1f1f1f;font-weight:600;font-size:.95rem;

  transition:transform .2s,box-shadow .2s,background .2s;

}

.ra-social:hover:not(:disabled){background:#f2f4f6;transform:translateY(-1px);box-shadow:0 12px 28px -18px rgba(0,0,0,.9)}

.ra-social:disabled{opacity:.6;cursor:not-allowed}

.ra-or{display:flex;align-items:center;gap:.9rem;margin:1.4rem 0 .35rem;color:var(--ra-muted);font-size:.76rem}

.ra-or::before,.ra-or::after{content:"";flex:1;height:1px;background:var(--ra-line)}

/* ---------------------------------------------------------------- alert */

.ra-alert{

  display:flex;align-items:flex-start;gap:.6rem;margin-top:1.35rem;

  padding:.75rem .9rem;border-radius:12px;font-size:.88rem;

  color:#ffd9d9;background:rgba(239,107,107,.11);border:1px solid rgba(239,107,107,.32);

}

.ra-alert svg{flex:none;margin-top:.2rem}

/* ----------------------------------------------------------------- form */

.ra-form{display:grid;gap:1.05rem;margin-top:1.5rem}

.ra-row{display:grid;grid-template-columns:1fr 1fr;gap:1.05rem}

.ra-field{display:grid;gap:.4rem;min-width:0}

.ra-field__top{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}

.ra-field label{font-size:.85rem;font-weight:500;color:var(--ra-text-2)}

.ra-field__hint{font-size:.76rem;color:var(--ra-muted)}

.ra-field__msg{display:flex;align-items:center;gap:.4rem;font-size:.78rem;color:var(--ra-danger)}

.ra-link{font-size:.8rem;color:var(--ra-accent);font-weight:500}

.ra-link:hover{text-decoration:underline}

.ra-input{

  width:100%;min-height:52px;padding:.75rem 1rem;

  border-radius:12px;border:1px solid var(--ra-line-2);

  background:rgba(255,255,255,.03);color:var(--ra-text);

  font:inherit;font-size:.95rem;

  transition:border-color .2s,box-shadow .2s,background .2s;

  appearance:none;

}

.ra-input::placeholder{color:#5c6d74}

.ra-input:hover{border-color:rgba(255,255,255,.26)}

.ra-input:focus{outline:none;border-color:var(--ra-accent);background:rgba(24,184,212,.05);box-shadow:0 0 0 4px rgba(24,184,212,.14)}

.has-error .ra-input{border-color:rgba(239,107,107,.6)}

.has-error .ra-input:focus{box-shadow:0 0 0 4px rgba(239,107,107,.14)}

.ra-pw{position:relative}

.ra-pw .ra-input{padding-right:3.1rem}

.ra-pw__toggle{position:absolute;right:.45rem;top:50%;transform:translateY(-50%);width:40px;height:40px;display:grid;place-items:center;border-radius:9px;color:var(--ra-muted);transition:color .2s,background .2s}

.ra-pw__toggle:hover{color:var(--ra-text);background:rgba(255,255,255,.06)}

.ra-select{position:relative}

.ra-select svg{position:absolute;right:1rem;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--ra-muted)}

.ra-select select{padding-right:2.5rem;cursor:pointer}

.ra-select option{background:var(--ra-surface);color:var(--ra-text)}

.ra-strength{display:flex;align-items:center;gap:.3rem;margin-top:.45rem}

.ra-strength span{height:3px;flex:1;border-radius:99px;background:rgba(255,255,255,.12);transition:background .3s}

.ra-strength b{font-size:.72rem;font-weight:500;color:var(--ra-muted);margin-left:.35rem;min-width:6.5ch}

.ra-strength[data-score="1"] span:nth-child(-n+1){background:var(--ra-danger)}

.ra-strength[data-score="2"] span:nth-child(-n+2){background:var(--ra-warn)}

.ra-strength[data-score="3"] span:nth-child(-n+3){background:var(--ra-accent)}

.ra-strength[data-score="4"] span{background:var(--ra-ok)}

.ra-check{display:flex;align-items:flex-start;gap:.6rem;font-size:.85rem;color:var(--ra-text-2);cursor:pointer}

.ra-check input{width:18px;height:18px;margin-top:.15rem;accent-color:var(--ra-accent);flex:none;cursor:pointer}

.ra-submit{

  display:flex;align-items:center;justify-content:center;gap:.5rem;

  width:100%;min-height:54px;margin-top:.35rem;border-radius:12px;

  background:var(--ra-accent);color:#03212a;font-weight:600;font-size:1rem;

  box-shadow:0 14px 34px -18px rgba(24,184,212,.95);

  transition:background .2s,transform .2s,opacity .2s;

}

.ra-submit:hover:not(:disabled){background:#3fd0e8;transform:translateY(-1px)}

.ra-submit:disabled{opacity:.7;cursor:progress}

.ra-submit span{transition:transform .2s}

.ra-submit:hover:not(:disabled) span{transform:translateX(3px)}

.ra-spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(3,33,42,.3);border-top-color:#03212a;animation:ra-spin .7s linear infinite}

@keyframes ra-spin{to{transform:rotate(360deg)}}

.ra-switch{margin-top:1.5rem;font-size:.9rem;color:var(--ra-text-2)}

.ra-switch a{color:var(--ra-accent);font-weight:600}

.ra-switch a:hover{text-decoration:underline}

/* --------------------------------------------------------- brand panel */

.ra-panel--brand{

  position:relative;overflow:hidden;

  border-left:1px solid var(--ra-line);

  background:

    radial-gradient(60% 50% at 70% 18%,rgba(24,184,212,.14),transparent 70%),

    radial-gradient(50% 45% at 20% 85%,rgba(61,110,232,.13),transparent 70%),

    var(--ra-bg-2);

  display:grid;place-items:center;padding:clamp(2rem,4vw,3.5rem);

}

.ra-brand__in{display:grid;justify-items:start;gap:1.5rem;max-width:460px;width:100%}

.ra-brand__eyebrow{

  display:inline-flex;align-items:center;gap:.55rem;font-size:.74rem;font-weight:600;

  letter-spacing:.06em;text-transform:uppercase;color:var(--ra-text-2);

  border:1px solid var(--ra-line);border-radius:999px;padding:.36rem .8rem .36rem .65rem;background:rgba(255,255,255,.03);

}

.ra-brand__eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--ra-accent);box-shadow:0 0 0 4px rgba(24,184,212,.16)}

.ra-brand__title{font-size:clamp(1.5rem,2.1vw,1.95rem);line-height:1.18;letter-spacing:-.025em;font-weight:600;text-wrap:balance;max-width:20ch}

.ra-brand__points{display:grid;gap:.6rem;font-size:.9rem;color:var(--ra-text-2)}

.ra-brand__points li{display:flex;align-items:center;gap:.6rem}

.ra-brand__points li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--ra-accent);flex:none}

.ra-visual{position:relative;width:100%;aspect-ratio:1;max-width:min(340px,60vh);justify-self:center;display:grid;place-items:center}

.ra-visual__glow{position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,rgba(24,184,212,.34),rgba(61,110,232,.12) 58%,transparent 74%);filter:blur(34px)}

.ra-visual__canvas{position:relative;border-radius:50%;box-shadow:0 40px 80px -44px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.07)}

.ra-visual__ring{

  position:absolute;inset:-4%;border-radius:50%;border:1px solid rgba(255,255,255,.1);

  background:conic-gradient(from 0deg,transparent 0 80%,rgba(24,184,212,.5) 90%,transparent 100%);

  -webkit-mask:radial-gradient(circle,transparent 0 calc(50% - 2px),#000 calc(50% - 2px));

  mask:radial-gradient(circle,transparent 0 calc(50% - 2px),#000 calc(50% - 2px));

  animation:ra-spin 16s linear infinite;

}

/* ------------------------------------------------------------ responsive */

@media (max-width:1100px){

  .ra-auth__grid{grid-template-columns:minmax(0,1fr) minmax(0,.92fr)}

  .ra-brand__points{display:none}

}

@media (max-width:900px){

  .ra-auth__grid{grid-template-columns:minmax(0,1fr)}

  .ra-panel--brand{display:none}

  .ra-panel--form{max-width:560px}

  .ra-panel__body{margin-inline:auto;padding-block:2.25rem}

  .ra-panel__foot{margin-inline:auto}

}

@media (max-width:560px){

  .ra-row{grid-template-columns:minmax(0,1fr)}

  .ra-panel__head{gap:.75rem}

  .ra-tabs{width:100%}

  .ra-tabs a{flex:1;text-align:center}

  .ra-title{font-size:1.6rem}

}

@media (prefers-reduced-motion:reduce){

  .ra-auth *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}

}

`;
