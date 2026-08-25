import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Bullet } from '../entities/Bullet';
import { PowerUp } from '../entities/PowerUp';
import { ScoreSystem } from './ScoreSystem';
import { AudioManager } from './AudioManager';

export class CollisionSystem {
  public scene: Phaser.Scene;
  public scoreSystem: ScoreSystem;
  public sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  public explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private onBossDefeatedCallback: (() => void) | null = null;

  constructor(scene: Phaser.Scene, scoreSystem: ScoreSystem) {
    this.scene = scene;
    this.scoreSystem = scoreSystem;
    this.setupParticles();
  }

  private setupParticles(): void {
    // Laser spark hit particles
    this.sparkEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
      speed: { min: 80, max: 240 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 180,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });

    // Small explosion particles
    this.explosionEmitter = this.scene.add.particles(0, 0, 'particle_smoke', {
      speed: { min: 40, max: 180 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 350,
      emitting: false,
    });
  }

  public emitHitSparks(x: number, y: number, tint: number = 0x00F2FF): void {
    if (this.sparkEmitter) {
      this.sparkEmitter.particleTint = tint;
      this.sparkEmitter.explode(8, x, y);
    }
  }

  public emitExplosion(x: number, y: number): void {
    if (this.explosionEmitter) {
      this.explosionEmitter.explode(16, x, y);
    }
    if (this.sparkEmitter) {
      this.sparkEmitter.particleTint = 0xffaa00;
      this.sparkEmitter.explode(14, x, y);
    }
  }

  public setupCollisions(
    player: Player,
    playerBullets: Phaser.Physics.Arcade.Group,
    enemies: Phaser.Physics.Arcade.Group,
    enemyBullets: Phaser.Physics.Arcade.Group,
    powerUps: Phaser.Physics.Arcade.Group,
    bossGroup: Phaser.Physics.Arcade.Group,
    onBossDefeatedCallback: () => void
  ): void {
    this.onBossDefeatedCallback = onBossDefeatedCallback;

    // 1. Player Bullets vs Enemies
    this.scene.physics.add.overlap(
      playerBullets,
      enemies,
      (bulletObj, enemyObj) => {
        const bullet = (bulletObj instanceof Bullet ? bulletObj : enemyObj instanceof Bullet ? enemyObj : null) as Bullet | null;
        const enemy = (enemyObj instanceof Enemy ? enemyObj : bulletObj instanceof Enemy ? bulletObj : null) as Enemy | null;
        if (!bullet || !enemy || !bullet.active || !enemy.active) return;

        this.emitHitSparks(bullet.x, bullet.y, 0x00F2FF);

        const killed = enemy.takeDamage(bullet.damage, enemyBullets, powerUps);
        if (killed) {
          this.emitExplosion(enemy.x, enemy.y);
          const { pointsGained, coinsGained } = this.scoreSystem.registerEnemyDefeated(
            enemy.scoreValue,
            enemy.coinValue
          );
          this.showFloatingText(enemy.x, enemy.y, `+${pointsGained}`, '#00F2FF');
          if (coinsGained > 0) {
            AudioManager.getInstance().playCoin();
          }
        }

        if (bullet.piercesLeft > 0) {
          bullet.piercesLeft--;
        } else {
          bullet.deactivate();
        }
      }
    );

    // 2. Player Bullets vs Boss
    this.scene.physics.add.overlap(
      playerBullets,
      bossGroup,
      (bulletObj, bossObj) => {
        const bullet = (bulletObj instanceof Bullet ? bulletObj : bossObj instanceof Bullet ? bossObj : null) as Bullet | null;
        const b = (bossObj instanceof Boss ? bossObj : bulletObj instanceof Boss ? bulletObj : null) as Boss | null;
        if (!bullet || !b || !bullet.active || !b.active) return;

        this.emitHitSparks(bullet.x, bullet.y, 0xFF2E63);

        const killed = b.takeDamage(bullet.damage);
        if (killed) {
          this.emitExplosion(b.x, b.y);
          const { pointsGained } = this.scoreSystem.registerBossDefeated(5000, 25);
          this.showFloatingText(b.x, b.y, `BOSS DEFEATED!\n+${pointsGained}`, '#ffd700', 26);
          if (this.onBossDefeatedCallback) {
            this.onBossDefeatedCallback();
          }
        }

        if (bullet.piercesLeft > 0) {
          bullet.piercesLeft--;
        } else {
          bullet.deactivate();
        }
      }
    );

    // 3. Enemy Bullets vs Player
    this.scene.physics.add.overlap(
      enemyBullets,
      player,
      (bulletObj, playerObj) => {
        const bullet = (bulletObj instanceof Bullet ? bulletObj : playerObj instanceof Bullet ? playerObj : null) as Bullet | null;
        const p = (playerObj instanceof Player ? playerObj : bulletObj instanceof Player ? bulletObj : null) as Player | null;
        if (!bullet || !p || !bullet.active || !p.active || p.isInvulnerable || p.isDead) return;

        this.emitHitSparks(bullet.x, bullet.y, 0xFF2E63);
        bullet.deactivate();
        p.takeDamage(bullet.damage);
      }
    );

    // 4. Enemy Ships vs Player (Ramming / Kamikaze)
    this.scene.physics.add.overlap(
      enemies,
      player,
      (enemyObj, playerObj) => {
        const enemy = (enemyObj instanceof Enemy ? enemyObj : playerObj instanceof Enemy ? playerObj : null) as Enemy | null;
        const p = (playerObj instanceof Player ? playerObj : enemyObj instanceof Player ? enemyObj : null) as Player | null;
        if (!enemy || !p || !enemy.active || !p.active || p.isInvulnerable || p.isDead) return;

        this.emitExplosion(enemy.x, enemy.y);
        const ramDamage = enemy.enemyType === 'KAMIKAZE' ? 45 : 30;
        enemy.die(powerUps);
        p.takeDamage(ramDamage);
      }
    );

    // 5. Boss vs Player (Ramming)
    this.scene.physics.add.overlap(
      bossGroup,
      player,
      (bossObj, playerObj) => {
        const b = (bossObj instanceof Boss ? bossObj : playerObj instanceof Boss ? playerObj : null) as Boss | null;
        const p = (playerObj instanceof Player ? playerObj : bossObj instanceof Player ? bossObj : null) as Player | null;
        if (!b || !p || !b.active || !p.active || p.isInvulnerable || p.isDead) return;

        p.takeDamage(50);
      }
    );

    // 6. PowerUps vs Player (Collect PowerUp)
    this.scene.physics.add.overlap(
      powerUps,
      player,
      (objA, objB) => {
        const p = (objA instanceof Player ? objA : objB instanceof Player ? objB : null) as Player | null;
        const pu = (objA instanceof PowerUp ? objA : objB instanceof PowerUp ? objB : null) as PowerUp | null;
        if (!p || !pu || !pu.active || !p.active || p.isDead) return;

        // Apply powerup on player
        p.applyPowerUp(pu.powerUpType);
        this.emitHitSparks(pu.x, pu.y, 0x00F2FF);

        const typeName = pu.powerUpType.replace('_', ' ');
        this.showFloatingText(p.x, p.y - 20, `+${typeName}`, '#00F2FF', 16);

        if (pu.powerUpType === 'COIN_MULTIPLIER') {
          this.scoreSystem.coinMultiplierActive = true;
          this.scene.time.delayedCall(15000, () => {
            this.scoreSystem.coinMultiplierActive = false;
          });
        }

        pu.deactivate();
      }
    );
  }

  public showFloatingText(x: number, y: number, text: string, color: string = '#ffffff', fontSize: number = 20): void {
    const floatText = this.scene.add.text(x, y, text, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${fontSize}px`,
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 900,
      ease: 'Power1',
      onComplete: () => {
        floatText.destroy();
      },
    });
  }
}
