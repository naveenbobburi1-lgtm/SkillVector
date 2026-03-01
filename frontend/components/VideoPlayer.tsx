"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL, getToken } from "@/lib/auth";

interface VideoPlayerProps {
  assignmentId: number;
  videoId: number;
  youtubeVideoId: string;
  title: string;
  durationSeconds: number;
  onComplete?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({
  assignmentId,
  videoId,
  youtubeVideoId,
  title,
  durationSeconds,
  onComplete,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurTime] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(0);
  const [completion, setCompletion] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [cheatWarning, setCheatWarning] = useState(false);
  const [ready, setReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  function initPlayer() {
    if (playerRef.current) return;
    playerRef.current = new window.YT.Player("yt-player-" + videoId, {
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0, // Disable native controls to prevent scrubbing
        disablekb: 1, // Disable keyboard shortcuts
        modestbranding: 1,
        rel: 0,
        fs: 0,
        iv_load_policy: 3,
        playsinline: 1,
      },
      events: {
        onReady: () => setReady(true),
        onStateChange: handleStateChange,
      },
    });
  }

  function handleStateChange(event: any) {
    const state = event.data;
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startHeartbeat();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      sendHeartbeat("ended");
    }
  }

  const sendHeartbeat = useCallback(async (event_type: string = "heartbeat") => {
    if (!playerRef.current?.getCurrentTime) return;
    const currentPos = Math.floor(playerRef.current.getCurrentTime());
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE_URL}/video-progress/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          video_id: videoId,
          current_position: currentPos,
          event_type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMaxAllowed(data.max_position || 0);
        setCompletion(data.completion_percent || 0);
        if (data.is_completed && !isCompleted) {
          setIsCompleted(true);
          onComplete?.();
        }
        if (data.cheat_detected) {
          setCheatWarning(true);
          setTimeout(() => setCheatWarning(false), 3000);
        }
      }
    } catch (e) {
      console.error("Heartbeat error:", e);
    }
  }, [videoId, isCompleted, onComplete]);

  function startHeartbeat() {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    sendHeartbeat("play");
    heartbeatRef.current = setInterval(() => sendHeartbeat("heartbeat"), 5000);
  }

  // Anti-cheat: poll player position, snap back if jumped ahead too far
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return;
      const pos = Math.floor(playerRef.current.getCurrentTime());
      setCurTime(pos);
      // If user somehow seeked past max_allowed + 15s, snap them back
      if (maxAllowed > 0 && pos > maxAllowed + 15) {
        playerRef.current.seekTo(maxAllowed, true);
        setCheatWarning(true);
        setTimeout(() => setCheatWarning(false), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [maxAllowed]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      sendHeartbeat("pause");
    };
  }, [sendHeartbeat]);

  function togglePlay() {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      sendHeartbeat("pause");
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    } else {
      playerRef.current.playVideo();
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  const duration = durationSeconds || (playerRef.current?.getDuration?.() || 0);
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const completionPct = Math.min(completion, 100);

  return (
    <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
      {/* Video */}
      <div ref={containerRef} className="relative aspect-video bg-black">
        <div id={`yt-player-${videoId}`} className="w-full h-full" />
        
        {/* Invisible overlay to capture clicks - prevents native YouTube controls */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={togglePlay}
        />

        {/* Cheat warning overlay */}
        {cheatWarning && (
          <div className="absolute inset-0 z-20 bg-red-900/40 flex items-center justify-center pointer-events-none">
            <div className="bg-red-600/90 text-white px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              Skipping detected — Watch the video properly
            </div>
          </div>
        )}

        {/* Completed overlay */}
        {isCompleted && (
          <div className="absolute top-3 right-3 z-20 bg-emerald-600/90 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Completed
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="p-4 space-y-3">
        {/* Progress bar (non-seekable) */}
        <div className="relative w-full h-1.5 bg-border/50 rounded-full overflow-hidden">
          {/* Watched progress */}
          <div
            className="absolute h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!ready}
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary/80 flex items-center justify-center transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-white text-lg">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <span className="text-xs text-text-muted font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-text-muted">
              Completion: <span className={completionPct >= 90 ? "text-emerald-400 font-medium" : "text-primary font-medium"}>{completionPct}%</span>
            </div>
          </div>
        </div>

        <p className="text-sm font-medium text-text-main">{title}</p>
      </div>
    </div>
  );
}
