import Phaser from 'phaser';
import type { WeaponType } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 25;
  public isPlayerBullet: boolean = true;
  public bulletType: WeaponType | 'ENEMY_NORMAL' | 'ENEMY_AIMED' | 'BOSS_HEAVY' | 'BOSS_RING' = 'NORMAL';
  public homingTarget: Phaser.Physics.Arcade.Sprite | null = null;
  public homingSpeed: number = 420;
  public lifespan: number = 2000;
  public bornTime: number = 0;
  public piercesLeft: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet_laser');
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: WeaponType | 'ENEMY_NORMAL' | 'ENEMY_AIMED' | 'BOSS_HEAVY' | 'BOSS_RING' = 'NORMAL',
    isPlayer: boolean = true,
    dmgMultiplier: number = 1.0,
    target: Phaser.Physics.Arcade.Sprite | null = null
  ): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.isPlayerBullet = isPlayer;
    this.bulletType = type;
    this.bornTime = this.scene.time.now;
    this.homingTarget = target;
    this.piercesLeft = 0;

    // Set visual texture and dimensions according to bullet type
    switch (type) {
      case 'DOUBLE':
        this.setTexture('bullet_double');
        this.damage = Math.round(30 * dmgMultiplier);
        break;

      case 'TRIPLE':
        this.setTexture('bullet_triple');
        this.damage = Math.round(32 * dmgMultiplier);
        break;

      case 'MISSILE':
        this.setTexture('bullet_missile');
        this.damage = Math.round(95 * dmgMultiplier);
        this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
        break;

      case 'PLASMA':
        this.setTexture('bullet_plasma');
        this.damage = Math.round(140 * dmgMultiplier);
        this.piercesLeft = 2; // Can pierce through multiple targets
        break;

      case 'ENEMY_NORMAL':
        this.setTexture('bullet_enemy');
        this.damage = 15;
        break;

      case 'ENEMY_AIMED':
        this.setTexture('bullet_enemy_aimed');
        this.damage = 20;
        this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
        break;

      case 'BOSS_HEAVY':
        this.setTexture('bullet_boss');
        this.damage = 35;
        break;

      case 'BOSS_RING':
        this.setTexture('bullet_enemy');
        this.damage = 18;
        break;

      case 'NORMAL':
      default:
        this.setTexture('bullet_laser');
        this.damage = Math.round(25 * dmgMultiplier);
        break;
    }

    if (this.body) {
      this.body.reset(x, y);
      this.body.setSize(this.width * 0.75, this.height * 0.85);
      this.setVelocity(vx, vy);
    }
  }

  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (time - this.bornTime > this.lifespan) {
      this.deactivate();
      return;
    }

    // Homing missile navigation logic
    if (this.bulletType === 'MISSILE' && this.homingTarget && this.homingTarget.active && this.body) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.homingTarget.x, this.homingTarget.y);
      const currentAngle = this.body.velocity.angle();
      const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.08);

      const vx = Math.cos(newAngle) * this.homingSpeed;
      const vy = Math.sin(newAngle) * this.homingSpeed;
      this.setVelocity(vx, vy);
      this.setRotation(newAngle + Math.PI / 2);
    }

    // Check bounds
    if (
      this.y < -50 ||
      this.y > 1020 ||
      this.x < -50 ||
      this.x > 600
    ) {
      this.deactivate();
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
