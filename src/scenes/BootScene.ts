import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // Generate procedural pixel-perfect HD textures
    this.generatePlayerTexture();
    this.generateShieldTexture();
    this.generateBulletTextures();
    this.generateEnemyTextures();
    this.generateBossTexture();
    this.generatePowerUpTextures();
    this.generateParticleTextures();
  }

  public create(): void {
    this.scene.start('PreloadScene');
  }

  // --- Procedural Canvas Texture Generators ---

  private generatePlayerTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Outer Glow
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    // Main Ship Hull
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(32, 4); // Nose
    ctx.lineTo(46, 26);
    ctx.lineTo(60, 48); // Right Wing
    ctx.lineTo(48, 54);
    ctx.lineTo(38, 46);
    ctx.lineTo(36, 58); // Right Thruster
    ctx.lineTo(28, 58); // Left Thruster
    ctx.lineTo(26, 46);
    ctx.lineTo(16, 54);
    ctx.lineTo(4, 48); // Left Wing
    ctx.lineTo(18, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Armour Accents
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(32, 16);
    ctx.lineTo(42, 34);
    ctx.lineTo(32, 28);
    ctx.lineTo(22, 34);
    ctx.closePath();
    ctx.fill();

    // Cockpit Glass
    const cockpitGrad = ctx.createLinearGradient(32, 18, 32, 36);
    cockpitGrad.addColorStop(0, '#ffffff');
    cockpitGrad.addColorStop(0.5, '#00ffff');
    cockpitGrad.addColorStop(1, '#0055ff');
    ctx.fillStyle = cockpitGrad;
    ctx.beginPath();
    ctx.ellipse(32, 26, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine Thrusters Glow
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(29, 56, 6, 6);

    this.textures.addCanvas('player', canvas);
  }

  private generateShieldTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(40, 40, 20, 40, 40, 38);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.8)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(40, 40, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    this.textures.addCanvas('player_shield', canvas);
  }

  private generateBulletTextures(): void {
    // 1. Normal Laser (Cyan Bolt)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 12;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      const grad = ctx.createLinearGradient(6, 0, 6, 32);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#00f0ff');
      grad.addColorStop(1, 'rgba(0, 136, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(3, 0, 6, 32);
      this.textures.addCanvas('bullet_laser', canvas);
    }

    // 2. Double Laser (Twin Blue Pulse)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#0088ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00d4ff';
      ctx.fillRect(2, 0, 4, 36);
      ctx.fillRect(10, 0, 4, 36);
      this.textures.addCanvas('bullet_double', canvas);
    }

    // 3. Triple Laser (Emerald Spread)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 14;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.ellipse(7, 18, 5, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.ellipse(7, 18, 2, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('bullet_triple', canvas);
    }

    // 4. Missile (Homing rocket)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(14, 12);
      ctx.lineTo(14, 26);
      ctx.lineTo(8, 24);
      ctx.lineTo(2, 26);
      ctx.lineTo(2, 12);
      ctx.closePath();
      ctx.fill();

      // Warhead
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(13, 10);
      ctx.lineTo(3, 10);
      ctx.closePath();
      ctx.fill();

      // Fins
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(0, 22, 16, 6);
      this.textures.addCanvas('bullet_missile', canvas);
    }

    // 5. Plasma Orb (Violet Energy)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 36;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#9d00ff';
      ctx.shadowBlur = 14;
      const grad = ctx.createRadialGradient(18, 18, 4, 18, 18, 17);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#d946ef');
      grad.addColorStop(0.8, '#9333ea');
      grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(18, 18, 17, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('bullet_plasma', canvas);
    }

    // 6. Enemy Bullet (Crimson Dart)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 12;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.ellipse(6, 12, 5, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.ellipse(6, 12, 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('bullet_enemy', canvas);
    }

    // 7. Enemy Aimed (Amber Dart)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 14;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.moveTo(7, 24);
      ctx.lineTo(14, 4);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      this.textures.addCanvas('bullet_enemy_aimed', canvas);
    }

    // 8. Boss Heavy (Ruby Mega Plasma)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 38;
      canvas.height = 38;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 16;
      const grad = ctx.createRadialGradient(19, 19, 4, 19, 19, 18);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#ff0055');
      grad.addColorStop(0.8, '#aa0033');
      grad.addColorStop(1, 'rgba(170, 0, 51, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(19, 19, 18, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('bullet_boss', canvas);
    }
  }

  private generateEnemyTextures(): void {
    // 1. Basic Enemy (Crimson Scout)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#1e0811';
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(24, 44); // Nose pointing down
      ctx.lineTo(44, 10);
      ctx.lineTo(34, 4);
      ctx.lineTo(24, 16);
      ctx.lineTo(14, 4);
      ctx.lineTo(4, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eye core
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(24, 26, 5, 0, Math.PI * 2);
      ctx.fill();

      this.textures.addCanvas('enemy_basic', canvas);
    }

    // 2. Fast Enemy (Golden Interceptor)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 44;
      canvas.height = 44;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#1f1604';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(22, 42);
      ctx.lineTo(40, 8);
      ctx.lineTo(22, 18);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 24, 4, 8);

      this.textures.addCanvas('enemy_fast', canvas);
    }

    // 3. Tank Enemy (Heavy Purple Dreadnought)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 68;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#9d00ff';
      ctx.shadowBlur = 10;

      ctx.fillStyle = '#130421';
      ctx.strokeStyle = '#9d00ff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(34, 58);
      ctx.lineTo(60, 40);
      ctx.lineTo(64, 14);
      ctx.lineTo(48, 6);
      ctx.lineTo(34, 18);
      ctx.lineTo(20, 6);
      ctx.lineTo(4, 14);
      ctx.lineTo(8, 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cannons
      ctx.fillStyle = '#9d00ff';
      ctx.fillRect(16, 38, 6, 18);
      ctx.fillRect(46, 38, 6, 18);

      this.textures.addCanvas('enemy_tank', canvas);
    }

    // 4. Shooter Enemy (Emerald Gunner)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 54;
      canvas.height = 54;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#041c11';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(27, 50);
      ctx.lineTo(48, 20);
      ctx.lineTo(38, 6);
      ctx.lineTo(27, 14);
      ctx.lineTo(16, 6);
      ctx.lineTo(6, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(27, 28, 6, 0, Math.PI * 2);
      ctx.fill();

      this.textures.addCanvas('enemy_shooter', canvas);
    }

    // 5. Kamikaze Enemy (Fiery Razor)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 46;
      canvas.height = 46;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = '#ff3b00';
      ctx.shadowBlur = 10;

      ctx.fillStyle = '#290600';
      ctx.strokeStyle = '#ff3b00';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(23, 44);
      ctx.lineTo(42, 6);
      ctx.lineTo(23, 20);
      ctx.lineTo(4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(23, 26, 6, 0, Math.PI * 2);
      ctx.fill();

      this.textures.addCanvas('enemy_kamikaze', canvas);
    }
  }

  private generateBossTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 18;

    // Main Dreadnought Hull
    ctx.fillStyle = '#10030a';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(100, 150); // Central ram
    ctx.lineTo(140, 110);
    ctx.lineTo(190, 80); // Right Wingtip
    ctx.lineTo(180, 20);
    ctx.lineTo(140, 30);
    ctx.lineTo(120, 10);
    ctx.lineTo(80, 10);
    ctx.lineTo(60, 30);
    ctx.lineTo(20, 20);
    ctx.lineTo(10, 80); // Left Wingtip
    ctx.lineTo(60, 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy Weapon Turrets
    ctx.fillStyle = '#220512';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.fillRect(40, 80, 18, 36);
    ctx.strokeRect(40, 80, 18, 36);
    ctx.fillRect(142, 80, 18, 36);
    ctx.strokeRect(142, 80, 18, 36);

    // Glowing Core
    const coreGrad = ctx.createRadialGradient(100, 70, 5, 100, 70, 24);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#ff0055');
    coreGrad.addColorStop(1, 'rgba(255, 0, 85, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(100, 70, 24, 0, Math.PI * 2);
    ctx.fill();

    this.textures.addCanvas('boss_1', canvas);
  }

  private generatePowerUpTextures(): void {
    const drawPowerUp = (
      name: string,
      color: string,
      iconDraw: (ctx: CanvasRenderingContext2D) => void
    ) => {
      const canvas = document.createElement('canvas');
      canvas.width = 36;
      canvas.height = 36;
      const ctx = canvas.getContext('2d')!;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      // Hexagonal / Rounded Orb
      ctx.fillStyle = 'rgba(10, 16, 32, 0.85)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(18, 18, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Icon
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      iconDraw(ctx);

      this.textures.addCanvas(name, canvas);
    };

    // Health
    drawPowerUp('powerup_health', '#00ff88', (ctx) => {
      ctx.fillRect(16, 9, 4, 18);
      ctx.fillRect(9, 16, 18, 4);
    });

    // Shield
    drawPowerUp('powerup_shield', '#00ffff', (ctx) => {
      ctx.beginPath();
      ctx.arc(18, 18, 9, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // Rapid Fire (Lightning)
    drawPowerUp('powerup_rapid', '#ffcc00', (ctx) => {
      ctx.beginPath();
      ctx.moveTo(19, 8);
      ctx.lineTo(12, 19);
      ctx.lineTo(17, 19);
      ctx.lineTo(15, 28);
      ctx.lineTo(24, 16);
      ctx.lineTo(19, 16);
      ctx.closePath();
      ctx.fill();
    });

    // Double Damage
    drawPowerUp('powerup_double_damage', '#ff0055', (ctx) => {
      ctx.font = 'bold 15px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2X', 18, 18);
    });

    // Triple Shot
    drawPowerUp('powerup_triple', '#9d00ff', (ctx) => {
      ctx.beginPath();
      ctx.arc(11, 20, 3, 0, Math.PI * 2);
      ctx.arc(18, 12, 3, 0, Math.PI * 2);
      ctx.arc(25, 20, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Coin Multiplier
    drawPowerUp('powerup_coin', '#ffd700', (ctx) => {
      ctx.font = 'bold 16px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪙', 18, 18);
    });
  }

  private generateParticleTextures(): void {
    // Spark
    {
      const canvas = document.createElement('canvas');
      canvas.width = 12;
      canvas.height = 12;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(6, 6, 0, 6, 6, 6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#00f0ff');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 12, 12);
      this.textures.addCanvas('particle_spark', canvas);
    }

    // Smoke
    {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(12, 12, 2, 12, 12, 11);
      grad.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
      grad.addColorStop(0.6, 'rgba(60, 20, 20, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(12, 12, 11, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('particle_smoke', canvas);
    }

    // Plasma
    {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 15);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, 'rgba(255, 0, 85, 0.8)');
      grad.addColorStop(1, 'rgba(255, 0, 85, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(16, 16, 15, 0, Math.PI * 2);
      ctx.fill();
      this.textures.addCanvas('particle_plasma', canvas);
    }
  }
}
