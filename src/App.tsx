/**
 * Space Warrior - Full Modern Arcade Space Shooter
 * @license Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { initGame, destroyGame, getGameInstance } from './main';
import { AudioManager } from './systems/AudioManager';
import {
  authState,
  subscribeAuth,
  loginAsGuest,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutPlayer,
  type GameUser,
} from './firebase/auth';
import { isFirebaseConfigured } from './firebase/firebase';
import {
  Volume2,
  VolumeX,
  Music,
  User,
  LogOut,
  Maximize,
  Sparkles,
  Shield,
  HelpCircle,
  X,
  LogIn,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import '../styles/main.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState<GameUser>(authState.currentUser);
  const [sfxOn, setSfxOn] = useState<boolean>(true);
  const [musicOn, setMusicOn] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'guest'>('guest');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Mount Phaser Game
    const game = initGame('game-container');

    // 2. Subscribe Auth State
    const unsubscribeAuth = subscribeAuth((user) => {
      setCurrentUser(user);
    });

    const audio = AudioManager.getInstance();
    setSfxOn(audio.sfxEnabled);
    setMusicOn(audio.musicEnabled);

    const handleOpenAuth = () => {
      setShowAuthModal(true);
    };
    window.addEventListener('open-pilot-auth', handleOpenAuth);

    return () => {
      window.removeEventListener('open-pilot-auth', handleOpenAuth);
      unsubscribeAuth();
      destroyGame();
    };
  }, []);

  const handleExitToMenu = () => {
    const game = getGameInstance();
    if (game) {
      AudioManager.getInstance().stopMusic();
      game.scene.stop('GameScene');
      game.scene.stop('LeaderboardScene');
      game.scene.stop('GameOverScene');
      game.scene.start('MenuScene');
    }
    setShowExitModal(false);
  };

  const handleExitAndLogout = async () => {
    handleExitToMenu();
    await logoutPlayer();
    setShowExitModal(false);
    setShowAuthModal(true);
  };

  const handleToggleSfx = () => {
    const audio = AudioManager.getInstance();
    audio.resume();
    const updated = audio.toggleSound();
    setSfxOn(updated);
  };

  const handleToggleMusic = () => {
    const audio = AudioManager.getInstance();
    audio.resume();
    const updated = audio.toggleMusic();
    setMusicOn(updated);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'guest') {
        await loginAsGuest(nameInput || 'Ace Pilot');
        setShowAuthModal(false);
      } else if (authMode === 'login') {
        if (!emailInput || !passwordInput) {
          throw new Error('Please enter email and password.');
        }
        await loginWithEmail(emailInput, passwordInput);
        setShowAuthModal(false);
      } else if (authMode === 'register') {
        if (!emailInput || !passwordInput) {
          throw new Error('Please enter email and password.');
        }
        if (passwordInput.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await registerWithEmail(emailInput, passwordInput, nameInput || 'Commander');
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await loginWithGoogle();
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Google authentication canceled or unavailable.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#05070A] text-[#E0E0E0] font-sans selection:bg-[#00F2FF]/30 flex flex-col justify-between overflow-hidden">
      {/* Background Starfield Pattern & Ambient Glows */}
      <div className="absolute inset-0 starfield-bg opacity-35 pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay z-40 opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00F2FF]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation & Status Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 bg-[#05070A]/85 backdrop-blur-md border-b border-[#00F2FF]/15">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#00F2FF] to-[#FF2E63] flex items-center justify-center font-black text-white text-lg sm:text-xl shadow-[0_0_20px_rgba(0,242,255,0.4)]">
            S
          </div>
          <div>
            <h1 className="font-orbitron text-base sm:text-xl font-black tracking-tight text-[#00F2FF] glow-text uppercase">
              Space Warrior
            </h1>
            <p className="text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase opacity-60 font-mono">
              Orbital Defense Protocol v4.2
            </p>
          </div>
        </div>

        {/* Top Center / Right Stats & Controls */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Top Score Telemetry */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] uppercase opacity-50 font-mono tracking-widest">High Score</span>
            <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wider">
              {currentUser.highScore.toLocaleString()}
            </span>
          </div>

          <div className="hidden md:block h-7 w-[1px] bg-[#00F2FF]/20" />

          {/* Connection Status */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] uppercase opacity-50 font-mono tracking-widest">Status</span>
            <span className="text-xs font-mono font-bold text-[#00F2FF] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00F2FF] animate-pulse shadow-[0_0_8px_#00F2FF]" />
              {isFirebaseConfigured ? 'CONNECTED' : 'LOCAL ARCHIVE'}
            </span>
          </div>

          {/* User Profile / Login Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#00F2FF]/10 hover:bg-[#00F2FF]/20 border border-[#00F2FF]/40 text-xs font-orbitron text-[#00F2FF] tracking-wider transition-all shadow-[0_0_12px_rgba(0,242,255,0.15)] cursor-pointer"
            title="Pilot Profile & Cloud Sync"
          >
            <User className="w-3.5 h-3.5 text-[#00F2FF]" />
            <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.displayName}</span>
          </button>

          {/* Audio Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSfx}
              className={`p-1.5 sm:p-2 rounded-sm border transition-all cursor-pointer ${
                sfxOn
                  ? 'bg-[#00F2FF]/15 border-[#00F2FF] text-[#00F2FF] shadow-[0_0_10px_rgba(0,242,255,0.3)]'
                  : 'bg-white/5 border-white/15 text-neutral-500'
              }`}
              title={sfxOn ? 'Mute SFX' : 'Enable SFX'}
            >
              {sfxOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleToggleMusic}
              className={`p-1.5 sm:p-2 rounded-sm border transition-all cursor-pointer ${
                musicOn
                  ? 'bg-[#FF2E63]/20 border-[#FF2E63] text-[#FF2E63] shadow-[0_0_10px_rgba(255,46,99,0.3)]'
                  : 'bg-white/5 border-white/15 text-neutral-500'
              }`}
              title={musicOn ? 'Mute Music' : 'Play Music'}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 sm:p-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/20 text-[#E0E0E0] transition-all cursor-pointer"
              title="Tactical Briefing & Controls"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={handleFullscreen}
              className="p-1.5 sm:p-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/20 text-[#E0E0E0] transition-all cursor-pointer hidden sm:flex"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Main Header Quit Game Button */}
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm bg-[#FF2E63]/15 hover:bg-[#FF2E63]/25 border border-[#FF2E63]/50 text-xs font-orbitron text-[#FF2E63] hover:text-white tracking-wider transition-all shadow-[0_0_12px_rgba(255,46,99,0.2)] cursor-pointer"
              title="Quit Game / Abort Mission"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF2E63]" />
              <span className="font-bold sm:inline hidden">QUIT GAME</span>
              <span className="font-bold sm:hidden inline">QUIT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        <div
          id="game-container"
          ref={containerRef}
          className="relative w-full max-w-[540px] max-h-[86vh] aspect-[9/16] rounded-lg overflow-hidden border border-[#00F2FF]/30 shadow-[0_0_40px_rgba(0,242,255,0.2)] bg-[#05070A]"
        />
      </main>

      {/* Telemetry Footer */}
      <footer className="relative z-30 px-4 sm:px-8 py-2.5 sm:py-3 bg-[#05070A]/90 border-t border-[#00F2FF]/15 flex justify-between items-center text-xs">
        <div className="flex gap-4 sm:gap-8 items-center">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase opacity-50 font-mono tracking-widest">Coins</span>
            <span className="text-xs sm:text-sm font-bold text-white font-mono">🪙 {currentUser.coins} Cr</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase opacity-50 font-mono tracking-widest">Active System</span>
            <span className="text-xs sm:text-sm font-bold text-[#00F2FF] font-mono">Plasma Vulcan V2</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] uppercase opacity-50 font-mono tracking-widest">Pilot Rank</span>
            <span className="text-xs sm:text-sm font-bold text-white font-mono">Commander</span>
          </div>
        </div>

        {/* Tactical Keybind Badges */}
        <div className="flex gap-2 items-center">
          <div className="px-2 py-1 rounded-sm border border-white/15 bg-white/5 font-mono text-[9px] sm:text-[10px] text-neutral-400">
            [ESC] PAUSE
          </div>
          <div className="hidden sm:block px-2 py-1 rounded-sm border border-white/15 bg-white/5 font-mono text-[9px] sm:text-[10px] text-neutral-400">
            [WASD] MOVE
          </div>
          <div className="px-2 py-1 rounded-sm border border-[#00F2FF]/30 bg-[#00F2FF]/10 font-mono text-[9px] sm:text-[10px] text-[#00F2FF]">
            AUTO-FIRE
          </div>
        </div>
      </footer>

      {/* Auth & Player Profile Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#070b12] border border-[#00F2FF]/40 rounded-lg p-6 shadow-[0_0_50px_rgba(0,242,255,0.2)] text-white">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#00F2FF] to-[#FF2E63] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
                <Shield className="w-5 h-5 text-black font-bold" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-base text-white tracking-wider">COMMANDER DOSSIER</h3>
                <p className="text-[10px] font-mono text-[#00F2FF] tracking-widest uppercase">Orbital Sync & Authentication</p>
              </div>
            </div>

            {/* Current Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-sm bg-[#05070A] border border-[#00F2FF]/20 text-center font-mono">
              <div>
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">High Score</span>
                <span className="text-xs sm:text-sm font-bold text-[#00F2FF]">{currentUser.highScore.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Credits</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300">{currentUser.coins} Cr</span>
              </div>
              <div>
                <span className="block text-[9px] text-neutral-400 uppercase tracking-wider">Sector</span>
                <span className="text-xs sm:text-sm font-bold text-[#FF2E63]">LV.{currentUser.level}</span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex rounded-sm bg-[#05070A] p-1 mb-4 border border-white/10 text-xs font-orbitron">
              <button
                type="button"
                onClick={() => setAuthMode('guest')}
                className={`flex-1 py-1.5 rounded-sm transition-all tracking-wider ${
                  authMode === 'guest' ? 'bg-[#00F2FF] text-[#05070A] font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-neutral-400'
                }`}
              >
                GUEST
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 rounded-sm transition-all tracking-wider ${
                  authMode === 'login' ? 'bg-[#00F2FF] text-[#05070A] font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-neutral-400'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-1.5 rounded-sm transition-all tracking-wider ${
                  authMode === 'register' ? 'bg-[#00F2FF] text-[#05070A] font-bold shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-neutral-400'
                }`}
              >
                REGISTER
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 rounded-sm bg-[#FF2E63]/15 border border-[#FF2E63]/60 text-[#FF2E63] text-xs font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {(authMode === 'guest' || authMode === 'register') && (
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-neutral-300 mb-1 uppercase">Callsign / Pilot Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={currentUser.displayName || 'Commander'}
                    className="w-full px-3 py-2 rounded-sm bg-[#05070A] border border-white/20 text-white placeholder-neutral-600 text-sm focus:border-[#00F2FF] focus:outline-none font-mono"
                    maxLength={30}
                  />
                </div>
              )}

              {authMode !== 'guest' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-neutral-300 mb-1 uppercase">Comm Link (Email)</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="pilot@orbital-fleet.org"
                      className="w-full px-3 py-2 rounded-sm bg-[#05070A] border border-white/20 text-white placeholder-neutral-600 text-sm focus:border-[#00F2FF] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-neutral-300 mb-1 uppercase">Security Cipher (Password)</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-sm bg-[#05070A] border border-white/20 text-white placeholder-neutral-600 text-sm focus:border-[#00F2FF] focus:outline-none font-mono"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 sophisticated-btn-primary text-sm shadow-[0_0_25px_rgba(0,242,255,0.5)] disabled:opacity-50"
              >
                {authLoading ? 'AUTHENTICATING...' : authMode === 'guest' ? 'CONFIRM CALLSIGN & LAUNCH' : authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                className="w-full py-2.5 rounded-sm bg-white/5 hover:bg-white/10 border border-white/20 text-white font-orbitron text-xs flex items-center justify-center gap-2 transition-all cursor-pointer tracking-wider"
              >
                <LogIn className="w-4 h-4 text-[#00F2FF]" />
                SIGN IN WITH GOOGLE
              </button>

              {!currentUser.isAnonymous && (
                <button
                  type="button"
                  onClick={async () => {
                    await logoutPlayer();
                    setShowAuthModal(false);
                  }}
                  className="w-full py-2 text-center text-xs text-[#FF2E63] hover:underline flex items-center justify-center gap-1 cursor-pointer font-mono uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  DISCONNECT CLOUD IDENTITY
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Tactical Briefing Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#070b12] border border-[#00F2FF]/40 rounded-lg p-6 shadow-[0_0_50px_rgba(0,242,255,0.2)] text-white">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-orbitron font-bold text-base text-[#00F2FF] mb-3 uppercase tracking-wider">
              TACTICAL BRIEFING
            </h3>

            <div className="space-y-2.5 text-xs font-rajdhani text-neutral-300">
              <div className="p-2.5 rounded-sm bg-[#05070A] border border-[#00F2FF]/20">
                <span className="font-bold text-[#00F2FF] font-orbitron text-[11px] block mb-1">🕹️ FLIGHT CONTROLS:</span>
                <p>Drag on screen or press W/A/S/D / Arrow Keys. Ship auto-fires continuously.</p>
              </div>
              <div className="p-2.5 rounded-sm bg-[#05070A] border border-amber-500/20">
                <span className="font-bold text-amber-400 font-orbitron text-[11px] block mb-1">⚡ WEAPON ARSENAL:</span>
                <p>Vulcan &rarr; Dual Blaster &rarr; Triple Laser &rarr; Missile Barrage &rarr; Plasma Cannon.</p>
              </div>
              <div className="p-2.5 rounded-sm bg-[#05070A] border border-[#FF2E63]/20">
                <span className="font-bold text-[#FF2E63] font-orbitron text-[11px] block mb-1">👾 THREAT INTEL:</span>
                <p>10 Sectors with Kamikaze interceptors and Titan Dreadnought Flagship boss encounters.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-4 py-2 rounded-sm bg-[#00F2FF]/20 hover:bg-[#00F2FF]/30 border border-[#00F2FF] text-[#00F2FF] font-orbitron text-xs font-bold uppercase tracking-wider transition-all"
            >
              ACKNOWLEDGE & RETURN
            </button>
          </div>
        </div>
      )}

      {/* Global Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#070b12] border border-[#FF2E63]/50 rounded-lg p-6 shadow-[0_0_50px_rgba(255,46,99,0.25)] text-white">
            <button
              onClick={() => setShowExitModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-sm bg-[#FF2E63]/20 border border-[#FF2E63] flex items-center justify-center shadow-[0_0_15px_rgba(255,46,99,0.4)]">
                <AlertTriangle className="w-5 h-5 text-[#FF2E63]" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-base text-[#FF2E63] tracking-wider uppercase">
                  QUIT GAME / MISSION
                </h3>
                <p className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
                  Orbital Defense Command
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 font-mono mb-5 leading-relaxed bg-[#05070A] p-3 rounded-sm border border-white/10">
              Are you sure you want to quit? You can abort the active combat mission and return to the main menu or log out.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExitToMenu}
                className="w-full py-2.5 px-4 rounded-sm bg-[#00F2FF]/15 hover:bg-[#00F2FF]/25 border border-[#00F2FF] text-[#00F2FF] font-orbitron text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>QUIT TO MAIN MENU</span>
              </button>

              <button
                onClick={handleExitAndLogout}
                className="w-full py-2.5 px-4 rounded-sm bg-[#FF2E63]/15 hover:bg-[#FF2E63]/25 border border-[#FF2E63] text-[#FF2E63] font-orbitron text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>QUIT GAME & LOG OUT</span>
              </button>

              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2 rounded-sm bg-white/5 hover:bg-white/10 border border-white/15 text-neutral-400 hover:text-white font-orbitron text-xs tracking-wider transition-all cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
