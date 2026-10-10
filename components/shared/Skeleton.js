import React from "react";

export default function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "12px",
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.5s infinite",
        ...style,
      }}
    >
      <style jsx global>{`
        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes skeletonShimmer {
            0%, 100% {
              background-position: 0 0;
            }
          }
        }
      `}</style>
    </div>
  );
}
