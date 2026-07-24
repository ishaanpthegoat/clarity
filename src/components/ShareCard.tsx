import { useRef, useCallback } from "react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";

interface ShareCardProps {
  contentType: string;
  content: string;
  author?: string;
  streak: number;
  onClose: () => void;
}

const ShareCard = ({ contentType, content, author, streak, onClose }: ShareCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#0a0a0a",
      });
      if (!blob) throw new Error("Failed to generate image");

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "mindlock-share.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "MindLock",
            text: "My daily dose of clarity 🧠🔒",
          });
          toast("Shared! 🎉");
          onClose();
          return;
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindlock-share.png";
      a.click();
      URL.revokeObjectURL(url);
      toast("Image saved! Share it to your story 📤");
      onClose();
    } catch (e) {
      console.error("Share failed:", e);
      toast.error("Share failed — try again");
    }
  }, [onClose]);

  const typeLabel = {
    quote: "Daily Quote",
    affirmation: "Affirmation",
    reflection: "Reflection",
    challenge: "Challenge",
    breathwork: "Breathwork",
  }[contentType] || "Daily Message";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* The shareable card */}
        <div
          ref={cardRef}
          style={{
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1400 30%, #0a0a0a 70%, #0d0d0d 100%)",
            borderRadius: "24px",
            padding: "48px 32px",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle gold accent glow */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-30%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Type badge */}
          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "999px",
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.25)",
            marginBottom: "24px",
          }}>
            <span style={{ color: "#D4AF37", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {typeLabel}
            </span>
          </div>

          {/* Content */}
          <p style={{
            color: "#f5f5f5",
            fontSize: contentType === "quote" ? "20px" : "18px",
            lineHeight: 1.6,
            fontWeight: contentType === "quote" ? 400 : 600,
            fontStyle: contentType === "quote" || contentType === "reflection" ? "italic" : "normal",
            marginBottom: author ? "16px" : "32px",
            letterSpacing: "-0.01em",
          }}>
            {contentType === "quote" ? `"${content}"` : content}
          </p>

          {/* Author */}
          {author && (
            <p style={{
              color: "rgba(212,175,55,0.6)",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "32px",
            }}>
              — {author}
            </p>
          )}

          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🔒</span>
              <span style={{
                color: "#D4AF37",
                fontSize: "15px",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}>
                MindLock
              </span>
            </div>
            {streak > 0 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "999px",
                background: "rgba(255,165,0,0.1)",
                border: "1px solid rgba(255,165,0,0.2)",
              }}>
                <span style={{ fontSize: "12px" }}>🔥</span>
                <span style={{ color: "#FFA500", fontSize: "12px", fontWeight: 700 }}>
                  {streak} day streak
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-border text-muted-foreground font-semibold text-sm hover:bg-card transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm gold-glow"
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
