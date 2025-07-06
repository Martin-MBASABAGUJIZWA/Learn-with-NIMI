// components/Footer.tsx
import {
  Mail,
  Twitter,
  Facebook,
  Github,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t p-6 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left side */}
        <div className="text-center md:text-left">
          <p>© {new Date().getFullYear()} Nimi Learning. All rights reserved.</p>
          <p className="text-xs mt-1">Empowering daily victories in learning and life.</p>
        </div>

        {/* Center: quick links */}
        <div className="flex gap-6">
          <a href="/" className="hover:text-orange-500 transition-colors">Home</a>
          <a href="/missions" className="hover:text-orange-500 transition-colors">Missions</a>
          <a href="/community" className="hover:text-orange-500 transition-colors">Community</a>
          <a href="/about" className="hover:text-orange-500 transition-colors">About</a>
        </div>

        {/* Right side: contact/socials */}
        <div className="flex gap-4 items-center">
          <a href="mailto:hello@nimi.org" className="hover:text-orange-500">
            <Mail className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-orange-500" aria-label="Twitter">
            <Twitter className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-orange-500" aria-label="Facebook">
            <Facebook className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-orange-500" aria-label="GitHub">
            <Github className="w-5 h-5" />
          </a>
          <a href="#" className="hover:text-orange-500" aria-label="LinkedIn">
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
