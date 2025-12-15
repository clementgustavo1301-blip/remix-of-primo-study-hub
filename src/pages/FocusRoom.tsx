import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Timer, Play, Pause, RotateCcw, Maximize, Cloud, Coffee, Music, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes

type SoundType = 'rain' | 'lofi' | 'cafe' | null;

const FocusRoom = () => {
  const { addXP } = useProfile();
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundType>(null);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ambient sound URLs (using free ambient sounds)
  const soundUrls = {
    rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
    lofi: 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
    cafe: 'https://assets.mixkit.co/sfx/preview/mixkit-busy-office-ambient-sound-loop-447.mp3',
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
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
      audioRef.current.volume = 0.3;
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

  const handleTimerComplete = async () => {
    setIsRunning(false);

    if (!isBreak) {
      // Completed a focus session
      setCompletedPomodoros((prev) => prev + 1);
      await addXP(25); // Award XP for completing a pomodoro
      toast.success("Pomodoro completo! +25 XP 🎉");
      setTimeLeft(BREAK_TIME);
      setIsBreak(true);
    } else {
      // Break is over
      toast.info("Pausa encerrada! Pronto para mais?");
      setTimeLeft(POMODORO_TIME);
      setIsBreak(false);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_TIME : POMODORO_TIME);
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

  const progress = isBreak 
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
    : ((POMODORO_TIME - timeLeft) / POMODORO_TIME) * 100;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "slide-up",
        isFullscreen && "fixed inset-0 z-50 gradient-bg-animated flex flex-col items-center justify-center p-8"
      )}
    >
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-8">
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
            🍅 {completedPomodoros} pomodoros hoje
          </div>
        </div>
      )}

      <div className={cn(
        "glass rounded-3xl p-12 text-center",
        isFullscreen ? "bg-white/5" : ""
      )}>
        {/* Timer Display */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Progress Ring */}
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/10"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={isBreak ? "text-success" : "text-primary"}
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-light text-foreground tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground uppercase tracking-wider mt-2">
              {isBreak ? "Pausa" : "Foco"}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={resetTimer}
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10"
          >
            <RotateCcw className="h-6 w-6 text-muted-foreground" />
          </Button>
          <Button
            onClick={toggleTimer}
            className={cn(
              "w-20 h-20 rounded-full text-white font-medium",
              isRunning 
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-primary hover:bg-primary/80"
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
            className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10"
          >
            <Maximize className="h-6 w-6 text-muted-foreground" />
          </Button>
        </div>

        {/* Soundscapes */}
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground mr-2">Ambiente:</span>
          <Button
            onClick={() => toggleSound('rain')}
            variant="ghost"
            className={cn(
              "rounded-xl px-4 py-2",
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
              "rounded-xl px-4 py-2",
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
              "rounded-xl px-4 py-2",
              activeSound === 'cafe' 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-white/5 hover:bg-white/10 text-muted-foreground"
            )}
          >
            <Coffee className="h-5 w-5 mr-2" />
            Cafeteria
          </Button>
          {activeSound && (
            <Button
              onClick={() => setActiveSound(null)}
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-xl bg-destructive/20 hover:bg-destructive/30 text-destructive"
            >
              <VolumeX className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FocusRoom;
