import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import stock images
import businessOwner1 from "@assets/stock_images/successful_restauran_585fac32.jpg";
import businessOwner2 from "@assets/stock_images/successful_restauran_41c16385.jpg";
import businessOwner3 from "@assets/stock_images/successful_restauran_039f182e.jpg";
import teamWork1 from "@assets/stock_images/restaurant_staff_tea_658450c1.jpg";
import teamWork2 from "@assets/stock_images/restaurant_staff_tea_ce149ad2.jpg";
import teamWork3 from "@assets/stock_images/restaurant_staff_tea_7eaa745e.jpg";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    image: businessOwner1,
    title: "Transform Your Restaurant",
    subtitle: "Join thousands of successful businesses using RestoPOS",
  },
  {
    image: teamWork1,
    title: "Streamline Operations",
    subtitle: "Real-time inventory, orders, and analytics at your fingertips",
  },
  {
    image: businessOwner2,
    title: "Boost Profitability",
    subtitle: "Data-driven insights to maximize your revenue",
  },
  {
    image: teamWork2,
    title: "ZATCA Compliant",
    subtitle: "Fully compliant with Saudi tax regulations",
  },
  {
    image: businessOwner3,
    title: "Scale with Confidence",
    subtitle: "Multi-branch management made simple",
  },
  {
    image: teamWork3,
    title: "Welcome to Success",
    subtitle: "Let's grow your business together",
  },
];

interface WelcomeVideoProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeVideo({ open, onClose }: WelcomeVideoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (open && !isPlaying) {
      // Auto-start after a brief delay
      const autoStartTimer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(autoStartTimer);
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
    onClose();
  };

  const handleReplay = () => {
    setCurrentSlide(0);
    setIsPlaying(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden border-0 bg-black">
        <div className="relative w-full h-full">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
            onClick={handleSkip}
            data-testid="button-close-welcome-video"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
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
                  alt={slides[currentSlide].title}
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
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-xl md:text-2xl text-white/90 max-w-2xl drop-shadow-lg"
                >
                  {slides[currentSlide].subtitle}
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
            {!isPlaying && currentSlide < slides.length - 1 && (
              <Button
                variant="default"
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-white shadow-2xl"
                onClick={handleReplay}
                data-testid="button-play-welcome-video"
              >
                <Play className="h-5 w-5 mr-2" />
                Play
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
