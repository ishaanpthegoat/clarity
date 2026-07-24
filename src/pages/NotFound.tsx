import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="clarity-root grid min-h-[100dvh] w-full place-items-center px-6 text-center"
      style={{ background: "radial-gradient(120% 80% at 50% -10%,#161226 0%,#050507 55%,#000 100%)" }}
    >
      <div className="anim-pop-in flex flex-col items-center">
        <div
          className="grid h-20 w-20 place-items-center rounded-[24px] text-[34px] font-extrabold"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)", boxShadow: "0 0 60px rgba(139,107,255,.45)" }}
        >
          ?
        </div>
        <h1 className="mt-7 text-[64px] font-extrabold leading-none tracking-[-2px] text-white">404</h1>
        <p className="mt-2 max-w-[280px] text-[16px] leading-[1.5] text-[#8a8a97]">
          That page drifted off. Let's get you back to what matters.
        </p>
        <a
          href="/"
          className="mt-8 rounded-[16px] px-7 py-3.5 text-[16px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#9d7bff,#6a4bd6)" }}
        >
          Back to Clarity
        </a>
      </div>
    </div>
  );
};

export default NotFound;
