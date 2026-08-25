# Space Warrior - Modern 2D Space Shooter Video Game

A modern, responsive, mobile-first 2D arcade space shooter video game built with **Phaser 3**, **Web Audio API**, **Firebase Authentication**, **Cloud Firestore**, and **Tailwind CSS**.

---

## 🚀 Game Features

### 1. Main Menu & Visuals
- **Dynamic Starfield & Parallax**: Multi-layer procedural starfield with nebula coloring.
- **Glassmorphism UI**: Polished glass panels with neon cyber glow borders.
- **Synthesized Audio Engine**: Complete 100% procedural Web Audio synthesizer (no external MP3/WAV assets required).
- **Player Profile Status**: Displays current callsign, best high score, and collected galactic coins.

### 2. Player Ship & Controls
- **Mobile Touch / Drag Controls**: 1:1 smooth steering with responsive touch dragging.
- **Desktop Keyboard Controls**: `W`/`A`/`S`/`D` or Arrow Keys to maneuver.
- **Automatic Rapid Laser Fire**: Smooth continuous weapon discharge with manual spacebar support.
- **Vital Systems**:
  - ❤️ **Hull Health** (100 HP)
  - 🛡️ **Deflector Shields** (Rechargeable, absorbs damage before hull is breached)
  - ⚡ **Active Powerup Overclocking**

### 3. Weapon Progression & Arsenal
- **Tier 1: Pulse Laser** - Rapid single cyan laser darts.
- **Tier 2: Dual Blaster** - Twin parallel high-speed energy bolts.
- **Tier 3: Spread Cannon** - 3-way emerald cone spread for crowd clearing.
- **Tier 4: Guided Missile Swarm** - Seeking rockets with proximity homing.
- **Tier 5: Heavy Plasma Cannon** - Piercing violet plasma spheres that blast through waves.

### 4. Enemy Archetypes
- **Crimson Scout (Basic)**: Standard assault units in formation sweeps.
- **Golden Interceptor (Fast)**: High-speed strafing maneuvers.
- **Purple Dreadnought (Tank)**: Armored hull requiring sustained focus fire.
- **Emerald Sniper (Shooter)**: Fires aimed plasma darts directly at player coordinates.
- **Kamikaze Drone**: Self-destruct suicide rammer rushing player position.

### 5. Multi-Phase Boss Battles
- **Titan Dreadnought Flagship**: Appears every 5 sectors.
- **Attack Patterns**:
  1. 5-way heavy plasma spread
  2. 360-degree rotating bullet ring
  3. Aimed salvo barrage targeting ship
  4. Minion summon escorts
- **Berserk Enrage Phase**: Activates under 35% health with red alert lighting and accelerated fire rate.

### 6. Power-Up Pickups
- 🟢 **Medical Nanite Repair (+25 Health)**
- 🔵 **Shield Core Recharge (+35 Shield)**
- 🟡 **Overdrive Supercharger (50% faster fire rate)**
- 🔴 **Double Damage Catalyst (2x firepower)**
- 🟣 **Triple Spread Blaster (Immediate 3-way cannon)**
- 🪙 **Coin Multiplier (2x coins for 15s)**

### 7. Campaign & Difficulty Curve
- **10 Distinct Cosmic Sectors** with custom background color palettes, escalating enemy velocity, increased health scaling, and boss encounters.
- **Combo Multiplier System**: Chain enemy kills within 3 seconds to boost score multipliers up to 3.0x.

### 8. Firebase & Cloud Leaderboards
- **Firebase Authentication**: Guest pilot mode, Email/Password sign up & login, Google Sign-In.
- **Cloud Firestore Leaderboards**: Global high score rankings with medals (🥇 Gold, 🥈 Silver, 🥉 Bronze).
- **Offline Fallback**: Seamless local storage cache if disconnected.

---

## 🛠️ Tech Stack
- **Game Engine**: Phaser 3 (Arcade Physics, Scene Architecture, Particle Systems)
- **Audio**: Web Audio API (Sine/Triangle oscillators, custom white noise snare/cymbals, procedural arpeggios)
- **Backend / Database**: Firebase Authentication, Cloud Firestore
- **Styling**: Tailwind CSS v4, Glassmorphism, Orbitron & Rajdhani Google Fonts
- **Build Tool**: Vite, TypeScript
