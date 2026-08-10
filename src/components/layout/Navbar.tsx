import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, LogOut, ExternalLink, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { DfmIconSlot } from '../ui/DfmIconSlot';
import { BEFORE_IT_BREAKS_URL, navLinks } from '../../data';
import { useAuth } from '../../context/AuthContext';

const primaryNavLinks = navLinks.filter(({ path }) => path !== '/voice');

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'You';

  return (
    <motion.nav
      className="sticky top-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="bg-[#F9F5ED]/80 backdrop-blur-sm border-b border-[#9FD89C]/25">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-14">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D8E67] rounded-lg flex items-center gap-2">
            <DfmIconSlot variant="logo" size="sm" />
            <span className="font-comfortaa font-bold text-[#5D8E67] leading-none text-sm whitespace-nowrap">Dear Future Me</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {primaryNavLinks.map(({ label, path }) => (
              <motion.div key={path} className="relative" whileHover="hov" initial="rest" animate="rest">
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-[#9FD89C]/45 text-[#5D8E67]'
                      : 'text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#9FD89C]/15'
                    }`
                  }
                >
                  {label}
                </NavLink>
                <motion.span
                  className="absolute bottom-1 left-3 right-3 h-[1.5px] bg-[#5D8E67]/50 rounded-full pointer-events-none"
                  variants={{ rest: { scaleX: 0 }, hov: { scaleX: 1 } }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              </motion.div>
            ))}

            <motion.div className="relative" whileHover="hov" initial="rest" animate="rest">
              <a
                href={BEFORE_IT_BREAKS_URL}
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all duration-200 text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#9FD89C]/15"
              >
                <span className="inline-flex items-center gap-1">
                  Before It Breaks
                  <ExternalLink size={12} />
                </span>
              </a>
              <motion.span
                className="absolute bottom-1 left-3 right-3 h-[1.5px] bg-[#5D8E67]/50 rounded-full pointer-events-none"
                variants={{ rest: { scaleX: 0 }, hov: { scaleX: 1 } }}
                style={{ originX: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </motion.div>

            <motion.div className="relative" whileHover="hov" initial="rest" animate="rest">
              <NavLink
                to="/voice"
                className={({ isActive }) =>
                  `block px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-[#9FD89C]/45 text-[#5D8E67]'
                    : 'text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#9FD89C]/15'
                  }`
                }
              >
                DFM Voice
              </NavLink>
              <motion.span
                className="absolute bottom-1 left-3 right-3 h-[1.5px] bg-[#5D8E67]/50 rounded-full pointer-events-none"
                variants={{ rest: { scaleX: 0 }, hov: { scaleX: 1 } }}
                style={{ originX: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </motion.div>

            <div className="w-px h-4 bg-[#9FD89C]/40 mx-2" />

            {user ? (
              <>
                <NavLink
                  to="/notebook"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all whitespace-nowrap
                    ${isActive ? 'bg-[#FEE188]/50 text-[#5D8E67]' : 'text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#FEE188]/25'}`
                  }
                >
                  <BookOpen size={13} /> My Notebook
                </NavLink>

                {/* Everything account-ish lives behind one compact avatar, so
                    the signed-in bar can't outgrow the signed-out one. */}
                <div className="relative ml-1">
                  <button
                    onClick={() => setAccountOpen(v => !v)}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    className="w-8 h-8 rounded-full border-2 border-[#9FD89C]/70 bg-[#9FD89C]/20 text-[#3a5c42] font-comfortaa font-bold text-[13px] flex items-center justify-center hover:bg-[#9FD89C]/35 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D8E67]"
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </button>

                  {accountOpen && (
                    <>
                      <button
                        aria-hidden
                        tabIndex={-1}
                        className="fixed inset-0 cursor-default"
                        onClick={() => setAccountOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl border-2 border-[#9FD89C]/50 bg-[#F9F5ED] shadow-lg shadow-[#5D8E67]/10 py-2 z-50">
                        <div className="px-4 py-1.5 font-comfortaa text-[12px] text-[#5D8E67]/55 truncate">
                          {displayName}
                        </div>
                        <NavLink
                          to="/developer"
                          onClick={() => setAccountOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-2 text-[13px] font-comfortaa font-medium transition-all
                            ${isActive ? 'bg-[#B7E3FF]/40 text-[#5D8E67]' : 'text-[#5D8E67]/70 hover:bg-[#B7E3FF]/25 hover:text-[#5D8E67]'}`
                          }
                        >
                          <KeyRound size={13} /> Developer
                        </NavLink>
                        <button
                          onClick={() => { setAccountOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-comfortaa font-medium text-[#5D8E67]/60 hover:bg-[#9FD89C]/15 hover:text-[#5D8E67] transition-all"
                        >
                          <LogOut size={13} /> Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/sign-in"
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-[13px] font-comfortaa font-medium transition-all
                    ${isActive ? 'bg-[#9FD89C]/45 text-[#5D8E67]' : 'text-[#5D8E67]/65 hover:text-[#5D8E67] hover:bg-[#9FD89C]/15'}`
                  }
                >
                  Sign In
                </NavLink>
                <button
                  onClick={() => navigate('/sign-up')}
                  className="ml-1 px-4 py-1.5 rounded-full text-[13px] font-comfortaa font-semibold bg-[#5D8E67] text-[#F9F5ED] hover:bg-[#4a7254] transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-xl text-[#5D8E67]/70 hover:bg-[#9FD89C]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5D8E67]"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#F9F5ED]/95 backdrop-blur-sm border-b border-[#9FD89C]/30 px-5 py-3 flex flex-col gap-0.5">
          {primaryNavLinks.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-comfortaa font-medium transition-all
                ${isActive ? 'bg-[#9FD89C]/40 text-[#5D8E67]' : 'text-[#5D8E67]/70 hover:bg-[#9FD89C]/15 hover:text-[#5D8E67]'}`
              }
            >
              {label}
            </NavLink>
          ))}
          <a
            href={BEFORE_IT_BREAKS_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-comfortaa font-medium transition-all text-[#5D8E67]/70 hover:bg-[#9FD89C]/15 hover:text-[#5D8E67]"
          >
            <span className="inline-flex items-center gap-1.5">
              Before It Breaks
              <ExternalLink size={13} />
            </span>
          </a>
          <NavLink
            to="/voice"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-xl text-sm font-comfortaa font-medium transition-all
              ${isActive ? 'bg-[#9FD89C]/40 text-[#5D8E67]' : 'text-[#5D8E67]/70 hover:bg-[#9FD89C]/15 hover:text-[#5D8E67]'}`
            }
          >
            DFM Voice
          </NavLink>
          {user && (
            <NavLink
              to="/developer"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm font-comfortaa font-medium transition-all
                ${isActive ? 'bg-[#B7E3FF]/45 text-[#5D8E67]' : 'text-[#5D8E67]/70 hover:bg-[#B7E3FF]/20 hover:text-[#5D8E67]'}`
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <KeyRound size={13} /> Developer
              </span>
            </NavLink>
          )}
          <div className="flex gap-2 mt-2 pt-2 border-t border-[#9FD89C]/25">
            {user ? (
              <>
                <NavLink
                  to="/notebook"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-comfortaa font-medium text-[#5D8E67] border border-[#FEE188] bg-[#FEE188]/20 flex items-center justify-center gap-1.5"
                >
                  <BookOpen size={13} /> My Notebook
                </NavLink>
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-comfortaa font-medium text-[#5D8E67]/60 border border-[#9FD89C]/40"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/sign-in" onClick={() => setOpen(false)}
                  className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-comfortaa font-medium text-[#5D8E67] border border-[#9FD89C] hover:bg-[#9FD89C]/15">
                  Sign In
                </NavLink>
                <button onClick={() => { navigate('/sign-up'); setOpen(false); }}
                  className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-comfortaa font-semibold bg-[#5D8E67] text-[#F9F5ED]">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </motion.nav>
  );
}
