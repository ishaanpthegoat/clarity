// Clarity — splash. WebGL aurora background, animated LED wordmark, auto-advance / tap.
import { useEffect, useRef } from "react";
import { useClarity } from "@/lib/clarityStore";
import LEDLogo from "../LEDLogo";

function useAuroraShader(ref: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = (cv.getContext("webgl") || cv.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = cv.clientWidth || 390;
      const h = cv.clientHeight || 844;
      cv.width = w * dpr;
      cv.height = h * dpr;
      gl.viewport(0, 0, cv.width, cv.height);
    };
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs =
      "precision highp float;uniform float u_time;uniform vec2 u_res;void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv*2.-1.;p.x*=u_res.x/u_res.y;float t=u_time*0.25;float v=sin(p.x*1.5+t)+sin((p.y*1.6+t)*1.1)+sin((p.x+p.y+t)*0.9);float l=length(p);v+=sin(l*3.5-t*1.6);v*=0.22;vec3 a=vec3(0.004,0.003,0.008);vec3 b=vec3(0.045,0.028,0.10);vec3 col=mix(a,b,0.5+0.5*v);col+=vec3(0.03,0.012,0.075)*smoothstep(0.95,0.0,l);gl_FragColor=vec4(col,1.);}";
    const mk = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(pr, "u_time");
    const uR = gl.getUniformLocation(pr, "u_res");
    resize();
    const t0 = performance.now();
    let raf = 0;
    let alive = true;
    const draw = () => {
      if (!alive || !ref.current) return;
      resize();
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.uniform2f(uR, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

export default function Splash() {
  const { actions } = useClarity();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAuroraShader(canvasRef);

  useEffect(() => {
    const t = window.setTimeout(() => actions.enterApp(), 2900);
    return () => window.clearTimeout(t);
  }, [actions]);

  return (
    <div
      onClick={() => actions.enterApp()}
      className="anim-fadeIn absolute inset-0 flex cursor-pointer flex-col items-center justify-center overflow-hidden"
      style={{ background: "#050308" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80 mix-blend-screen"
        src="/clarity/aurora.mp4"
        poster="/clarity/aurora.png"
        autoPlay
        muted
        loop
        playsInline
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(78% 58% at 50% 44%,transparent,rgba(5,3,8,.6) 82%)" }}
      />
      <div className="anim-floaty relative flex flex-col items-center gap-9">
        <div style={{ filter: "drop-shadow(0 0 26px rgba(140,90,255,.55))" }}>
          <LEDLogo />
        </div>
        <div className="text-[12px] font-semibold tracking-[6px]" style={{ color: "rgba(220,210,255,.72)" }}>
          LOCK IN. GET CLEAR.
        </div>
      </div>
      <div className="absolute bottom-[124px] left-1/2 h-[3px] w-[150px] -translate-x-1/2 overflow-hidden rounded-[3px] bg-white/10">
        <div
          className="h-full rounded-[3px]"
          style={{ background: "linear-gradient(90deg,#9d7bff,#c4b2ff)", animation: "clarity-grow 2.7s ease-out both" }}
        />
      </div>
      <div className="absolute bottom-[94px] left-0 right-0 text-center text-[12px] text-white/30">tap to begin</div>
    </div>
  );
}
