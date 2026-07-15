"use client";

import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return value;
}

vec3 starLayer(vec2 uv, float scale, float brightness, float t) {
  vec2 grid = uv * scale;
  vec2 id = floor(grid);
  vec2 gv = fract(grid) - 0.5;
  float rnd = hash(id);
  if (rnd < 0.92) return vec3(0.0);
  vec2 offset = vec2(hash(id + 1.3), hash(id + 2.7)) - 0.5;
  float d = length(gv - offset * 0.8);
  float twinkle = 0.55 + 0.45 * sin(t * (1.5 + rnd * 3.0) + rnd * 40.0);
  float star = smoothstep(0.09, 0.0, d) * twinkle * brightness;
  vec3 tint = mix(vec3(0.84, 0.70, 0.42), vec3(0.75, 0.72, 1.0), step(0.96, rnd));
  return star * tint;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 drift = u_mouse * 0.045;
  float t = u_time * 0.055;

  // nebula: two moving fbm fields folded into ridges
  vec2 p = uv * 1.6 + drift;
  float n1 = fbm(p + vec2(t * 0.6, -t * 0.4));
  float n2 = fbm(p * 1.7 - vec2(t * 0.35, t * 0.5) + n1);
  float ridge = smoothstep(0.35, 0.95, n1 * n2 * 1.8);

  vec3 ink = vec3(0.027, 0.027, 0.063);
  vec3 violet = vec3(0.30, 0.17, 0.58);
  vec3 gold = vec3(0.55, 0.44, 0.24);

  vec3 color = ink;
  color += violet * ridge * 0.55;
  color += gold * smoothstep(0.55, 1.0, n2) * ridge * 0.5;

  // soft glow near the top center (echoes the hero)
  float halo = 1.0 - length(uv - vec2(0.0, 0.42) - drift * 0.5);
  color += vec3(0.16, 0.10, 0.30) * smoothstep(0.2, 1.0, halo) * 0.5;

  // stars: three parallax depths
  color += starLayer(uv + drift * 2.2, 22.0, 0.9, u_time);
  color += starLayer(uv + drift * 1.4 + 5.2, 38.0, 0.55, u_time * 0.8);
  color += starLayer(uv + drift * 0.8 + 9.7, 64.0, 0.3, u_time * 0.6);

  // vignette keeps edges quiet behind text
  float vig = smoothstep(1.45, 0.35, length(uv));
  color *= mix(0.72, 1.0, vig);

  gl_FragColor = vec4(color, 1.0);
}
`;

// probe on a throwaway canvas: once getContext("webgl") is called on the real
// canvas its context type is locked, so a late shader failure would leave the
// 2D fallback unable to attach.
function supportsShader() {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return false;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return false;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    const ok = !!gl.getProgramParameter(program, gl.LINK_STATUS);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

function startWebGL(canvas: HTMLCanvasElement, reduced: boolean) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  if (!vs || !fs) return null;
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "u_res");
  const uTime = gl.getUniformLocation(program, "u_time");
  const uMouse = gl.getUniformLocation(program, "u_mouse");

  let frame = 0;
  let running = true;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = Math.round(canvas.clientHeight * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const render = (time: number) => {
    mouse.x += (mouse.tx - mouse.x) * 0.03;
    mouse.y += (mouse.ty - mouse.y) * 0.03;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time / 1000);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced && running) frame = requestAnimationFrame(render);
  };

  const onPointer = (event: PointerEvent) => {
    mouse.tx = (event.clientX / innerWidth - 0.5) * 2;
    mouse.ty = (0.5 - event.clientY / innerHeight) * 2;
  };
  const onVisibility = () => {
    running = !document.hidden;
    cancelAnimationFrame(frame);
    if (running && !reduced) frame = requestAnimationFrame(render);
  };

  resize();
  render(reduced ? 4200 : 0);
  addEventListener("resize", resize);
  addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

function startFallback2D(canvas: HTMLCanvasElement, reduced: boolean) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  let frame = 0;
  let width = 0;
  let height = 0;
  const stars = Array.from({ length: innerWidth < 700 ? 40 : 90 }, (_, index) => ({
    x: Math.random(), y: Math.random(), radius: 0.4 + Math.random() * 1.3, phase: Math.random() * Math.PI * 2, speed: 0.0006 + (index % 5) * 0.0004,
  }));
  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const draw = (time = 0) => {
    context.clearRect(0, 0, width, height);
    for (const star of stars) {
      const pulse = reduced ? 0.65 : 0.45 + Math.sin(time * star.speed + star.phase) * 0.35;
      context.beginPath();
      context.fillStyle = `rgba(214, 179, 106, ${Math.max(pulse, 0.08)})`;
      context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
      context.fill();
    }
    if (!reduced) frame = requestAnimationFrame(draw);
  };
  resize();
  addEventListener("resize", resize);
  draw();
  return () => { removeEventListener("resize", resize); cancelAnimationFrame(frame); };
}

export function CosmicCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stop = supportsShader() ? startWebGL(canvas, reduced) : startFallback2D(canvas, reduced);
    return () => { stop?.(); };
  }, []);
  return <canvas ref={ref} className="cosmic-canvas" aria-hidden="true" />;
}
