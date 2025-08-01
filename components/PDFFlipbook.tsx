"use client";
import { useState, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PageFlip } from "react-pageflip";
import { motion } from "framer-motion";
import { Howl } from "howler";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PAGE_TURN_SOUND = new Howl({ src: ["/sounds/magic-page-turn.mp3"], volume: 0.5 });

export default function EnchantedFlipbook({ pdfUrl, onClose }: { pdfUrl: string; onClose: () => void }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [dimensions, setDimensions] = useState({ 
    width: Math.min(window.innerWidth - 40, 600),
    height: Math.min(window.innerHeight - 100, 800) 
  });

  const handleResize = useCallback(() => {
    setDimensions({
      width: Math.min(window.innerWidth - 40, 600),
      height: Math.min(window.innerHeight - 100, 800)
    });
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="relative"
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-yellow-300 text-3xl z-10 transition-all"
          aria-label="Close magical storybook"
        >
          ✕
        </button>

        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="text-white text-xl flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                🔮
              </motion.div>
              Summoning story magic...
            </div>
          }
          error={<div className="text-white">Failed to load magical book</div>}
        >
          <PageFlip
            width={dimensions.width}
            height={dimensions.height}
            maxShadowOpacity={0.7}
            showCover={true}
            onFlip={() => {
              PAGE_TURN_SOUND.play();
              confetti({
                particleCount: 10,
                spread: 30,
                origin: { y: 0.6 },
                colors: ['#ffcc00', '#ff6699', '#66ccff']
              });
            }}
            className="shadow-2xl border-2 border-gold-500 rounded-lg overflow-hidden"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div key={`page_${i}`} className="bg-white relative">
                <Page
                  pageNumber={i + 1}
                  width={dimensions.width}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        ✨
                      </motion.div>
                    </div>
                  }
                />
                {i === numPages - 1 && (
                  <motion.div 
                    className="absolute bottom-4 right-4 text-2xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    🏆
                  </motion.div>
                )}
              </div>
            ))}
          </PageFlip>
        </Document>
      </motion.div>
    </motion.div>
  );
}