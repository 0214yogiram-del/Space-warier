import Phaser from 'phaser';
import type { PowerUpType } from '../config';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  public powerUpType: PowerUpType = 'HEALTH';
  public spawnTime: number = 0;
  public lifespan: number = 12000; // 12 seconds on screen
  public floatOffset: number = 0;
  public magnetRange: number = 140;
  public magnetSpeed: number = 360;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup_health');
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public spawn(x: number, y: number, type: PowerUpType): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.powerUpType = type;
    this.spawnTime = this.scene.time.now;
    this.floatOffset = Math.random() * Math.PI * 2;
    this.setAlpha(1.0);

    switch (type) {
      case 'HEALTH':
        this.setTexture('powerup_health');
        break;
      case 'SHIELD':
        this.setTexture('powerup_shield');
        break;
      case 'RAPID_FIRE':
        this.setTexture('powerup_rapid');
        break;
      case 'DOUBLE_DAMAGE':
        this.setTexture('powerup_double_damage');
        break;
      case 'TRIPLE_SHOT':
        this.setTexture('powerup_triple');
        break;
      case 'COIN_MULTIPLIER':
        this.setTexture('powerup_coin');
        break;
      default:
        this.setTexture('powerup_health');
        break;
    }

    if (this.body) {
      this.body.reset(x, y);
      // Gentle downward drift with slight horizontal sway
      this.setVelocity((Math.random() - 0.5) * 40, 80 + Math.random() * 30);
    }
  }

  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const age = time - this.spawnTime;
    if (age > this.lifespan) {
      this.deactivate();
      return;
    }

    // Blinking effect when close to expiring
    if (age > this.lifespan - 3000) {
      const flash = Math.sin(time * 0.02) > 0;
      this.setAlpha(flash ? 0.9 : 0.3);
    } else {
      this.setAlpha(1.0);
    }

    // Floating wobble
    this.setRotation(Math.sin(time * 0.003 + this.floatOffset) * 0.15);

    // Screen bound check
    if (this.y > 1000) {
      this.deactivate();
    }
  }

  public attractTowards(targetX: number, targetY: number): void {
    if (!this.active || !this.body) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    if (dist < this.magnetRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(
        Math.cos(angle) * this.magnetSpeed,
        Math.sin(angle) * this.magnetSpeed
      );
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.stop();
    }
  }
}
