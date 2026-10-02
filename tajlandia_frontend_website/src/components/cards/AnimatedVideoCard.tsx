"use client";

import { useRef, useState, useEffect } from "react";

interface AnimatedVideoCardProps {
  videoSrc: string;
  posterSrc?: string;
  alt: string;
  className?: string;
  interactionTargetRef?: React.RefObject<HTMLElement | null>;
}

const MAX_TILT_DEG = 20;
const HOVER_SCALE = 1.08;
// The video is fetched, and keeps playing, only within half a screen of the viewport.
const VIDEO_MARGIN = "50% 0px";

function tiltTransform(x: number, y: number, scale: number) {
  return `rotateX(${x}deg) rotateY(${y}deg) scale(${scale})`;
}

function shineOpacity(x: number, y: number) {
  return String(Math.sqrt(Math.abs(x) + Math.abs(y)) / 30);
}

/** Sets up (or, with `false`, clears) the 3D stage the tilt is written to. */
function setTiltStage(target: HTMLElement, on: boolean) {
  target.style.transform = on ? tiltTransform(0, 0, 1) : "";
  target.style.transformOrigin = on ? "center center" : "";
  target.style.transformStyle = on ? "preserve-3d" : "";
  target.style.transition = on ? "transform 0.1s ease-out" : "";
}

export function AnimatedVideoCard({
  videoSrc,
  posterSrc,
  alt,
  className = "",
  interactionTargetRef,
}: AnimatedVideoCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const container = interactionTargetRef?.current ?? containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    // Initialize video volume
    video.volume = 0.7;
    video.muted = true;

    // The tilt is written straight to the DOM once per frame, so moving the
    // mouse never re-renders the card.
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    const writeTilt = (x: number, y: number, scale: number) => {
      const target = interactionTargetRef?.current ?? containerRef.current;
      if (target) target.style.transform = tiltTransform(x, y, scale);
      if (shineRef.current) shineRef.current.style.opacity = shineOpacity(x, y);
    };

    const applyTilt = () => {
      frameId = 0;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const mouseX = pointerX - rect.left;
      const mouseY = pointerY - rect.top;

      // Calculate rotation based on mouse position (directional on all sides)
      const rotationX = ((mouseY - centerY) / centerY) * MAX_TILT_DEG;
      const rotationY = ((mouseX - centerX) / centerX) * -MAX_TILT_DEG;

      writeTilt(rotationX, rotationY, HOVER_SCALE);
    };

    const handleMouseMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!frameId) frameId = requestAnimationFrame(applyTilt);
      setShowControls(true);
    };

    const handleMouseLeave = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
      writeTilt(0, 0, 1);
      setShowControls(false);
    };

    const handleMouseEnter = () => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    };

    const handleTouchStart = () => {
      setShowControls(true);
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("touchstart", handleTouchStart);
    };
  }, [interactionTargetRef, isPlaying]);

  useEffect(() => {
    const animationTarget = interactionTargetRef?.current ?? containerRef.current;
    if (!animationTarget) return;

    setTiltStage(animationTarget, true);
    return () => setTiltStage(animationTarget, false);
  }, [interactionTargetRef]);

  // Fetch the video only once the card nears the viewport, and pause it while
  // it is far off screen (resuming only what we paused, not a user's pause).
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let autoPaused = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setLoadVideo(true);
          if (autoPaused) {
            autoPaused = false;
            void video.play().catch(() => {});
          }
        } else if (!video.paused) {
          autoPaused = true;
          video.pause();
        }
      },
      { rootMargin: VIDEO_MARGIN },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (Number(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = 0.7;
        videoRef.current.muted = false;
        setVolume(0.7);
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
        setIsMuted(true);
      }
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`group relative w-full overflow-hidden rounded-[1.25rem] bg-black ${className}`}
      style={{
        perspective: "1200px",
      }}
    >
      <div className="h-full w-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={loadVideo ? videoSrc : undefined}
          poster={posterSrc}
          preload="none"
          autoPlay
          muted
          loop
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) {
              void video.play();
            } else {
              video.pause();
            }
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playsInline
          aria-label={alt}
        />
      </div>

      {/* Shine effect overlay */}
      <div
        ref={shineRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)",
          opacity: 0,
          transition: "opacity 0.1s ease-out",
        }}
      />

      {/* Video Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 py-3 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Control Buttons Row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="text-white hover:text-brand-red transition-colors p-1 rounded-full hover:bg-white/10"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  className="w-5 h-5"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="4" width="3" height="16" fill="white" />
                  <rect x="15" y="4" width="3" height="16" fill="white" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21" fill="white" />
                </svg>
              )}
            </button>

            {/* Previous/Rewind Button */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(
                    0,
                    videoRef.current.currentTime - 10,
                  );
                }
              }}
              className="text-white hover:text-brand-red transition-colors p-1 rounded-full hover:bg-white/10"
              title="Rewind 10s"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <polygon points="15 18 5 12 15 6" fill="white" />
                <polygon points="20 18 10 12 20 6" fill="white" />
              </svg>
            </button>

            {/* Time Display */}
            <span className="text-white text-xs font-medium min-w-[50px]">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Time Duration */}
            <span className="text-white text-xs font-medium min-w-[50px] text-right">
              {formatTime(duration)}
            </span>

            {/* Next/Forward Button */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.min(
                    duration,
                    videoRef.current.currentTime + 10,
                  );
                }
              }}
              className="text-white hover:text-brand-red transition-colors p-1 rounded-full hover:bg-white/10"
              title="Forward 10s"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                <polygon points="9 6 19 12 9 18" fill="white" />
                <polygon points="4 6 14 12 4 18" fill="white" />
              </svg>
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-brand-red transition-colors p-1 rounded-full hover:bg-white/10"
              title="Fullscreen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7 7v10h10M7 7H5v2M7 7v-2h2M17 7v-2h2v2M17 17h2v-2M17 17v2h-2M7 17v2h2v-2"
                  stroke="white"
                />
              </svg>
            </button>

            {/* Mute/Unmute Button */}
            <button
              onClick={handleMuteToggle}
              className="text-white hover:text-brand-red transition-colors p-1 rounded-full hover:bg-white/10"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 4l18 18M3 9v6h4l5 5V4L7 9H3z" stroke="white" />
                  <path d="M23 9v6" opacity="0.3" stroke="white" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                    fill="white"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercent}
            onChange={handleProgressChange}
            className="w-full h-1 bg-gray-400 rounded-full cursor-pointer appearance-none accent-brand-red"
            style={{
              background: `linear-gradient(to right, rgb(200, 30, 30) 0%, rgb(200, 30, 30) ${progressPercent}%, rgb(100, 100, 100) ${progressPercent}%, rgb(100, 100, 100) 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
