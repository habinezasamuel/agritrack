import { useState, useEffect, useRef, useCallback } from 'react';
import livestockPhoto from '../../assets/livestock.jpg';
import bananaPhoto from '../../assets/banana_hd.jpg';
import ricePhoto from '../../assets/rice_hd.jpg';
import cropsPhoto from '../../assets/crops_hd.jpg';

export interface FarmingSlide {
  id: string;
  category: string;
  categoryRw: string;
  badge: string;
  badgeClass: string;
  caption: string;
  captionRw: string;
  description: string;
  descriptionRw: string;
  image: string;
  alt: string;
}

export const FARMING_SLIDES: FarmingSlide[] = [
  {
    id: 'livestock',
    category: 'Animal Rearing & Livestock',
    categoryRw: "Ubworozi bw'Amatungo",
    badge: '🐄 Animal Rearing',
    badgeClass: 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50',
    caption: 'Healthy Livestock, Better Farming',
    captionRw: 'Amatungo Meza, Ubworozi Butera Imbere',
    description: 'Monitor livestock health, register dairy cows, goats and poultry, report feed shortages and access expert veterinary support.',
    descriptionRw: 'Kurikirana ubuzima bw’amatungo, wandike inka, ihene n’inkoko, tanga raporo y’ubwatsi, ubone ubufasha bw’inzobere.',
    image: livestockPhoto,
    alt: 'Healthy dairy cattle and goats grazing peacefully on green hill pastures',
  },
  {
    id: 'banana',
    category: 'Banana Plantation Farming',
    categoryRw: "Ubuhinzi bw'Ibitoki",
    badge: '🍌 Banana Farming',
    badgeClass: 'bg-amber-500/30 text-amber-100 border-amber-400/50',
    caption: 'Grow and Monitor Your Banana Plants',
    captionRw: 'Hinga Kandi Ukurikirane Ibitoki Byiza',
    description: 'Track healthy banana trees, manage banana suckers, prevent leaf diseases, and monitor heavy bunch yields.',
    descriptionRw: 'Kurikirana insina zikura neza, ibitoki bibisi bishya, no kurinda ibihingwa udukoko n’indwara.',
    image: bananaPhoto,
    alt: 'Lush green banana plantation with developing banana bunches hanging from trees',
  },
  {
    id: 'rice',
    category: 'Rice Farming & Terraces',
    categoryRw: "Ubuhinzi bw'Umuceri",
    badge: '🌾 Rice Farming',
    badgeClass: 'bg-lime-500/30 text-lime-100 border-lime-400/50',
    caption: 'Monitor Rice Growth from Planting to Harvest',
    captionRw: 'Kurikirana Umuceri Kuva Utewe Kugeza Usaruwe',
    description: 'Monitor terraced rice paddy fields, irrigation channels, fertilizer application schedules, and harvest yields.',
    descriptionRw: 'Kurikirana amazi n’imiyoboro mu mirenge y’umuceri, ifumbire, no gupima umusaruro w’umuceri.',
    image: ricePhoto,
    alt: 'Vibrant terraced green and golden rice paddy fields ready for harvest in Rwanda',
  },
  {
    id: 'crops',
    category: 'Crop Farming & Field Monitoring',
    categoryRw: 'Gukurikirana Imirima',
    badge: '🌱 Crop Farming',
    badgeClass: 'bg-teal-500/30 text-teal-100 border-teal-400/50',
    caption: 'Smart Farming for a Better Future',
    captionRw: 'Ubuhinzi Bugezweho bw’Ejo Hazaza',
    description: 'Farmers and agronomists inspecting crops in the field with digital tools to optimize inputs and maximize yields.',
    descriptionRw: 'Abahinzi n’abashinzwe ubuhinzi bagenzura ibihingwa mu mirima bifashishije ikoranabuhanga.',
    image: cropsPhoto,
    alt: 'Farmer and agronomist examining crop health and produce in an open farm field',
  },
];

interface FarmingSlideshowProps {
  currentLanguage?: 'en' | 'rw';
  onSlideChange?: (slide: FarmingSlide, index: number) => void;
}

export function FarmingSlideshow({ currentLanguage = 'en', onSlideChange }: FarmingSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);
  const SLIDE_DURATION = 4500; // 4.5 seconds

  // Preload local images on mount
  useEffect(() => {
    FARMING_SLIDES.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % FARMING_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + FARMING_SLIDES.length) % FARMING_SLIDES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Continuous auto-play cycle
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, nextSlide, currentIndex]);

  // Sync with parent for background ambience
  useEffect(() => {
    const currentSlide = FARMING_SLIDES[currentIndex];
    onSlideChange?.(currentSlide, currentIndex);
  }, [currentIndex, onSlideChange]);

  const activeSlide = FARMING_SLIDES[currentIndex];
  const isRw = currentLanguage === 'rw';

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/25 bg-[#03150e] shadow-2xl shadow-black/60"
      role="region"
      aria-roledescription="carousel"
      aria-label="AgriTrack Farming Slideshow"
    >
      {/* 16:10 / 16:9 responsive display box */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-[#03150e]">
        {FARMING_SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover transition-transform duration-[6000ms] ease-out motion-reduce:transform-none ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Protective Dark Gradient Overlays for Guaranteed Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
            </div>
          );
        })}

        {/* Top Header: Category Tag & Slide Counter */}
        <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black tracking-wide border shadow-lg backdrop-blur-md ${activeSlide.badgeClass}`}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {isRw ? activeSlide.categoryRw : activeSlide.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-mono font-extrabold text-white border border-white/20 backdrop-blur-md shadow-md">
            <span className="text-emerald-300">0{currentIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">0{FARMING_SLIDES.length}</span>
          </div>
        </div>

        {/* Previous Control Button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/25 backdrop-blur-md transition-all hover:bg-emerald-600 hover:scale-110 active:scale-95 shadow-xl"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next Control Button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/25 backdrop-blur-md transition-all hover:bg-emerald-600 hover:scale-110 active:scale-95 shadow-xl"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bottom Panel: Dynamic Synchronized Captions & Controls */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-7 text-white">
          <p
            className="text-xs font-extrabold uppercase tracking-widest text-emerald-300 drop-shadow-md"
            style={{ color: '#6ee7b7' }}
          >
            {isRw ? activeSlide.categoryRw : activeSlide.category}
          </p>

          <h3
            className="mt-1 text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-lg"
            style={{ color: '#ffffff' }}
          >
            {isRw ? activeSlide.captionRw : activeSlide.caption}
          </h3>

          <p
            className="mt-2 text-xs sm:text-sm text-slate-100 font-medium line-clamp-2 max-w-xl drop-shadow-md"
            style={{ color: '#f1f5f9' }}
          >
            {isRw ? activeSlide.descriptionRw : activeSlide.description}
          </p>

          {/* Indicators Bar: Dots & Auto-play status */}
          <div className="mt-5 flex items-center justify-between gap-4 pt-3 border-t border-white/20">
            {/* Slide Navigation Dots */}
            <div className="flex items-center gap-2">
              {FARMING_SLIDES.map((slide, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}: ${slide.caption}`}
                    aria-current={isActive ? 'true' : 'false'}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-8 bg-emerald-400 ring-2 ring-emerald-300/60 shadow-lg'
                        : 'w-2.5 bg-white/45 hover:bg-white/80'
                    }`}
                  />
                );
              })}
            </div>

            {/* Play/Pause Toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause slideshow' : 'Resume slideshow'}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white hover:bg-black/80 transition backdrop-blur-md border border-white/20"
            >
              {isPlaying ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-rotating</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Paused</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
