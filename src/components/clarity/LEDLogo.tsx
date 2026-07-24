// Clarity — animated LED wordmark. Dots pop in, then bars grow along each segment.
// Ported from the design's renderLED(); animation via the clarity-dotIn / clarity-growBar keyframes.
import { useMemo } from "react";

type Seg = [[number, number], [number, number]];

const GLYPHS: Record<string, Seg[]> = {
  C: [[[4, 0], [0, 0]], [[0, 0], [0, 6]], [[0, 6], [4, 6]]],
  L: [[[0, 0], [0, 6]], [[0, 6], [4, 6]]],
  A: [[[0, 6], [2, 0]], [[2, 0], [4, 6]], [[1, 3], [3, 3]]],
  R: [[[0, 0], [0, 6]], [[0, 0], [3, 0]], [[3, 0], [3, 3]], [[0, 3], [3, 3]], [[3, 3], [4, 6]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
  Y: [[[0, 0], [2, 3]], [[4, 0], [2, 3]], [[2, 3], [2, 6]]],
};

const WORD = "CLARITY";
const U = 8;
const TH = 4;

export default function LEDLogo({ animate = true }: { animate?: boolean }) {
  const letters = useMemo(() => {
    return WORD.split("").map((ch, li) => {
      const segs = GLYPHS[ch];
      const nodes: Record<string, [number, number]> = {};
      segs.forEach((s) => s.forEach((pt) => { nodes[pt[0] + "," + pt[1]] = pt; }));

      const dots = Object.keys(nodes).map((k) => {
        const pt = nodes[k];
        return (
          <div
            key={"d" + k}
            style={{
              position: "absolute",
              left: pt[0] * U - TH / 2 + "px",
              top: pt[1] * U - TH / 2 + "px",
              width: TH + "px",
              height: TH + "px",
              borderRadius: "50%",
              background: "#d9c9ff",
              boxShadow: "0 0 6px rgba(157,123,255,0.9)",
              animation: animate ? "clarity-dotIn .35s ease both" : undefined,
              animationDelay: animate ? li * 0.13 + "s" : undefined,
            }}
          />
        );
      });

      const bars = segs.map((s, i) => {
        const [x1, y1] = s[0];
        const [x2, y2] = s[1];
        const dx = (x2 - x1) * U;
        const dy = (y2 - y1) * U;
        const len = Math.hypot(dx, dy);
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <div
            key={"b" + i}
            style={{
              position: "absolute",
              left: x1 * U + "px",
              top: y1 * U - TH / 2 + "px",
              width: len + "px",
              height: TH + "px",
              transformOrigin: "0 50%",
              transform: "rotate(" + ang + "deg)",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: TH / 2 + "px",
                background: "linear-gradient(90deg,#b79bff,#e0d4ff)",
                boxShadow: "0 0 8px rgba(157,123,255,0.85)",
                transformOrigin: "0 50%",
                animation: animate ? "clarity-growBar .5s cubic-bezier(.4,.9,.3,1) both" : undefined,
                animationDelay: animate ? 0.5 + li * 0.13 + i * 0.06 + "s" : undefined,
              }}
            />
          </div>
        );
      });

      return (
        <div key={li} style={{ position: "relative", width: 4 * U + TH + "px", height: 6 * U + TH + "px" }}>
          {dots}
          {bars}
        </div>
      );
    });
  }, [animate]);

  return <div style={{ display: "flex", gap: "13px", alignItems: "flex-start" }}>{letters}</div>;
}
