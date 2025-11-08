import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { X, Play, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

// Import stock images
import businessOwner1 from "@assets/stock_images/successful_restauran_585fac32.jpg";
import businessOwner2 from "@assets/stock_images/successful_restauran_41c16385.jpg";
import businessOwner3 from "@assets/stock_images/successful_restauran_039f182e.jpg";
import teamWork1 from "@assets/stock_images/restaurant_staff_tea_658450c1.jpg";
import teamWork2 from "@assets/stock_images/restaurant_staff_tea_ce149ad2.jpg";
import teamWork3 from "@assets/stock_images/restaurant_staff_tea_7eaa745e.jpg";

interface Slide {
  image: string;
  titleKey: keyof typeof import("@/i18n/translations").translations.English;
  subtitleKey: keyof typeof import("@/i18n/translations").translations.English;
}

const slides: Slide[] = [
  {
    image: businessOwner1,
    titleKey: "videoSlide1Title" as any,
    subtitleKey: "videoSlide1Subtitle" as any,
  },
  {
    image: teamWork1,
    titleKey: "videoSlide2Title" as any,
    subtitleKey: "videoSlide2Subtitle" as any,
  },
  {
    image: businessOwner2,
    titleKey: "videoSlide3Title" as any,
    subtitleKey: "videoSlide3Subtitle" as any,
  },
  {
    image: teamWork2,
    titleKey: "videoSlide4Title" as any,
    subtitleKey: "videoSlide4Subtitle" as any,
  },
  {
    image: businessOwner3,
    titleKey: "videoSlide5Title" as any,
    subtitleKey: "videoSlide5Subtitle" as any,
  },
  {
    image: teamWork3,
    titleKey: "videoSlide6Title" as any,
    subtitleKey: "videoSlide6Subtitle" as any,
  },
];

interface WelcomeVideoProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeVideo({ open, onClose }: WelcomeVideoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (open && !isPlaying) {
      // Auto-start after a brief delay
      const autoStartTimer = setTimeout(() => {
        setIsPlaying(true);
        // Play background music
        if (audioRef.current) {
          audioRef.current.volume = 0.3; // Set volume to 30%
          audioRef.current.play().catch(() => {
            // Handle autoplay restrictions
            console.log("Audio autoplay blocked - user interaction required");
          });
        }
      }, 500);
      return () => clearTimeout(autoStartTimer);
    }
  }, [open]);

  useEffect(() => {
    // Stop music when dialog closes
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [open]);

  useEffect(() => {
    if (!isPlaying) return;

    // Each slide shows for 5 seconds (30 seconds total for 6 slides)
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= slides.length - 1) {
          // Video finished - auto close
          setTimeout(onClose, 2000);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, onClose]);

  const handleSkip = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  };

  const handleReplay = () => {
    setCurrentSlide(0);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log("Audio playback failed");
      });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden border-0 bg-black" data-testid="welcome-video-dialog">
        <VisuallyHidden>
          <DialogTitle>Welcome Video - Restaurant Success Story</DialogTitle>
          <DialogDescription>
            Watch our inspiring success story showcasing how RestoPOS transformed Ahmad's restaurant business
          </DialogDescription>
        </VisuallyHidden>
        <div className="relative w-full h-full" data-testid="welcome-video-container">
          {/* Background Music - Epic cinematic music */}
          <audio
            ref={audioRef}
            loop
            preload="auto"
          >
            {/* Note: Add your epic background music file here */}
            {/* <source src="/path/to/epic-music.mp3" type="audio/mpeg" /> */}
            {/* For demo purposes, you can use royalty-free epic music from sites like:
                - Incompetech.com (Kevin MacLeod's music)
                - YouTube Audio Library
                - Free Music Archive
            */}
          </audio>

          {/* Control buttons */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={toggleMute}
              data-testid="button-toggle-music"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
              onClick={handleSkip}
              data-testid="button-close-welcome-video"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
              data-testid={`welcome-video-slide-${currentSlide + 1}`}
            >
              {/* Background image with parallax effect */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{ duration: 5, ease: "linear" }}
              >
                <img
                  src={slides[currentSlide].image}
                  alt={t[slides[currentSlide].titleKey] || slides[currentSlide].titleKey}
                  className="w-full h-full object-cover"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              </motion.div>

              {/* Text content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl"
                >
                  {t[slides[currentSlide].titleKey] || slides[currentSlide].titleKey}
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-lg"
                >
                  {t[slides[currentSlide].subtitleKey] || slides[currentSlide].subtitleKey}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Control buttons */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
            {!isPlaying && (
              <Button
                variant="default"
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-2xl"
                onClick={handleReplay}
                data-testid="button-play-welcome-video"
              >
                <Play className="h-5 w-5 mr-2" />
                {currentSlide >= slides.length - 1 ? "Replay" : "Play"}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-2xl"
              onClick={handleSkip}
              data-testid="button-skip-welcome-video"
            >
              {currentSlide >= slides.length - 1 ? "Get Started" : "Skip"}
            </Button>
          </div>

          {/* Slide indicators */}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-8 bg-primary"
                    : index < currentSlide
                    ? "w-2 bg-white/50"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
