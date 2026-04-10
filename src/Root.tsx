import React from "react";
import { Composition } from "remotion";
import { calculateMetadata, FacelessVideo } from "./FacelessVideo.js";
import type { RenderInputProps } from "./types.js";

const defaultProps: RenderInputProps = {
  audioUrl: "",
  slides: [],
  captions: [],
  captionFont: "'Montserrat', sans-serif",
  captionStyle: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: 28, fontWeight: "bold",
    color: "#FFFFFF", backgroundColor: "#000000",
    backgroundOpacity: 0.7, position: 85,
    textAlign: "center", highlightColor: "#FFD700",
    textTransform: "none", letterSpacing: 0, textStroke: false,
  },
  format: { width: 1920, height: 1080 },
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="faceless-video"
    component={FacelessVideo}
    defaultProps={defaultProps}
    fps={30}
    durationInFrames={150}
    width={1920}
    height={1080}
    calculateMetadata={calculateMetadata}
  />
);
