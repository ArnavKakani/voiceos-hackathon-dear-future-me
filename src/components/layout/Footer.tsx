import { LogoSlot } from '../ui/LogoSlot';
import { PartnerLogoSlot } from '../ui/PartnerLogoSlot';
import { footerLinks } from '../../data';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#F9F5ED] border-t border-[#9FD89C]/40 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <LogoSlot size="lg" />
            <p className="font-handwriting text-[#5D8E67]/75 text-base leading-relaxed max-w-xs">
              A space for students to pause, reflect, and remember they are more than what they achieve.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-comfortaa font-bold text-[#5D8E67] mb-3 text-sm uppercase tracking-wide">Pages</h4>
            <div className="flex flex-col gap-2">
              {footerLinks.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="text-sm font-comfortaa text-[#5D8E67]/70 hover:text-[#5D8E67] transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Collaboration */}
          <div>
            <h4 className="font-comfortaa font-bold text-[#5D8E67] mb-4 text-sm uppercase tracking-wide">In Collaboration With</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <PartnerLogoSlot name="NeuroHealth Alliance" className="sm:items-start" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#9FD89C]/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-comfortaa text-[#5D8E67]/60 text-center sm:text-left">
            In collaboration with NeuroHealth Alliance
          </p>
          <p className="text-xs font-comfortaa text-[#5D8E67]/60 flex items-center gap-1">
            © 2026 Dear Future Me - Developed by Nikhilesh Suravarjjala :)
          </p>
        </div>
      </div>
    </footer>
  );
}
