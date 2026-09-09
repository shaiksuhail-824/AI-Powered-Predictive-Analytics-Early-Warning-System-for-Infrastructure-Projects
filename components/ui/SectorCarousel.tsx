'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, FileText, IndianRupee } from 'lucide-react';
import { sectorsData } from '../../data/sectors';
import Image from 'next/image';

export const SectorCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === sectorsData.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? sectorsData.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isHovered, nextSlide]);

  return (
    <div 
      className="relative w-full max-w-5xl mx-auto py-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl shadow-card bg-white border border-border relative">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {sectorsData.map((sector, index) => (
            <div key={sector.id} className="min-w-full flex-shrink-0 flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="md:w-1/2 relative h-64 md:h-96 bg-mospi-50 flex items-center justify-center">
                <Image 
                  src={sector.image}
                  alt={sector.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Content Section */}
              <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                <div className="w-12 h-12 rounded-full bg-mospi-100 flex items-center justify-center mb-6 text-mospi-600 font-bold text-xl shadow-sm border border-mospi-200">
                  {index + 1}
                </div>
                <h3 className="text-3xl font-bold text-text-primary mb-4">{sector.name}</h3>
                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                  {sector.description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-mospi-50 rounded-lg text-mospi-500">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Projects Tracked</div>
                      <div className="font-bold text-text-primary text-lg">{sector.projectsTracked}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-mospi-50 rounded-lg text-mospi-500">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Investment</div>
                      <div className="font-bold text-text-primary text-lg">{sector.investment}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Navigation Arrows */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-mospi-600 shadow-card flex items-center justify-center transition-colors z-10 hidden md:flex hover:scale-105"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-mospi-600 shadow-card flex items-center justify-center transition-colors z-10 hidden md:flex hover:scale-105"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Navigation and Dots */}
      <div className="flex justify-between items-center mt-6 px-2">
        <button 
          onClick={prevSlide} 
          className="p-2 bg-white rounded-full shadow-sm border border-border text-mospi-600 md:hidden"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex justify-center gap-2 flex-1">
          {sectorsData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx 
                  ? 'w-8 h-2.5 bg-mospi-500' 
                  : 'w-2.5 h-2.5 bg-mospi-200 hover:bg-mospi-300'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide} 
          className="p-2 bg-white rounded-full shadow-sm border border-border text-mospi-600 md:hidden"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
