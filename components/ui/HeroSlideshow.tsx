'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
  { src: '/hero-highway.png', alt: 'Transport and Logistics Infrastructure' },
  { src: '/hero-energy.png', alt: 'Energy Infrastructure' },
  { src: '/hero-water.png', alt: 'Water and Sanitation Infrastructure' },
  { src: '/hero-urban.png', alt: 'Urban Development Infrastructure' }
];

export function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000); // Crossfade every 2 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-cover object-right"
            priority={currentIndex === 0}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Manual Controls */}
      <div className="absolute bottom-6 right-6 md:right-12 flex gap-3 z-20">
        <button 
          onClick={prevSlide}
          className="bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-colors border border-white/20 shadow-lg"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={nextSlide}
          className="bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-colors border border-white/20 shadow-lg"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
