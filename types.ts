export interface BRollSlide {
  videoUrl?: string;
  imageUrl: string;
  keyword: string;
  startTime: number;
  endTime: number;
  sourceOffsetMs?: number;
}

export interface CaptionSegment {
  index: number;
  text: string;
  start_time: number;
  end_time: number;
  is_highlight: boolean;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "extrabold";
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: number;
  textAlign: "left" | "center" | "right";
  highlightColor: string;
  textTransform?: "none" | "uppercase";
  letterSpacing?: number;
  textStroke?: boolean;
}

export interface VideoFormatConfig {
  id?: string;
  label?: string;
  width: number;
  height: number;
}

export interface RenderInputProps {
  audioUrl: string;
  slides: BRollSlide[];
  captions?: CaptionSegment[];
  captionStyle?: Partial<CaptionStyle>;
  captionFont?: string;
  format?: VideoFormatConfig;
}
