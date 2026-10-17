"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Check, X, Move, Sparkles } from "lucide-react";
import { cropAndCompressPhoto } from "../../lib/utils/imageProcess";

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 325; // 4:5 aspect ratio (260 / 325 = 0.8)

export default function PhotoCropModal({
  isOpen,
  file,
  imageSource,
  onCropComplete,
  onCancel,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const imgW = imageSource?.width || 1;
  const imgH = imageSource?.height || 1;

  // Base scale required to cover the 260x325 frame completely
  const baseScale = Math.max(FRAME_WIDTH / imgW, FRAME_HEIGHT / imgH);
  const currentScale = baseScale * zoom;
  const scaledW = imgW * currentScale;
  const scaledH = imgH * currentScale;

  // Calculate clamp boundaries so the image always covers the entire frame
  const minX = FRAME_WIDTH - scaledW;
  const maxX = 0;
  const minY = FRAME_HEIGHT - scaledH;
  const maxY = 0;

  // Reset / Center when modal opens or imageSource changes
  useEffect(() => {
    if (isOpen && imageSource) {
      setZoom(1);
      setError("");
      setIsProcessing(false);
      // Perfect center crop on open
      const initialPanX = (FRAME_WIDTH - imgW * baseScale) / 2;
      const initialPanY = (FRAME_HEIGHT - imgH * baseScale) / 2;
      setPan({ x: initialPanX, y: initialPanY });
    }
  }, [isOpen, imageSource, imgW, imgH, baseScale]);

  // Clamp helper
  const clampPan = useCallback(
    (newX, newY, scaleVal) => {
      const curScale = baseScale * scaleVal;
      const sW = imgW * curScale;
      const sH = imgH * curScale;
      const mX = FRAME_WIDTH - sW;
      const mY = FRAME_HEIGHT - sH;
      return {
        x: Math.min(0, Math.max(mX, newX)),
        y: Math.min(0, Math.max(mY, newY)),
      };
    },
    [baseScale, imgW, imgH]
  );

  // Redraw canvas whenever pan, zoom, or source changes
  useEffect(() => {
    if (!isOpen || !imageSource?.source || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image transformed by pan and zoom
    ctx.drawImage(
      imageSource.source,
      pan.x,
      pan.y,
      scaledW,
      scaledH
    );
  }, [isOpen, imageSource, pan, scaledW, scaledH]);

  // Pointer drag events
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const nextPan = clampPan(dragStart.panX + dx, dragStart.panY + dy, zoom);
    setPan(nextPan);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Zoom slider handler
  const handleZoomChange = (e) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);
    // Keep pan within newly scaled boundaries
    setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
  };

  // Confirm crop & compress
  const handleUsePhoto = async () => {
    if (!imageSource?.source || !file) return;

    setIsProcessing(true);
    setError("");

    try {
      // Map visible 260x325 frame back to source image coordinates
      const srcX = -pan.x / currentScale;
      const srcY = -pan.y / currentScale;
      const srcW = FRAME_WIDTH / currentScale;
      const srcH = FRAME_HEIGHT / currentScale;

      const cropRect = {
        srcX: Math.max(0, Math.min(imgW - srcW, srcX)),
        srcY: Math.max(0, Math.min(imgH - srcH, srcY)),
        srcW: Math.min(imgW, srcW),
        srcH: Math.min(imgH, srcH),
      };

      const result = await cropAndCompressPhoto(imageSource.source, file, cropRect);
      onCropComplete(result);
    } catch (err) {
      console.error("Crop error:", err);
      setError(err.message || "Failed to crop photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(20, 22, 20, 0.72)",
        backdropFilter: "blur(5px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E8E2D4",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.22)",
          width: "100%",
          maxWidth: "380px",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #F3EFE6",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              id="crop-modal-title"
              style={{
                fontFamily: "var(--font-heading), 'Playfair Display', Georgia, serif",
                fontSize: "19px",
                fontWeight: 600,
                color: "#2B2D2A",
                margin: 0,
              }}
            >
              Adjust & Crop Photo
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "#5A584F",
                margin: "4px 0 0",
                lineHeight: 1.4,
              }}
            >
              Drag to position within the 4:5 portrait frame.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#5A584F",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div
          style={{
            padding: "20px 20px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "#FAF9F7",
          }}
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: `${FRAME_WIDTH}px`,
              height: `${FRAME_HEIGHT}px`,
              borderRadius: "12px",
              overflow: "hidden",
              position: "relative",
              cursor: isDragging ? "grabbing" : "grab",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.15), 0 0 0 2px #8A6B2E",
              backgroundColor: "#2B2D2A",
              touchAction: "none",
              userSelect: "none",
            }}
          >
            <canvas
              ref={canvasRef}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                pointerEvents: "none",
              }}
            />

            {/* Subtle Rule-of-Thirds Grid Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
                opacity: 0.28,
              }}
            >
              <div style={{ borderRight: "1px dashed #FFFFFF", borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderRight: "1px dashed #FFFFFF", borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderRight: "1px dashed #FFFFFF", borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderRight: "1px dashed #FFFFFF", borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderBottom: "1px dashed #FFFFFF" }} />
              <div style={{ borderRight: "1px dashed #FFFFFF" }} />
              <div style={{ borderRight: "1px dashed #FFFFFF" }} />
              <div />
            </div>

            {/* Reposition Badge */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                backgroundColor: "rgba(0, 0, 0, 0.55)",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: "12px",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backdropFilter: "blur(2px)",
              }}
            >
              <Move size={11} />
              <span>4:5 Portrait</span>
            </div>
          </div>

          {/* Zoom Slider */}
          <div
            style={{
              width: `${FRAME_WIDTH}px`,
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <ZoomOut size={15} color="#5A584F" style={{ flexShrink: 0 }} />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              aria-label="Zoom photo"
              style={{
                flex: 1,
                accentColor: "#8A6B2E",
                cursor: "pointer",
                height: "5px",
              }}
            />
            <ZoomIn size={15} color="#5A584F" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#5A584F",
                minWidth: "32px",
                textAlign: "right",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {error && (
            <div
              style={{
                marginTop: "10px",
                color: "var(--danger, #C53030)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #F3EFE6",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            backgroundColor: "#FFFFFF",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              padding: "9px 16px",
              backgroundColor: "#FAF9F7",
              border: "1px solid #E8E2D4",
              borderRadius: "8px",
              color: "#5A584F",
              fontSize: "13px",
              fontWeight: 500,
              cursor: isProcessing ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F3EFE6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FAF9F7")}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUsePhoto}
            disabled={isProcessing}
            style={{
              padding: "9px 20px",
              backgroundColor: "#8A6B2E",
              border: "none",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isProcessing ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "background-color 0.15s ease",
              boxShadow: "0 2px 6px rgba(138, 107, 46, 0.28)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6E5420")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8A6B2E")}
          >
            <Check size={15} strokeWidth={2.4} />
            <span>{isProcessing ? "Processing..." : "Use photo"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
