import Phaser from 'phaser';
import { Bullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { AudioManager } from '../systems/AudioManager';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public maxHealth: number = 2000;
  public health: number = 2000;
  public bossName: string = 'TITAN DREADNOUGHT';
  public isEnraged: boolean = false;
  public attackPattern: number = 0;
  public attackTimer: number = 0;
  public attackIntervalMs: number = 1800;
  public minionSpawnTimer: number = 0;
  public spawnTime: number = 0;

  // Visual sub-elements
  private coreGlow: Phaser.GameObjects.Sprite | null = null;
  private entranceDone: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss_1');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.coreGlow = scene.add.sprite(x, y, 'particle_plasma');
    this.coreGlow.setScale(1.6);
    this.coreGlow.setAlpha(0.7);
    this.coreGlow.setTint(0xff0055);
  }

  public initBoss(x: number, y: number, name: string, hp: number): void {
    this.setPosition(x, -120);
    this.setActive(true);
    this.setVisible(true);
    this.bossName = name;
    this.maxHealth = hp;
    this.health = hp;
    this.isEnraged = false;
    this.entranceDone = false;
    this.spawnTime = this.scene.time.now;
    this.attackPattern = 0;
    this.attackIntervalMs = 1800;
    this.setAlpha(1.0);
    this.clearTint();

    if (this.body) {
      this.body.setSize(180, 140);
      this.body.reset(x, -120);
    }

    // Boss entrance tween
    this.scene.tweens.add({
      targets: this,
      y: 180,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => {
        this.entranceDone = true;
      },
    });

    AudioManager.getInstance().playBossWarning();
    AudioManager.getInstance().setBossMusic(true);
  }

  public takeDamage(amount: number): boolean {
    if (!this.active) return false;

    this.health -= amount;

    // Check enrage threshold
    if (!this.isEnraged && this.health <= this.maxHealth * 0.35) {
      this.isEnraged = true;
      this.attackIntervalMs = 1100;
      this.setTint(0xff3333);
      if (this.coreGlow) this.coreGlow.setTint(0xff0000);
      this.scene.cameras.main.shake(300, 0.02);
      AudioManager.getInstance().playBossWarning();
    }

    // Flash on hit
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) {
        if (this.isEnraged) {
          this.setTint(0xff3333);
        } else {
          this.clearTint();
        }
      }
    });

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }

    return false;
  }

  public die(): void {
    if (!this.active) return;
    this.setActive(false);

    const audio = AudioManager.getInstance();
    audio.playExplosion('boss');
    audio.setBossMusic(false);

    // Multi explosion cascade animation
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 180, () => {
        const ox = this.x + (Math.random() - 0.5) * 140;
        const oy = this.y + (Math.random() - 0.5) * 100;
        audio.playExplosion(i === 7 ? 'boss' : 'medium');
        this.scene.cameras.main.shake(200, 0.02);
      });
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1600,
      onComplete: () => {
        this.setVisible(false);
        if (this.coreGlow) this.coreGlow.setVisible(false);
      },
    });
  }

  public updateBoss(
    time: number,
    delta: number,
    player: Phaser.Physics.Arcade.Sprite | null,
    enemyBulletGroup: Phaser.Physics.Arcade.Group,
    spawnMinionCallback?: () => void
  ): void {
    if (!this.active || !this.entranceDone) return;

    const age = (time - this.spawnTime) / 1000;
    const speed = this.isEnraged ? 140 : 90;

    // Figure-8 / floating patrol motion
    const targetX = 270 + Math.sin(age * 1.2) * 160;
    const targetY = 180 + Math.cos(age * 2.2) * 45;

    this.x = Phaser.Math.Linear(this.x, targetX, 0.05);
    this.y = Phaser.Math.Linear(this.y, targetY, 0.05);

    if (this.coreGlow) {
      this.coreGlow.setPosition(this.x, this.y + 10);
      this.coreGlow.setRotation(time * 0.004);
      this.coreGlow.setAlpha(0.6 + Math.sin(time * 0.01) * 0.3);
    }

    // Attack execution loop
    if (time - this.attackTimer > this.attackIntervalMs) {
      this.attackTimer = time;
      this.executeNextAttack(player, enemyBulletGroup);
      this.attackPattern = (this.attackPattern + 1) % 4;
    }

    // Minion summon loop
    if (time - this.minionSpawnTimer > (this.isEnraged ? 4500 : 7000)) {
      this.minionSpawnTimer = time;
      if (spawnMinionCallback) spawnMinionCallback();
    }
  }

  private executeNextAttack(
    player: Phaser.Physics.Arcade.Sprite | null,
    enemyBulletGroup: Phaser.Physics.Arcade.Group
  ): void {
    const audio = AudioManager.getInstance();

    const spawnBullet = (x: number, y: number, vx: number, vy: number, type: 'BOSS_HEAVY' | 'BOSS_RING' | 'ENEMY_AIMED') => {
      let b = enemyBulletGroup.getFirstDead(false) as Bullet | null;
      if (!b) {
        b = new Bullet(this.scene, x, y);
        enemyBulletGroup.add(b, true);
      }
      b.fire(x, y, vx, vy, type, false);
    };

    switch (this.attackPattern) {
      case 0: {
        // Heavy 5-way spread
        const angles = [-40, -20, 0, 20, 40];
        angles.forEach((deg) => {
          const rad = Phaser.Math.DegToRad(deg + 90);
          const spd = this.isEnraged ? 360 : 280;
          spawnBullet(this.x, this.y + 40, Math.cos(rad) * spd, Math.sin(rad) * spd, 'BOSS_HEAVY');
        });
        audio.playLaser('PLASMA');
        break;
      }

      case 1: {
        // Circular ring burst (12 bullets)
        const count = this.isEnraged ? 16 : 12;
        for (let i = 0; i < count; i++) {
          const rad = (i / count) * Math.PI * 2;
          const spd = 220;
          spawnBullet(this.x, this.y + 20, Math.cos(rad) * spd, Math.sin(rad) * spd, 'BOSS_RING');
        }
        audio.playLaser('ENEMY');
        break;
      }

      case 2: {
        // Targeted rapid salvo at player
        if (player && player.active) {
          for (let i = 0; i < 4; i++) {
            this.scene.time.delayedCall(i * 120, () => {
              if (this.active && player && player.active) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                const spd = 380;
                spawnBullet(
                  this.x + (i % 2 === 0 ? -30 : 30),
                  this.y + 30,
                  Math.cos(angle) * spd,
                  Math.sin(angle) * spd,
                  'ENEMY_AIMED'
                );
                audio.playLaser('NORMAL');
              }
            });
          }
        }
        break;
      }

      case 3:
      default: {
        // Dual heavy plasma orbs from wings
        spawnBullet(this.x - 60, this.y + 30, -50, 320, 'BOSS_HEAVY');
        spawnBullet(this.x + 60, this.y + 30, 50, 320, 'BOSS_HEAVY');
        audio.playLaser('PLASMA');
        break;
      }
    }
  }

  public destroy(fromScene?: boolean): void {
    if (this.coreGlow) {
      this.coreGlow.destroy();
      this.coreGlow = null;
    }
    super.destroy(fromScene);
  }
}
