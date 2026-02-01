import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

const CHANNEL_NAME = "Build at Scale";
export type YouTubeCTAProps = {
  subCount: number;
};

const formatSubCount = (count: number): string => {
  if (count >= 1000) {
    const k = count / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(count);
};

const SUBSCRIBE_BTN_WIDTH = 190;
const SUBSCRIBE_BTN_HEIGHT = 48;

const CARD_WIDTH = 725;
const CARD_HEIGHT = 145;
const AVATAR_SIZE = 90;
const ICON_SIZE = 28;

export const YouTubeCTA: React.FC<YouTubeCTAProps> = ({ subCount }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Timeline (in seconds → frames)
  const thumbPressStart = 1.0 * fps;
  const thumbPressDuration = 0.12 * fps;
  const thumbReleaseStart = thumbPressStart + thumbPressDuration;

  const buttonPressStart = 2.0 * fps;
  const buttonPressDuration = 0.15 * fps;
  const buttonReleaseStart = buttonPressStart + buttonPressDuration;

  const bellPressStart = 3.0 * fps;
  const bellPressDuration = 0.12 * fps;
  const bellReleaseStart = bellPressStart + bellPressDuration;

  const slideOutStart = durationInFrames - 0.6 * fps;

  // -- Slide in from bottom (spring) --
  const slideInSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.8 },
    durationInFrames: Math.round(0.6 * fps),
  });
  const translateY = interpolate(slideInSpring, [0, 1], [400, 0]);

  // -- Slide out downward (wind-up spring) --
  const slideOutRel = frame - slideOutStart;
  const windUpFrames = 4;
  // Slight upward pull
  const windUp = interpolate(slideOutRel, [0, windUpFrames], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  // Then spring down
  const slideDownSpring = spring({
    frame: slideOutRel - windUpFrames,
    fps,
    config: { damping: 16, stiffness: 150, mass: 0.8 },
  });
  const slideDown = interpolate(slideDownSpring, [0, 1], [-30, 400]);
  const slideOutY = slideOutRel < windUpFrames ? windUp : slideDown;

  // -- Thumbs up press animation --
  const thumbPressProgress = interpolate(
    frame,
    [thumbPressStart, thumbPressStart + thumbPressDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );
  const thumbReleaseSpring = spring({
    frame: frame - thumbReleaseStart,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.8 },
  });

  const isThumbPressed = frame >= thumbPressStart;
  const isThumbReleased = frame >= thumbReleaseStart;
  const isLiked = frame >= thumbReleaseStart + 0.15 * fps;

  let thumbScale = 1.1;
  if (isThumbPressed && !isThumbReleased) {
    thumbScale = interpolate(thumbPressProgress, [0, 1], [1.1, 0.9]);
  } else if (isThumbReleased) {
    thumbScale = interpolate(thumbReleaseSpring, [0, 1], [0.9, 1.1]);
  }

  // -- Subscribe button press animation --
  const pressProgress = interpolate(
    frame,
    [buttonPressStart, buttonPressStart + buttonPressDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );
  const releaseSpring = spring({
    frame: frame - buttonReleaseStart,
    fps,
    config: { damping: 8, stiffness: 200, mass: 0.8 },
  });

  const isPressed = frame >= buttonPressStart;
  const isReleased = frame >= buttonReleaseStart;
  const isSubscribed = frame >= buttonReleaseStart + 0.2 * fps;

  let buttonScale = 1;
  if (isPressed && !isReleased) {
    buttonScale = interpolate(pressProgress, [0, 1], [1, 0.92]);
  } else if (isReleased) {
    const raw = interpolate(releaseSpring, [0, 1], [0.92, 1]);
    buttonScale = Math.abs(raw - 1) < 0.002 ? 1 : raw;
  }

  // -- Bell press animation --
  const bellPressProgress = interpolate(
    frame,
    [bellPressStart, bellPressStart + bellPressDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );
  const bellReleaseSpring = spring({
    frame: frame - bellReleaseStart,
    fps,
    config: { damping: 6, stiffness: 180, mass: 0.6 },
  });

  const isBellPressed = frame >= bellPressStart;
  const isBellReleased = frame >= bellReleaseStart;
  const isBellActive = frame >= bellReleaseStart + 0.15 * fps;

  let bellScale = 1;
  let bellRotation = 0;
  if (isBellPressed && !isBellReleased) {
    bellScale = interpolate(bellPressProgress, [0, 1], [1, 0.8]);
  } else if (isBellReleased) {
    bellScale = interpolate(bellReleaseSpring, [0, 1], [0.8, 1]);
    const swingFrames = frame - bellReleaseStart;
    const swingDuration = 0.8 * fps;
    if (swingFrames < swingDuration) {
      const t = swingFrames / swingDuration;
      const decay = 1 - t;
      bellRotation = Math.sin(t * Math.PI * 6) * 14 * decay;
    }
  }

  // -- Pointing hand cursor animation --
  const HAND_SIZE = 80;
  const handAppearFrame = 0.4 * fps;
  const handVisible = frame >= handAppearFrame;

  // Target positions relative to card (x, y) — tip of finger lands on target
  const thumbX = 350;
  const thumbY = 58;
  const subX = 550;
  const subY = 68;
  const bellX = 635;
  const bellY = 50;
  const offScreenX = 800;
  const offScreenY = 350;
  const entryX = 200;
  const entryY = 350;

  // Cubic bezier helper: t in [0,1], returns point along curve
  const cubicBez = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };

  // Movement segments: [startFrame, endFrame, fromX, fromY, toX, toY, cpOffsetY]
  // cpOffsetY controls how much the arc dips downward
  const moveSegments: [number, number, number, number, number, number, number][] = [
    [handAppearFrame, thumbPressStart - 0.2 * fps, entryX, entryY, thumbX, thumbY, -25],
    [thumbReleaseStart + 0.3 * fps, buttonPressStart - 0.2 * fps, thumbX, thumbY, subX, subY, 25],
    [buttonReleaseStart + 0.3 * fps, bellPressStart - 0.2 * fps, subX, subY, bellX, bellY, 20],
    [bellReleaseStart + 0.3 * fps, bellReleaseStart + 0.8 * fps, bellX, bellY, offScreenX, offScreenY, 18],
  ];

  // Hold segments: [startFrame, endFrame, x, y]
  const holdSegments: [number, number, number, number][] = [
    [thumbPressStart - 0.2 * fps, thumbReleaseStart + 0.3 * fps, thumbX, thumbY],
    [buttonPressStart - 0.2 * fps, buttonReleaseStart + 0.3 * fps, subX, subY],
    [bellPressStart - 0.2 * fps, bellReleaseStart + 0.3 * fps, bellX, bellY],
  ];

  let handX = entryX;
  let handY = entryY;

  // Check hold segments first (static positions)
  for (const [start, end, hx, hy] of holdSegments) {
    if (frame >= start && frame <= end) {
      handX = hx;
      handY = hy;
      break;
    }
  }

  // Check movement segments (bezier curves)
  for (const [start, end, x0, y0, x1, y1, cpY] of moveSegments) {
    if (frame >= start && frame <= end) {
      const rawT = (frame - start) / (end - start);
      const t = Easing.inOut(Easing.quad)(rawT);
      const midX = (x0 + x1) / 2;
      const midY = (y0 + y1) / 2 + cpY;
      handX = cubicBez(t, x0, midX, midX, x1);
      handY = cubicBez(t, y0, midY, midY, y1);
      break;
    }
  }

  // After last segment, clamp to exit position
  if (frame > bellReleaseStart + 0.8 * fps) {
    handX = offScreenX;
    handY = offScreenY;
  }


  // -- Hand click scale --
  const isClickingThumb = frame >= thumbPressStart && frame < thumbReleaseStart;
  const isClickingSub = frame >= buttonPressStart && frame < buttonReleaseStart;
  const isClickingBell = frame >= bellPressStart && frame < bellReleaseStart;
  const handScale = isClickingThumb || isClickingSub || isClickingBell ? 0.9 : 1;

  const buttonBg = isSubscribed ? "#333" : "#CC0000";
  const buttonText = isSubscribed ? "Subscribed" : "Subscribe";

  return (
    <AbsoluteFill>
      {/* Lower third - centered at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: `translateX(-50%) translateY(${translateY + slideOutY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: "20px 24px",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            position: "relative",
            backgroundColor: "#1e2f49",
            marginRight: 12,
          }}
        >
          <Img
            src={staticFile("avatar.png")}
            style={{
              width: AVATAR_SIZE * 1.1,
              height: AVATAR_SIZE * 1.1,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-48%, -42%)",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Channel info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f0f0f",
              lineHeight: 1.2,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {CHANNEL_NAME}
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#606060",
              lineHeight: 1.3,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {formatSubCount(subCount)} subscribers
          </div>
        </div>

        {/* Thumbs up */}
        <div
          style={{
            transform: `scale(${thumbScale})`,
            flexShrink: 0,
            width: ICON_SIZE * 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Img
            src={staticFile("thumbs-up.svg")}
            style={{
              width: ICON_SIZE * 2.7,
              height: ICON_SIZE * 2.7,
              marginTop: 3,
              marginLeft: 2,
              filter: isLiked
                ? "brightness(0)"
                : "none",
            }}
          />
        </div>

        {/* Subscribe button */}
        <div
          style={{
            width: SUBSCRIBE_BTN_WIDTH,
            height: SUBSCRIBE_BTN_HEIGHT,
            borderRadius: 24,
            backgroundColor: buttonBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${buttonScale})`,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: 21,
              fontWeight: 600,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: 0.8,
            }}
          >
            {buttonText}
          </span>
        </div>

        {/* Bell icon */}
        <div
          style={{
            transform: `scale(${bellScale}) rotate(${bellRotation}deg)`,
            transformOrigin: "top center",
            flexShrink: 0,
            width: ICON_SIZE * 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Img
            src={staticFile("bell.svg")}
            style={{
              width: ICON_SIZE * 1.4,
              height: ICON_SIZE * 1.4,
              marginTop: 2,
              filter: isBellActive
                ? "none"
                : "brightness(0) saturate(100%) invert(40%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)",
            }}
          />
        </div>
        {/* Pointing hand cursor */}
        {handVisible && (
          <Img
            src={staticFile("pointinghand.svg")}
            style={{
              position: "absolute",
              left: handX,
              top: handY,
              width: HAND_SIZE,
              height: HAND_SIZE,
              transform: `scale(${handScale})`,
              transformOrigin: "center center",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
