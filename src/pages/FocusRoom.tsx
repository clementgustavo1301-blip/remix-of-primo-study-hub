import { useState, useEffect, useRef, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Timer, Play, Pause, RotateCcw, Maximize, Cloud, Coffee, Music, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

const POMODORO_TIME = 25 * 60; // 25 minutes
const SHORT_TIME = 5 * 60; // 5 minutes

type SoundType = 'rain' | 'lofi' | 'cafe' | null;

const FocusRoom = () => {
  const { addXP } = useProfile();
  const [duration, setDuration] = useState(POMODORO_TIME);
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundType>(null);
  const [volume, setVolume] = useState(30);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambient sound URLs
  const soundUrls = {
    rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
    lofi: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
    cafe: 'https://assets.mixkit.co/sfx/preview/mixkit-busy-office-ambient-sound-loop-447.mp3',
  };

  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (activeSound) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(soundUrls[activeSound]);
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(console.error);
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeSound]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setCompletedPomodoros((prev) => prev + 1);
    
    // Fire confetti
    fireConfetti();
    
    // Award XP
    await addXP(50);
    toast.success("🎉 +50 XP Foco Total!", {
      description: "Parabéns! Você completou um ciclo de foco.",
    });
    
    // Reset timer
    setTimeLeft(duration);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const setMode = (time: number) => {
    setIsRunning(false);
    setDuration(time);
    setTimeLeft(time);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleSound = (sound: SoundType) => {
    setActiveSound(activeSound === sound ? null : sound);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 120;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center slide-up",
        isFullscreen && "fixed inset-0 z-50 gradient-bg-animated p-8"
      )}
    >
      {/* Header - only show when not fullscreen */}
      {!isFullscreen && (
        <div className="w-full flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Timer className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Focus Room</h1>
              <p className="text-muted-foreground">Modo imersivo com Pomodoro</p>
            </div>
          </div>
          <div className="streak-badge">
            🍅 {completedPomodoros} pomodoros
          </div>
        </div>
      )}

      {/* Main Timer Card */}
      <div className={cn(
        "glass rounded-3xl p-8 md:p-12 text-center w-full max-w-lg",
        isFullscreen && "bg-white/5 backdrop-blur-3xl"
      )}>
        {/* Timer Display */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Progress Ring */}
          <svg className="w-56 h-56 md:w-64 md:h-64 transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/10"
            />
            <circle
              cx="50%"
              cy="50%"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl md:text-6xl font-light text-foreground tracking-wider font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
              {duration === POMODORO_TIME ? "Foco Longo" : "Foco Curto"}
            </span>
          </div>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Button
            onClick={() => setMode(SHORT_TIME)}
            variant="ghost"
            className={cn(
              "rounded-xl px-4 py-2 transition-all",
              duration === SHORT_TIME 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            )}
          >
            5 min
          </Button>
          <Button
            onClick={() => setMode(POMODORO_TIME)}
            variant="ghost"
            className={cn(
              "rounded-xl px-4 py-2 transition-all",
              duration === POMODORO_TIME 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            )}
          >
            25 min
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={resetTimer}
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <RotateCcw className="h-6 w-6 text-muted-foreground" />
          </Button>
          <Button
            onClick={toggleTimer}
            className={cn(
              "w-20 h-20 rounded-full text-white font-medium shadow-lg transition-all hover:scale-105",
              isRunning 
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                : "bg-primary hover:bg-primary/80 shadow-primary/30"
            )}
          >
            {isRunning ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all"
          >
            <Maximize className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>

        {/* Soundscapes */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              onClick={() => toggleSound('rain')}
              variant="ghost"
              className={cn(
                "rounded-xl px-4 py-2 transition-all",
                activeSound === 'rain' 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "bg-white/5 hover:bg-white/10 text-muted-foreground"
              )}
            >
              <Cloud className="h-5 w-5 mr-2" />
              Chuva
            </Button>
            <Button
              onClick={() => toggleSound('lofi')}
              variant="ghost"
              className={cn(
                "rounded-xl px-4 py-2 transition-all",
                activeSound === 'lofi' 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "bg-white/5 hover:bg-white/10 text-muted-foreground"
              )}
            >
              <Music className="h-5 w-5 mr-2" />
              Lo-fi
            </Button>
            <Button
              onClick={() => toggleSound('cafe')}
              variant="ghost"
              className={cn(
                "rounded-xl px-4 py-2 transition-all",
                activeSound === 'cafe' 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "bg-white/5 hover:bg-white/10 text-muted-foreground"
              )}
            >
              <Coffee className="h-5 w-5 mr-2" />
              Café
            </Button>
          </div>

          {/* Volume Slider */}
          {activeSound && (
            <div className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 rounded-xl max-w-xs mx-auto fade-in">
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[volume]}
                onValueChange={(val) => setVolume(val[0])}
                max={100}
                step={1}
                className="w-full"
              />
              <span className="text-xs text-muted-foreground w-8">{volume}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen pomodoro counter */}
      {isFullscreen && (
        <div className="mt-8 streak-badge scale-in">
          🍅 {completedPomodoros} pomodoros completos
        </div>
      )}
    </div>
  );
};

export default FocusRoom;