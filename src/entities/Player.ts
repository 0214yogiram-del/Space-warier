import Phaser from 'phaser';
import { WeaponSystem } from '../systems/WeaponSystem';
import { AudioManager } from '../systems/AudioManager';
import type { PowerUpType } from '../config';

export interface ActiveBuff {
  type: PowerUpType;
  remainingMs: number;
  durationMs: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public maxHealth: number = 100;
  public health: number = 100;
  public maxShield: number = 100;
  public shield: number = 50;
  public maxEnergy: number = 100;
  public energy: number = 100;

  public moveSpeed: number = 380;
  public isInvulnerable: boolean = false;
  public invulnerableTimer: number = 0;
  public isDead: boolean = false;

  public weaponSystem: WeaponSystem;
  public shieldSprite: Phaser.GameObjects.Sprite | null = null;
  public thrusterEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  public activeBuffs: Map<PowerUpType, ActiveBuff> = new Map();

  // Desktop input keys
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private wasdKeys: { [key: string]: Phaser.Input.Keyboard.Key } = {};
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;

  // Touch / Mobile dragging state
  public isDragging: boolean = false;
  public targetX: number = 270;
  public targetY: number = 800;

  constructor(scene: Phaser.Scene, x: number, y: number, bulletGroup: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'player');
    this.targetX = x;
    this.targetY = y;
    this.weaponSystem = new WeaponSystem(scene, bulletGroup);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setSize(48, 54);
      this.body.setOffset(8, 5);
      this.setCollideWorldBounds(true);
    }

    this.setupVisuals();
    this.setupKeyboard();
  }

  private setupVisuals(): void {
    // Shield aura
    this.shieldSprite = this.scene.add.sprite(this.x, this.y, 'player_shield');
    this.shieldSprite.setAlpha(0.6);
    this.shieldSprite.setScale(1.15);
    this.shieldSprite.setVisible(this.shield > 0);

    // Particle thrusters
    const particles = this.scene.add.particles(0, 0, 'particle_spark', {
      speed: { min: 60, max: 160 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 220,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x00f0ff,
    });
    this.thrusterEmitter = particles;
  }

  private setupKeyboard(): void {
    if (!this.scene.input.keyboard) return;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasdKeys = {
      W: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  public applyPowerUp(type: PowerUpType): void {
    const audio = AudioManager.getInstance();
    audio.playPowerUp();

    switch (type) {
      case 'HEALTH':
        this.health = Math.min(this.maxHealth, this.health + 40);
        break;

      case 'SHIELD':
        this.shield = Math.min(this.maxShield, this.shield + 50);
        if (this.shieldSprite) this.shieldSprite.setVisible(true);
        break;

      case 'RAPID_FIRE':
        this.activeBuffs.set('RAPID_FIRE', { type, remainingMs: 12000, durationMs: 12000 });
        this.weaponSystem.rapidFireActive = true;
        break;

      case 'DOUBLE_DAMAGE':
        this.activeBuffs.set('DOUBLE_DAMAGE', { type, remainingMs: 12000, durationMs: 12000 });
        this.weaponSystem.doubleDamageActive = true;
        break;

      case 'TRIPLE_SHOT':
        this.activeBuffs.set('TRIPLE_SHOT', { type, remainingMs: 12000, durationMs: 12000 });
        this.weaponSystem.tripleShotActive = true;
        break;

      case 'COIN_MULTIPLIER':
        this.activeBuffs.set('COIN_MULTIPLIER', { type, remainingMs: 15000, durationMs: 15000 });
        break;
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isInvulnerable || this.isDead) return false;

    const audio = AudioManager.getInstance();

    if (this.shield > 0) {
      audio.playShieldDeflect();
      if (this.shield >= amount) {
        this.shield -= amount;
      } else {
        const remaining = amount - this.shield;
        this.shield = 0;
        this.health -= remaining;
      }
    } else {
      audio.playHit();
      this.health -= amount;
    }

    if (this.shield <= 0 && this.shieldSprite) {
      this.shieldSprite.setVisible(false);
    }

    // Invulnerability window
    this.isInvulnerable = true;
    this.invulnerableTimer = 1000; // 1 second i-frames
    this.scene.cameras.main.shake(180, 0.015);

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }

    return false;
  }

  public die(): void {
    if (this.isDead) return;
    this.isDead = true;
    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.stop();
    if (this.shieldSprite) this.shieldSprite.setVisible(false);
    if (this.thrusterEmitter) this.thrusterEmitter.stop();

    AudioManager.getInstance().playExplosion('boss');
    AudioManager.getInstance().playGameOver();
  }

  public update(time: number, delta: number, enemiesGroup?: Phaser.Physics.Arcade.Group): void {
    if (this.isDead) return;

    const dt = delta / 1000;

    // Energy slow recharge
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 15 * dt);
    }

    // Shield gradual recharge if undamaged for a while
    if (this.shield < this.maxShield && !this.isInvulnerable) {
      this.shield = Math.min(this.maxShield, this.shield + 4 * dt);
      if (this.shieldSprite && this.shield > 0) {
        this.shieldSprite.setVisible(true);
      }
    }

    // Handle Buff timers
    this.activeBuffs.forEach((buff, type) => {
      buff.remainingMs -= delta;
      if (buff.remainingMs <= 0) {
        this.activeBuffs.delete(type);
        if (type === 'RAPID_FIRE') this.weaponSystem.rapidFireActive = false;
        if (type === 'DOUBLE_DAMAGE') this.weaponSystem.doubleDamageActive = false;
        if (type === 'TRIPLE_SHOT') this.weaponSystem.tripleShotActive = false;
      }
    });

    // Handle Invulnerability Flash
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      const flash = Math.sin(time * 0.03) > 0;
      this.setAlpha(flash ? 0.9 : 0.2);
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.setAlpha(1.0);
      }
    }

    // Handle Movement (Keyboard & Touch)
    let moveX = 0;
    let moveY = 0;

    // Keyboard
    if (this.cursors && this.wasdKeys) {
      if (this.cursors.left?.isDown || this.wasdKeys.A?.isDown) moveX -= 1;
      if (this.cursors.right?.isDown || this.wasdKeys.D?.isDown) moveX += 1;
      if (this.cursors.up?.isDown || this.wasdKeys.W?.isDown) moveY -= 1;
      if (this.cursors.down?.isDown || this.wasdKeys.S?.isDown) moveY += 1;
    }

    if (this.body) {
      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        this.setVelocity(
          (moveX / len) * this.moveSpeed,
          (moveY / len) * this.moveSpeed
        );
        this.targetX = this.x;
        this.targetY = this.y;
      } else if (this.isDragging) {
        // Touch drag interpolation
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          const speed = Math.min(dist * 12, this.moveSpeed * 1.5);
          this.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        } else {
          this.setVelocity(0, 0);
        }
      } else {
        this.setVelocity(0, 0);
      }
    }

    // Wing tilt animation
    if (this.body) {
      const vx = this.body.velocity.x;
      if (vx < -30) {
        this.setRotation(-0.14);
      } else if (vx > 30) {
        this.setRotation(0.14);
      } else {
        this.setRotation(0);
      }
    }

    // Update shield sprite position
    if (this.shieldSprite && this.shieldSprite.visible) {
      this.shieldSprite.setPosition(this.x, this.y);
      this.shieldSprite.setRotation(time * 0.002);
    }

    // Update thruster emitter position
    if (this.thrusterEmitter) {
      this.thrusterEmitter.setPosition(this.x, this.y + 26);
    }

    // Auto-fire or space bar fire
    const isSpaceFiring = this.spaceKey ? this.spaceKey.isDown : false;
    // By default in modern mobile arcade shooters, auto-firing on screen touch/active gameplay gives the smoothest feel
    const shouldFire = isSpaceFiring || this.isDragging || true;

    if (shouldFire) {
      this.weaponSystem.fire(this.x, this.y, enemiesGroup);
    }
  }

  public respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.targetX = x;
    this.targetY = y;
    this.health = this.maxHealth;
    this.shield = 50;
    this.energy = this.maxEnergy;
    this.isDead = false;
    this.isInvulnerable = true;
    this.invulnerableTimer = 2000;
    this.setActive(true);
    this.setVisible(true);
    if (this.body) this.body.reset(x, y);
    if (this.shieldSprite) this.shieldSprite.setVisible(true);
    if (this.thrusterEmitter) this.thrusterEmitter.start();
  }
}
