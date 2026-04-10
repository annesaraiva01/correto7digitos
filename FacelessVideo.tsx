import React, { useMemo } from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo,
  Sequence, useCurrentFrame, useVideoConfig,
} from "remotion";
import { useCaptionFont } from "./font-utils";
import type { CaptionSegment, CaptionStyle, RenderInputProps } from "./types";

const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 28,
  fontWeight: "bold",
  color: "#FFFFFF",
  backgroundColor: "#000000",
  backgroundOpacity: 0.7,
  position: 85,
  textAlign: "center",
  highlightColor: "#FFD700",
  textTransform: "none",
  letterSpacing: 0,
  textStroke: false,
};

const getWeight = (fw?: CaptionStyle["fontWeight"]) =>
  fw === "extrabold" ? 800 : fw === "bold" ? 700 : 400;

const getActiveCaption = (captions: CaptionSegment[], t: number) =>
  captions.find((s) => t >= s.start_time && t <= s.end_time) || null;

export const calculateMetadata = ({ props }: { props: RenderInputProps }) => {
  const fps = 30;
  const maxSlide = Math.max(0, ...(props.slides || []).map((s) => s.endTime || 0));
  const maxCap = Math.max(0, ...((props.captions || []).map((c) => c.end_time || 0)));
  const dur = Math.max(maxSlide, maxCap, 5);
  return {
    fps,
    durationInFrames: Math.max(1, Math.ceil(dur * fps)),
    width: props.format?.width || 1920,
    height: props.format?.height || 1080,
  };
};

export const FacelessVideo: React.FC<RenderInputProps> = ({
  audioUrl, slides, captions = [], captionStyle, captionFont,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;
  const sorted = useMemo(() => [...slides].sort((a, b) => a.startTime - b.startTime), [slides]);
  const cap = getActiveCaption(captions, currentTime);
  const style = { ...DEFAULT_CAPTION_STYLE, ...(captionStyle || {}) };
  const fontFamily = useCaptionFont(captionFont, style.fontFamily);
  const text = cap
    ? style.textTransform === "uppercase" ? cap.text.toUpperCase() : cap.text
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {audioUrl ? <Audio src={audioUrl} /> : null}

      {sorted.map((slide, i) => {
        const from = Math.max(0, Math.floor(slide.startTime * fps));
        const dur = Math.max(1, Math.ceil((slide.endTime - slide.startTime) * fps));
        const trim = Math.max(0, Math.floor(((slide.sourceOffsetMs || 0) / 1000) * fps));
        return (
          <Sequence key={`${slide.keyword}-${i}`} from={from} durationInFrames={dur}>
            <AbsoluteFill>
              {slide.videoUrl ? (
                <OffthreadVideo src={slide.videoUrl} trimBefore={trim} muted
                  style={{ width, height, objectFit: "cover" }} />
              ) : (
                <Img src={slide.imageUrl} style={{ width, height, objectFit: "cover" }} />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {text && (
        <AbsoluteFill style={{
          justifyContent: "flex-start",
          alignItems: style.textAlign === "left" ? "flex-start"
            : style.textAlign === "right" ? "flex-end" : "center",
          paddingLeft: `${width * 0.05}px`,
          paddingRight: `${width * 0.05}px`,
          paddingTop: `${(style.position / 100) * height}px`,
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}>
          <div style={{
            maxWidth: "90%",
            fontFamily,
            fontSize: `${Math.round((style.fontSize / 1080) * width)}px`,
            fontWeight: getWeight(style.fontWeight),
            color: cap?.is_highlight ? style.highlightColor : style.color,
            backgroundColor: style.backgroundColor === "transparent" ? "transparent"
              : `${style.backgroundColor}${Math.round(style.backgroundOpacity * 255).toString(16).padStart(2, "0")}`,
            padding: `${Math.max(10, width * 0.008)}px ${Math.max(18, width * 0.014)}px`,
            borderRadius: `${Math.max(12, width * 0.008)}px`,
            textAlign: style.textAlign,
            textTransform: style.textTransform || "none",
            letterSpacing: `${style.letterSpacing || 0}px`,
            lineHeight: 1.25,
            textShadow: style.textStroke
              ? "0 0 4px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7), 1px 1px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.8)"
              : "0 2px 4px rgba(0,0,0,0.5)",
            whiteSpace: "pre-wrap",
          }}>
            {text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
