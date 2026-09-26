'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/site.config';
import { useAuth } from '@/components/auth/auth-context';
import { cyberEase } from '@/lib/motion';

export default function Navbar() {
  const pathname = usePathname();
  const { user, authAvailable, openAuthModal, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isScrolled
          ? 'bg-obsidian/90 backdrop-blur-md border-b border-acid/25 shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
          : 'bg-obsidian/60 backdrop-blur-sm border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="w-8 h-8 rounded-lg bg-obsidian-card border border-acid flex items-center justify-center text-acid shadow-[0_0_12px_rgba(163,230,53,0.25)] transition-shadow group-hover:shadow-[0_0_18px_rgba(163,230,53,0.45)]"
          >
            <Shield className="w-4 h-4" />
          </motion.div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-muted-heading tracking-tight">
              {siteConfig.name}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-acid/15 text-acid border border-acid/30">
              BETA
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links with Sliding Indicator */}
        <nav className="hidden md:flex items-center gap-2 relative">
          {siteConfig.navigation.map((item) => {
            const isActive = pathname === item.href;
            const isHovered = hoveredNav === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredNav(item.href)}
                onMouseLeave={() => setHoveredNav(null)}
                className="relative px-3.5 py-1.5 text-sm font-medium transition-colors"
              >
                <span
                  className={`inline-flex items-center gap-1 font-mono tracking-tight transition-colors ${
                    isActive ? 'text-acid font-semibold' : 'text-muted-body hover:text-white'
                  }`}
                >
                  <span
                    className={`text-acid text-xs transition-opacity duration-150 ${
                      isActive || isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    &gt;
                  </span>
                  {item.label}
                </span>

                {/* Sliding active indicator underline */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-acid shadow-[0_0_8px_rgba(163,230,53,0.7)]"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Auth CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-semibold transition-all hover:border-acid/40"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-acid" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-body hover:text-alert-red transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-lime-200 border border-lime-300/20 hover:border-lime-300/50"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Live Demo</span>
              </Link>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 text-xs font-semibold text-muted-heading hover:text-white transition-colors"
              >
                Log In
              </button>
              <motion.button
                onClick={() => openAuthModal('signup')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative group overflow-hidden px-4 py-2 rounded-lg bg-acid hover:bg-acid-hover text-obsidian text-xs font-bold shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all"
              >
                {/* Subtle scan sweep light */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
                <span className="relative z-10 flex items-center gap-1">
                  <span>Get Started</span>
                  <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-muted-body hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Animated Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: cyberEase }}
            className="md:hidden overflow-hidden px-6 pt-3 pb-6 bg-obsidian-card border-b border-acid/20 space-y-4"
          >
            <nav className="flex flex-col gap-2">
              {siteConfig.navigation.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 text-sm py-2 px-3 rounded font-mono ${
                        isActive
                          ? 'bg-acid/10 text-acid font-semibold border-l-2 border-acid'
                          : 'text-muted-body hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span>&gt;</span>
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg bg-acid text-obsidian font-bold text-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-center py-2 text-xs text-alert-red font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : !authAvailable ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-acid text-obsidian font-bold text-xs"
                >
                  Launch Demo
                </Link>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg border border-lime-300/25 text-lime-200 font-semibold text-xs"
                  >
                    Launch Live Demo
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-muted-heading border border-white/15 rounded-lg"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('signup');
                    }}
                    className="w-full py-2.5 rounded-lg bg-acid text-obsidian font-bold text-xs shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
