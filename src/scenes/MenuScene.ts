import Phaser from 'phaser';
import { Menu } from '../ui/Menu';
import { AudioManager } from '../systems/AudioManager';
import { authState } from '../firebase/auth';

export class MenuScene extends Phaser.Scene {
  private starfield: Phaser.GameObjects.Graphics[] = [];
  private playerShipShowcase: Phaser.GameObjects.Sprite | null = null;
  private soundButtonText: Phaser.GameObjects.Text | null = null;
  private musicButtonText: Phaser.GameObjects.Text | null = null;
  private profileContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  public create(): void {
    const { width, height } = this.cameras.main;

    // 1. Background Starfield
    this.setupStarfield();

    // 2. Player Profile Status Bar (Top)
    this.setupProfileHeader(width);

    // 3. Animated Logo
    this.setupLogo(width);

    // 4. Showcase Player Ship
    this.playerShipShowcase = this.add.sprite(width / 2, 380, 'player');
    this.playerShipShowcase.setScale(1.4);

    this.tweens.add({
      targets: this.playerShipShowcase,
      y: 360,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 5. Menu Buttons (Play, Leaderboard, How to Play, Settings, Exit)
    const playBtn = Menu.createGlassButton(this, width / 2, 475, 'LAUNCH MISSION', () => {
      AudioManager.getInstance().init();
      AudioManager.getInstance().startMusic();
      this.scene.start('GameScene');
    }, 280, 52);

    const leaderBtn = Menu.createGlassButton(this, width / 2, 535, 'LEADERBOARD', () => {
      this.scene.start('LeaderboardScene');
    }, 280, 46);

    const howToBtn = Menu.createGlassButton(this, width / 2, 590, 'HOW TO PLAY', () => {
      this.showHowToPlayModal();
    }, 280, 46);

    const settingsBtn = Menu.createGlassButton(this, width / 2, 645, 'SETTINGS', () => {
      this.showSettingsModal();
    }, 280, 46);

    const quitBtn = Menu.createGlassButton(this, width / 2, 700, 'QUIT GAME', () => {
      this.showQuitGameModal();
    }, 280, 46, true);

    // 6. Quick Sound Toggles (Bottom Bar)
    this.setupBottomBar(width, height);
  }

  private setupStarfield(): void {
    const { width, height } = this.cameras.main;

    // Nebula background glow
    const nebula = this.add.graphics();
    nebula.fillStyle(0x05070A, 1);
    nebula.fillRect(0, 0, width, height);

    // Subtle cyan atmospheric glow in center
    const glow = this.add.graphics();
    glow.fillStyle(0x00F2FF, 0.04);
    glow.fillCircle(width / 2, height / 2, 280);

    // Dynamic Starfield Layer 1 & 2
    for (let layer = 0; layer < 2; layer++) {
      const stars = this.add.graphics();
      stars.fillStyle(layer === 0 ? 0xffffff : 0x00F2FF, layer === 0 ? 0.7 : 0.4);

      for (let i = 0; i < 70; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const radius = layer === 0 ? Phaser.Math.FloatBetween(0.6, 1.4) : Phaser.Math.FloatBetween(1.0, 2.0);
        stars.fillCircle(x, y, radius);
      }
      this.starfield.push(stars);
    }
  }

  private setupProfileHeader(width: number): void {
    const user = authState.currentUser;
    this.profileContainer = this.add.container(width / 2, 45);

    const bg = this.add.graphics();
    bg.fillStyle(0x070b14, 0.9);
    bg.fillRoundedRect(-240, -22, 480, 44, 6);
    bg.lineStyle(1.5, 0x00F2FF, 0.3);
    bg.strokeRoundedRect(-240, -22, 480, 44, 6);

    const nameTxt = this.add.text(-220, 0, `PILOT: ${user.displayName.toUpperCase()}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5);

    const scoreTxt = this.add.text(30, 0, `TOP: ${user.highScore.toLocaleString()}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#00F2FF',
      letterSpacing: 1,
    }).setOrigin(0.5, 0.5);

    const coinTxt = this.add.text(220, 0, `🪙 ${user.coins} Cr`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.profileContainer.add([bg, nameTxt, scoreTxt, coinTxt]);
  }

  private setupLogo(width: number): void {
    const logoContainer = this.add.container(width / 2, 190);

    const title = this.add.text(0, 0, 'SPACE WARRIOR', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '38px',
      fontStyle: '900',
      color: '#00F2FF',
      stroke: '#002633',
      strokeThickness: 5,
      align: 'center',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, 42, 'ORBITAL DEFENSE PROTOCOL', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#94a3b8',
      letterSpacing: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    logoContainer.add([title, subtitle]);

    this.tweens.add({
      targets: title,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private setupBottomBar(width: number, height: number): void {
    const audio = AudioManager.getInstance();

    const audioBar = this.add.container(width / 2, height - 60);

    // Audio & Music Toggles
    const sfxBtn = this.add.container(-90, 0);
    const sfxBg = this.add.graphics();
    sfxBg.fillStyle(0x070b14, 0.85);
    sfxBg.fillRoundedRect(-65, -16, 130, 32, 4);
    sfxBg.lineStyle(1, 0x00F2FF, 0.35);
    sfxBg.strokeRoundedRect(-65, -16, 130, 32, 4);

    this.soundButtonText = this.add.text(0, 0, `SFX: ${audio.sfxEnabled ? 'ON' : 'OFF'}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    sfxBtn.add([sfxBg, this.soundButtonText]);
    sfxBtn.setSize(130, 32);
    sfxBtn.setInteractive({ useHandCursor: true });
    sfxBtn.on('pointerdown', () => {
      const on = audio.toggleSound();
      this.soundButtonText?.setText(`SFX: ${on ? 'ON' : 'OFF'}`);
    });

    const musBtn = this.add.container(90, 0);
    const musBg = this.add.graphics();
    musBg.fillStyle(0x070b14, 0.85);
    musBg.fillRoundedRect(-65, -16, 130, 32, 4);
    musBg.lineStyle(1, 0xFF2E63, 0.35);
    musBg.strokeRoundedRect(-65, -16, 130, 32, 4);

    this.musicButtonText = this.add.text(0, 0, `BGM: ${audio.musicEnabled ? 'ON' : 'OFF'}`, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#FF2E63',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    musBtn.add([musBg, this.musicButtonText]);
    musBtn.setSize(130, 32);
    musBtn.setInteractive({ useHandCursor: true });
    musBtn.on('pointerdown', () => {
      const on = audio.toggleMusic();
      this.musicButtonText?.setText(`BGM: ${on ? 'ON' : 'OFF'}`);
    });

    audioBar.add([sfxBtn, musBtn]);
  }

  public update(): void {
    // Parallax Starfield scroll in menu
    if (this.starfield.length >= 2) {
      this.starfield[0].y = (this.starfield[0].y + 0.3) % 960;
      this.starfield[1].y = (this.starfield[1].y + 0.8) % 960;
    }
  }

  private showHowToPlayModal(): void {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x070b14, 0.96);
    panel.fillRoundedRect(-220, -260, 440, 520, 8);
    panel.lineStyle(1.5, 0x00F2FF, 0.5);
    panel.strokeRoundedRect(-220, -260, 440, 520, 8);

    const title = this.add.text(0, -220, 'HOW TO PLAY', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const instructions = [
      '🕹️ MOBILE: Touch & Drag to steer fighter',
      '⌨️ DESKTOP: W/A/S/D or Arrow Keys to move',
      '🚀 SHOOTING: Auto-fires continuously / Spacebar',
      '⚡ WEAPONS: Pick up upgrades (Double, Triple, Missile, Plasma)',
      '🛡️ DEFENSE: Collect Shields & Medkits',
      '🪙 COINS: Defeat enemies & multiply score',
      '👾 BOSSES: Target weak points during boss fights!',
      '⏸️ PAUSE: Press P or tap top right icon',
    ];

    const contentText = this.add.text(0, -70, instructions.join('\n\n'), {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '15px',
      color: '#E0E0E0',
      fontStyle: '600',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    const closeBtn = Menu.createGlassButton(this, 0, 205, 'DISMISS', () => {
      modal.destroy();
    }, 200, 44);

    modal.add([overlay, panel, title, contentText, closeBtn]);
  }

  private showSettingsModal(): void {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x070b14, 0.96);
    panel.fillRoundedRect(-200, -200, 400, 400, 8);
    panel.lineStyle(1.5, 0x00F2FF, 0.5);
    panel.strokeRoundedRect(-200, -200, 400, 400, 8);

    const title = this.add.text(0, -150, 'AUDIO & SETTINGS', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const audio = AudioManager.getInstance();

    const sfxBtn = Menu.createGlassButton(this, 0, -60, `SOUND: ${audio.sfxEnabled ? 'ENABLED' : 'MUTED'}`, () => {
      const on = audio.toggleSound();
      (sfxBtn.getAt(1) as Phaser.GameObjects.Text).setText(`SOUND: ${on ? 'ENABLED' : 'MUTED'}`);
    }, 300, 46);

    const musBtn = Menu.createGlassButton(this, 0, 10, `MUSIC: ${audio.musicEnabled ? 'ENABLED' : 'MUTED'}`, () => {
      const on = audio.toggleMusic();
      (musBtn.getAt(1) as Phaser.GameObjects.Text).setText(`MUSIC: ${on ? 'ENABLED' : 'MUTED'}`);
    }, 300, 46);

    const closeBtn = Menu.createGlassButton(this, 0, 110, 'SAVE & CLOSE', () => {
      modal.destroy();
    }, 220, 44);

    modal.add([overlay, panel, title, sfxBtn, musBtn, closeBtn]);
  }

  private showQuitGameModal(): void {
    const { width, height } = this.cameras.main;
    const modal = this.add.container(width / 2, height / 2);
    modal.setDepth(350);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.88);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const panel = this.add.graphics();
    panel.fillStyle(0x070b14, 0.96);
    panel.fillRoundedRect(-190, -170, 380, 340, 8);
    panel.lineStyle(1.5, 0xFF2E63, 0.7);
    panel.strokeRoundedRect(-190, -170, 380, 340, 8);

    const title = this.add.text(0, -120, 'QUIT GAME SESSION?', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#FF2E63',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const desc = this.add.text(0, -65, 'High scores and credits remain saved.\nYou can log out or switch pilot accounts.', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#94a3b8',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    const logoutBtn = Menu.createGlassButton(this, 0, 15, 'LOG OUT / SWITCH PILOT', () => {
      modal.destroy();
      // Dispatch custom event to React to open login modal
      window.dispatchEvent(new CustomEvent('open-pilot-auth'));
    }, 280, 46, true);

    const cancelBtn = Menu.createGlassButton(this, 0, 75, 'CANCEL & RESUME', () => {
      modal.destroy();
    }, 280, 46);

    modal.add([overlay, panel, title, desc, logoutBtn, cancelBtn]);
  }
}
