import Phaser from 'phaser';
import { Bullet } from '../entities/Bullet';
import { AudioManager } from './AudioManager';
import type { WeaponType } from '../config';

export class WeaponSystem {
  public scene: Phaser.Scene;
  public bulletGroup: Phaser.Physics.Arcade.Group;
  public currentWeapon: WeaponType = 'NORMAL';
  public weaponTier: number = 1; // 1 to 5
  public maxWeaponTier: number = 5;

  public baseFireIntervalMs: number = 220;
  public lastFireTime: number = 0;
  public rapidFireActive: boolean = false;
  public doubleDamageActive: boolean = false;
  public tripleShotActive: boolean = false;

  constructor(scene: Phaser.Scene, bulletGroup: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.bulletGroup = bulletGroup;
  }

  public getFireInterval(): number {
    let interval = this.baseFireIntervalMs;
    if (this.rapidFireActive) {
      interval *= 0.55;
    }
    // As weapon tier rises, slightly increase rate of fire
    interval -= (this.weaponTier - 1) * 12;
    return Math.max(90, interval);
  }

  public upgradeWeapon(): void {
    if (this.weaponTier < this.maxWeaponTier) {
      this.weaponTier++;
      this.syncWeaponTypeFromTier();
    }
  }

  public setWeaponTier(tier: number): void {
    this.weaponTier = Phaser.Math.Clamp(tier, 1, this.maxWeaponTier);
    this.syncWeaponTypeFromTier();
  }

  private syncWeaponTypeFromTier(): void {
    switch (this.weaponTier) {
      case 1:
        this.currentWeapon = 'NORMAL';
        break;
      case 2:
        this.currentWeapon = 'DOUBLE';
        break;
      case 3:
        this.currentWeapon = 'TRIPLE';
        break;
      case 4:
        this.currentWeapon = 'MISSILE';
        break;
      case 5:
        this.currentWeapon = 'PLASMA';
        break;
      default:
        this.currentWeapon = 'NORMAL';
    }
  }

  public canFire(currentTime: number): boolean {
    return currentTime - this.lastFireTime >= this.getFireInterval();
  }

  public fire(
    playerX: number,
    playerY: number,
    enemiesGroup?: Phaser.Physics.Arcade.Group | Phaser.Physics.Arcade.Group[]
  ): boolean {
    const now = this.scene.time.now;
    if (!this.canFire(now)) return false;

    this.lastFireTime = now;
    const audio = AudioManager.getInstance();
    const dmgMultiplier = this.doubleDamageActive ? 2.0 : 1.0;
    const bulletSpeed = -680;

    const spawnBullet = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      type: WeaponType,
      target: Phaser.Physics.Arcade.Sprite | null = null
    ) => {
      let b = this.bulletGroup.getFirstDead(false) as Bullet | null;
      if (!b) {
        b = new Bullet(this.scene, x, y);
        this.bulletGroup.add(b, true);
      }
      b.fire(x, y, vx, vy, type, true, dmgMultiplier, target);
    };

    // Calculate nearest enemy for homing missile
    const findNearestEnemy = (): Phaser.Physics.Arcade.Sprite | null => {
      if (!enemiesGroup) return null;
      let nearest: Phaser.Physics.Arcade.Sprite | null = null;
      let minDist = Infinity;

      const checkGroup = (grp: Phaser.Physics.Arcade.Group) => {
        grp.getChildren().forEach((child) => {
          const sprite = child as Phaser.Physics.Arcade.Sprite;
          if (sprite.active && sprite.visible && sprite.y > 0) {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, sprite.x, sprite.y);
            if (dist < minDist) {
              minDist = dist;
              nearest = sprite;
            }
          }
        });
      };

      if (Array.isArray(enemiesGroup)) {
        enemiesGroup.forEach(checkGroup);
      } else {
        checkGroup(enemiesGroup);
      }
      return nearest;
    };

    const effectiveTier = this.tripleShotActive ? Math.max(3, this.weaponTier) : this.weaponTier;

    switch (effectiveTier) {
      case 1:
        // Single central laser
        spawnBullet(playerX, playerY - 24, 0, bulletSpeed, 'NORMAL');
        audio.playLaser('NORMAL');
        break;

      case 2:
        // Twin lasers from wings
        spawnBullet(playerX - 16, playerY - 18, 0, bulletSpeed, 'DOUBLE');
        spawnBullet(playerX + 16, playerY - 18, 0, bulletSpeed, 'DOUBLE');
        audio.playLaser('DOUBLE');
        break;

      case 3:
        // 3-way spread lasers
        spawnBullet(playerX, playerY - 26, 0, bulletSpeed, 'TRIPLE');
        spawnBullet(playerX - 18, playerY - 16, -120, bulletSpeed * 0.96, 'TRIPLE');
        spawnBullet(playerX + 18, playerY - 16, 120, bulletSpeed * 0.96, 'TRIPLE');
        audio.playLaser('TRIPLE');
        break;

      case 4: {
        // Double laser + Homing Missile salvo
        spawnBullet(playerX - 16, playerY - 20, 0, bulletSpeed, 'DOUBLE');
        spawnBullet(playerX + 16, playerY - 20, 0, bulletSpeed, 'DOUBLE');
        const target = findNearestEnemy();
        spawnBullet(playerX - 28, playerY - 10, -80, -320, 'MISSILE', target);
        spawnBullet(playerX + 28, playerY - 10, 80, -320, 'MISSILE', target);
        audio.playLaser('MISSILE');
        break;
      }

      case 5:
      default: {
        // High-energy Plasma Cannon + Twin heavy spread
        spawnBullet(playerX, playerY - 28, 0, bulletSpeed * 0.9, 'PLASMA');
        spawnBullet(playerX - 22, playerY - 16, -160, bulletSpeed * 0.95, 'TRIPLE');
        spawnBullet(playerX + 22, playerY - 16, 160, bulletSpeed * 0.95, 'TRIPLE');
        const target = findNearestEnemy();
        if (target) {
          spawnBullet(playerX, playerY - 12, 0, -300, 'MISSILE', target);
        }
        audio.playLaser('PLASMA');
        break;
      }
    }

    return true;
  }
}
