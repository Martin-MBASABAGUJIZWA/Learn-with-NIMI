"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Volume2 } from "lucide-react";

function isEmoji(word: string) {
  // Simple regex to detect emoji characters
  // This is a basic one; you can expand if needed
  return /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/u.test(word);
}

export default function NimiReaderButton() {
  const { language } = useLanguage();
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Store references to word spans to clear highlights later
  const wordSpansRef = useRef<HTMLSpanElement[]>([]);
  // Keep track of current utterance to cancel on stop
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoicesLoaded(true);
        };
      }
    }
  }, []);

  const wrapWordsWithSpans = (element: HTMLElement) => {
    // Walk text nodes inside the element and wrap words with spans
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const currentNode = walker.currentNode as Text;
      if (currentNode.nodeValue && currentNode.nodeValue.trim().length > 0) {
        textNodes.push(currentNode);
      }
    }

    wordSpansRef.current = [];

    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      if (!parent) return;

      const words = textNode.nodeValue!.split(/(\s+)/); // keep spaces in array
      const fragment = document.createDocumentFragment();

      words.forEach((word) => {
        if (word.trim() === "") {
          fragment.appendChild(document.createTextNode(word));
          return;
        }
        const span = document.createElement("span");
        span.textContent = word;
        fragment.appendChild(span);
        wordSpansRef.current.push(span);
      });

      parent.replaceChild(fragment, textNode);
    });
  };

  const removeHighlights = () => {
    wordSpansRef.current.forEach((span) => {
      span.classList.remove("nimi-reader-highlight");
    });
  };

  const unwrapSpans = (element: HTMLElement) => {
    // Replace each span with its text content to clean up DOM
    wordSpansRef.current.forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent || ""), span);
    });
    wordSpansRef.current = [];
  };

  const handleClick = () => {
    if (typeof window === "undefined" || !voicesLoaded) return;

    if (speaking) {
      // Stop reading if already speaking
      window.speechSynthesis.cancel();
      setSpeaking(false);
      removeHighlights();
      unwrapSpans(document.body);
      return;
    }

    const main = document.querySelector("main");
    if (!main) return;

    // Prepare the page text for highlighting
    wrapWordsWithSpans(main);

    // Collect words to read, skipping emojis
    const wordsToRead = wordSpansRef.current
      .map((span) => span.textContent || "")
      .filter((word) => !isEmoji(word.trim()));

    if (wordsToRead.length === 0) {
      // Nothing to read
      unwrapSpans(main);
      return;
    }

    // Build full text without emojis for utterance
    const textToSpeak = wordsToRead.join(" ");

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language || "en-US";
    utteranceRef.current = utterance;

    let currentWordIndex = 0;

    setSpeaking(true);

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        // Remove old highlight
        removeHighlights();

        // Highlight current word if exists
        const wordSpan = wordSpansRef.current.find((span) => {
          // Match span text to spoken word ignoring whitespace and emojis
          return (
            (span.textContent || "").trim() ===
            wordsToRead[currentWordIndex].trim()
          );
        });

        if (wordSpan) {
          wordSpan.classList.add("nimi-reader-highlight");
          // Scroll to highlight if needed
          wordSpan.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        currentWordIndex++;
      }
    };

    utterance.onend = () => {
      setSpeaking(false);
      removeHighlights();
      unwrapSpans(main);
    };

    utterance.onerror = () => {
      setSpeaking(false);
      removeHighlights();
      unwrapSpans(main);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <style>{`
        .nimi-reader-highlight {
          background-color: #fde68a;
          border-radius: 0.25rem;
          transition: background-color 0.3s ease;
        }
      `}</style>

      <button
        onClick={handleClick}
        disabled={!voicesLoaded}
        className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white text-sm md:text-base font-bold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300"
      >
        <Volume2 className="w-5 h-5" />
        {speaking ? "🔊 Stop Reading" : "🗣️ Hear from Nimi"}
      </button>
    </>
  );
}
