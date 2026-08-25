import Phaser from 'phaser';
import { Bullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { AudioManager } from '../systems/AudioManager';
import type { EnemyType, PowerUpType } from '../config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyType: EnemyType = 'BASIC';
  public maxHealth: number = 30;
  public health: number = 30;
  public scoreValue: number = 100;
  public coinValue: number = 1;
  public fireIntervalMs: number = 2000;
  public lastFireTime: number = 0;
  public spawnTime: number = 0;
  public startX: number = 0;
  public movementPhase: number = 0;
  public speedMultiplier: number = 1.0;

  // Kamikaze target lock
  public isLockedOn: boolean = false;
  public lockAngle: number = 0;

  // Custom health bar graphics
  private hpBar: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_basic');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hpBar = scene.add.graphics();
  }

  public spawn(
    x: number,
    y: number,
    type: EnemyType,
    hpMultiplier: number = 1.0,
    speedMultiplier: number = 1.0
  ): void {
    this.setPosition(x, y);
    this.startX = x;
    this.setActive(true);
    this.setVisible(true);
    this.enemyType = type;
    this.spawnTime = this.scene.time.now;
    this.movementPhase = Math.random() * Math.PI * 2;
    this.speedMultiplier = speedMultiplier;
    this.isLockedOn = false;
    this.setAlpha(1.0);
    this.setRotation(0);

    let initialVx = 0;
    let initialVy = 130 * speedMultiplier;

    switch (type) {
      case 'FAST':
        this.setTexture('enemy_fast');
        this.maxHealth = Math.round(20 * hpMultiplier);
        this.scoreValue = 150;
        this.coinValue = 2;
        this.fireIntervalMs = 0; // Does not shoot, high speed dive
        initialVy = 240 * speedMultiplier;
        break;

      case 'TANK':
        this.setTexture('enemy_tank');
        this.maxHealth = Math.round(180 * hpMultiplier);
        this.scoreValue = 350;
        this.coinValue = 5;
        this.fireIntervalMs = 1800;
        initialVy = 60 * speedMultiplier;
        break;

      case 'SHOOTER':
        this.setTexture('enemy_shooter');
        this.maxHealth = Math.round(55 * hpMultiplier);
        this.scoreValue = 220;
        this.coinValue = 3;
        this.fireIntervalMs = 1500;
        initialVy = 110 * speedMultiplier;
        break;

      case 'KAMIKAZE':
        this.setTexture('enemy_kamikaze');
        this.maxHealth = Math.round(35 * hpMultiplier);
        this.scoreValue = 200;
        this.coinValue = 2;
        this.fireIntervalMs = 0;
        initialVy = 140 * speedMultiplier;
        break;

      case 'BASIC':
      default:
        this.setTexture('enemy_basic');
        this.maxHealth = Math.round(35 * hpMultiplier);
        this.scoreValue = 100;
        this.coinValue = 1;
        this.fireIntervalMs = 2400;
        initialVy = 130 * speedMultiplier;
        break;
    }

    if (this.body) {
      this.body.reset(x, y);
      this.body.setSize(this.width * 0.8, this.height * 0.8);
      this.setVelocity(initialVx, initialVy);
    }

    this.health = this.maxHealth;
    this.lastFireTime = this.spawnTime + Math.random() * 1000;
  }

  public takeDamage(
    amount: number,
    enemyBulletGroup: Phaser.Physics.Arcade.Group,
    powerUpGroup: Phaser.Physics.Arcade.Group
  ): boolean {
    if (!this.active) return false;

    this.health -= amount;
    // Flash white on hit
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });

    if (this.health <= 0) {
      this.die(powerUpGroup);
      return true;
    }
    return false;
  }

  public die(powerUpGroup?: Phaser.Physics.Arcade.Group): void {
    if (!this.active) return;

    const audio = AudioManager.getInstance();
    audio.playExplosion(this.enemyType === 'TANK' ? 'medium' : 'small');

    // Chance to spawn power-up or coins
    if (powerUpGroup) {
      this.tryDropLoot(powerUpGroup);
    }

    this.deactivate();
  }

  private tryDropLoot(powerUpGroup: Phaser.Physics.Arcade.Group): void {
    const roll = Math.random();
    let typeToDrop: PowerUpType | null = null;

    if (roll < 0.08) {
      typeToDrop = 'HEALTH';
    } else if (roll < 0.15) {
      typeToDrop = 'SHIELD';
    } else if (roll < 0.22) {
      typeToDrop = 'RAPID_FIRE';
    } else if (roll < 0.28) {
      typeToDrop = 'DOUBLE_DAMAGE';
    } else if (roll < 0.34) {
      typeToDrop = 'TRIPLE_SHOT';
    } else if (roll < 0.44) {
      typeToDrop = 'COIN_MULTIPLIER';
    }

    if (typeToDrop) {
      let pu = powerUpGroup.getFirstDead(false) as PowerUp | null;
      if (!pu) {
        pu = new PowerUp(this.scene, this.x, this.y);
        powerUpGroup.add(pu, true);
      }
      pu.spawn(this.x, this.y, typeToDrop);
    }
  }

  public updateEnemy(
    time: number,
    delta: number,
    player: Phaser.Physics.Arcade.Sprite | null,
    enemyBulletGroup: Phaser.Physics.Arcade.Group
  ): void {
    if (!this.active || !this.body) return;

    const age = (time - this.spawnTime) / 1000;

    // Movement behavior per enemy type
    switch (this.enemyType) {
      case 'BASIC': {
        // Sine wave horizontal motion
        const sway = Math.sin(age * 3 + this.movementPhase) * 110;
        this.setVelocityX(sway);
        break;
      }

      case 'FAST': {
        // High speed zigzag
        const sharpSway = Math.cos(age * 5 + this.movementPhase) * 180;
        this.setVelocityX(sharpSway);
        break;
      }

      case 'TANK': {
        // Slow advance, pausing occasionally to fire
        const pauseCycle = Math.sin(age * 1.5);
        this.setVelocityY(pauseCycle > 0.4 ? 20 : 70 * this.speedMultiplier);
        this.setVelocityX(Math.sin(age * 0.8) * 40);
        break;
      }

      case 'SHOOTER': {
        // Enters to y=180-300 then hovers horizontally
        if (this.y < 240) {
          this.setVelocityY(120 * this.speedMultiplier);
        } else {
          this.setVelocityY(20);
          this.setVelocityX(Math.sin(age * 2) * 140);
        }
        break;
      }

      case 'KAMIKAZE': {
        // Locks on and dives with accelerating speed
        if (!this.isLockedOn && player && player.active) {
          if (this.y > 100 || age > 0.8) {
            this.isLockedOn = true;
            this.lockAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            this.setRotation(this.lockAngle - Math.PI / 2);
          }
        }

        if (this.isLockedOn) {
          const diveSpeed = 380 * this.speedMultiplier;
          this.setVelocity(
            Math.cos(this.lockAngle) * diveSpeed,
            Math.sin(this.lockAngle) * diveSpeed
          );
          // Red flashing when diving
          const flash = Math.sin(time * 0.03) > 0;
          this.setTint(flash ? 0xff0000 : 0xffffff);
        }
        break;
      }
    }

    // Firing behavior
    if (this.fireIntervalMs > 0 && time - this.lastFireTime > this.fireIntervalMs && this.y > 40 && this.y < 800) {
      this.lastFireTime = time;
      this.fireBullet(player, enemyBulletGroup);
    }

    // Render Health Bar for Tank/Shooter
    this.renderHpBar();

    // Out of bounds check
    if (this.y > 1020 || this.x < -100 || this.x > 640) {
      this.deactivate();
    }
  }

  private fireBullet(
    player: Phaser.Physics.Arcade.Sprite | null,
    enemyBulletGroup: Phaser.Physics.Arcade.Group
  ): void {
    if (!this.active || !enemyBulletGroup) return;

    const spawnEnemyBullet = (x: number, y: number, vx: number, vy: number, type: 'ENEMY_NORMAL' | 'ENEMY_AIMED') => {
      let b = enemyBulletGroup.getFirstDead(false) as Bullet | null;
      if (!b) {
        b = new Bullet(this.scene, x, y);
        enemyBulletGroup.add(b, true);
      }
      b.fire(x, y, vx, vy, type, false);
    };

    if (this.enemyType === 'TANK') {
      // Dual cannon burst
      spawnEnemyBullet(this.x - 18, this.y + 24, -30, 280, 'ENEMY_NORMAL');
      spawnEnemyBullet(this.x + 18, this.y + 24, 30, 280, 'ENEMY_NORMAL');
      AudioManager.getInstance().playLaser('ENEMY');
    } else if (this.enemyType === 'SHOOTER' && player && player.active) {
      // Aimed laser at player
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      const speed = 320;
      spawnEnemyBullet(
        this.x,
        this.y + 20,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        'ENEMY_AIMED'
      );
      AudioManager.getInstance().playLaser('ENEMY');
    } else {
      // Basic forward shot
      spawnEnemyBullet(this.x, this.y + 16, 0, 250, 'ENEMY_NORMAL');
      AudioManager.getInstance().playLaser('ENEMY');
    }
  }

  private renderHpBar(): void {
    if (!this.hpBar) return;
    this.hpBar.clear();

    if (this.active && (this.enemyType === 'TANK' || this.enemyType === 'SHOOTER') && this.health < this.maxHealth) {
      const barW = 36;
      const barH = 4;
      const x = this.x - barW / 2;
      const y = this.y - this.height / 2 - 8;

      this.hpBar.fillStyle(0x330000, 0.8);
      this.hpBar.fillRect(x, y, barW, barH);

      const pct = Math.max(0, this.health / this.maxHealth);
      this.hpBar.fillStyle(0x00ff88, 0.9);
      this.hpBar.fillRect(x, y, barW * pct, barH);
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.hpBar) this.hpBar.clear();
    if (this.body) this.body.stop();
  }

  public destroy(fromScene?: boolean): void {
    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
    super.destroy(fromScene);
  }
}
