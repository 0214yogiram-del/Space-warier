import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { Boss } from '../entities/Boss';
import { LevelSystem, type LevelConfig } from '../systems/LevelSystem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { AudioManager } from '../systems/AudioManager';
import { HUD } from '../ui/HUD';
import { MobileControls } from '../ui/MobileControls';
import { Menu } from '../ui/Menu';

export class GameScene extends Phaser.Scene {
  public player: Player | null = null;
  public playerBullets: Phaser.Physics.Arcade.Group | null = null;
  public enemyBullets: Phaser.Physics.Arcade.Group | null = null;
  public enemies: Phaser.Physics.Arcade.Group | null = null;
  public powerUps: Phaser.Physics.Arcade.Group | null = null;
  public bossGroup: Phaser.Physics.Arcade.Group | null = null;
  public boss: Boss | null = null;

  public levelSystem: LevelSystem | null = null;
  public enemySpawner: EnemySpawner | null = null;
  public collisionSystem: CollisionSystem | null = null;
  public scoreSystem: ScoreSystem | null = null;
  public hud: HUD | null = null;
  public mobileControls: MobileControls | null = null;

  // Parallax Starfields
  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private starfieldLayers: Phaser.GameObjects.Graphics[] = [];

  // Game state
  public isPaused: boolean = false;
  public isTransitioningLevel: boolean = false;
  private pauseModal: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    const { width, height } = this.cameras.main;

    this.isPaused = false;
    this.isTransitioningLevel = false;

    // 1. Systems Initialization
    this.scoreSystem = new ScoreSystem();
    this.scoreSystem.resetRun();

    this.levelSystem = new LevelSystem();
    this.levelSystem.reset();

    // 2. Parallax Starfield & Space Background
    this.setupDynamicBackground();

    // 3. Arcade Physics Groups
    this.playerBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 60,
      runChildUpdate: true,
    });

    this.enemyBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 80,
      runChildUpdate: true,
    });

    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: 40,
    });

    this.powerUps = this.physics.add.group({
      classType: PowerUp,
      maxSize: 20,
      runChildUpdate: true,
    });

    this.bossGroup = this.physics.add.group({
      classType: Boss,
      maxSize: 2,
    });

    // 4. Instantiate Player
    this.player = new Player(this, width / 2, 800, this.playerBullets);

    // 5. Instantiate Spawner & Collision System
    this.enemySpawner = new EnemySpawner(this, this.enemies, this.bossGroup, this.levelSystem);
    this.collisionSystem = new CollisionSystem(this, this.scoreSystem);

    // Setup collision listeners once
    this.collisionSystem.setupCollisions(
      this.player,
      this.playerBullets,
      this.enemies,
      this.enemyBullets,
      this.powerUps,
      this.bossGroup,
      () => {
        // Boss defeated callback
        this.time.delayedCall(2200, () => {
          this.advanceToNextLevel();
        });
      }
    );

    // 6. Mobile & Desktop Controls
    this.mobileControls = new MobileControls(this, this.player);

    // 7. In-Game HUD
    this.hud = new HUD(
      this,
      () => this.togglePause(),
      () => this.confirmExitGame()
    );

    // 8. Keyboard Pause and Exit listeners
    if (this.input.keyboard) {
      const pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      pKey.on('down', () => this.togglePause());
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.togglePause());
    }

    // 9. Start Level 1
    this.startCurrentLevel();
  }

  private setupDynamicBackground(): void {
    const { width, height } = this.cameras.main;

    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(-10);

    this.starfieldLayers = [];
    for (let l = 0; l < 3; l++) {
      const stars = this.add.graphics();
      stars.setDepth(-5 + l);
      stars.fillStyle(0xffffff, l === 0 ? 0.4 : l === 1 ? 0.7 : 0.9);

      for (let i = 0; i < (l === 0 ? 90 : 50); i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const r = l === 0 ? 0.8 : l === 1 ? 1.5 : 2.2;
        stars.fillCircle(x, y, r);
      }
      this.starfieldLayers.push(stars);
    }
  }

  private updateBackgroundColors(cfg: LevelConfig): void {
    if (!this.bgGraphics) return;
    const { width, height } = this.cameras.main;

    this.bgGraphics.clear();
    // Dark deep space fill
    this.bgGraphics.fillGradientStyle(
      parseInt(cfg.bgColorTop.replace('#', '0x')),
      parseInt(cfg.bgColorTop.replace('#', '0x')),
      parseInt(cfg.bgColorBottom.replace('#', '0x')),
      parseInt(cfg.bgColorBottom.replace('#', '0x')),
      1
    );
    this.bgGraphics.fillRect(0, 0, width, height);

    // Glowing nebula cloud
    this.bgGraphics.fillStyle(cfg.themeColor, 0.08);
    this.bgGraphics.fillCircle(width / 2, height / 3, 260);
    this.bgGraphics.fillCircle(width / 4, height * 0.7, 180);
  }

  public startCurrentLevel(): void {
    if (!this.levelSystem || !this.enemySpawner) return;
    const cfg = this.levelSystem.getCurrentConfig();
    this.updateBackgroundColors(cfg);
    this.enemySpawner.startLevel(cfg);
    this.isTransitioningLevel = true;

    // Show Level Start Announcement
    Menu.showLevelBanner(this, cfg.levelNumber, cfg.name, cfg.subtitle, () => {
      this.isTransitioningLevel = false;
    });

    AudioManager.getInstance().playLevelUp();
  }

  public update(time: number, delta: number): void {
    if (this.isPaused) return;

    const dt = delta / 1000;

    // 1. Starfield Parallax Scroll
    if (this.starfieldLayers.length >= 3) {
      this.starfieldLayers[0].y = (this.starfieldLayers[0].y + 25 * dt) % 960;
      this.starfieldLayers[1].y = (this.starfieldLayers[1].y + 60 * dt) % 960;
      this.starfieldLayers[2].y = (this.starfieldLayers[2].y + 110 * dt) % 960;
    }

    // 2. Score System update (combo timer)
    this.scoreSystem?.update(dt);

    // 3. Player Update
    if (this.player && this.enemies) {
      this.player.update(time, delta, this.enemies);

      // Check player death
      if (this.player.isDead) {
        this.time.delayedCall(1400, () => {
          this.triggerGameOver();
        });
        return;
      }
    }

    // 4. Update Active Enemies
    if (this.enemies && this.player && this.enemyBullets) {
      this.enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (enemy.active) {
          enemy.updateEnemy(time, delta, this.player, this.enemyBullets!);
        }
      });
    }

    // 5. Update Boss if active
    if (this.enemySpawner?.boss && this.enemySpawner.boss.active && this.enemyBullets) {
      this.boss = this.enemySpawner.boss;
      this.boss.updateBoss(time, delta, this.player, this.enemyBullets, () => {
        this.enemySpawner?.spawnBossMinion();
      });
    } else {
      this.boss = null;
    }

    // 6. Update PowerUps (magnetize toward player)
    if (this.powerUps && this.player && this.player.active) {
      this.powerUps.getChildren().forEach((child) => {
        const pu = child as PowerUp;
        if (pu.active) {
          pu.attractTowards(this.player!.x, this.player!.y);
        }
      });
    }

    // 7. Spawner update
    if (!this.isTransitioningLevel && this.enemySpawner) {
      this.enemySpawner.update(time, delta);

      // Check level cleared
      if (this.enemySpawner.levelCleared && !this.isTransitioningLevel) {
        this.advanceToNextLevel();
      }
    }

    // 8. Update In-Game HUD
    if (this.hud && this.player && this.scoreSystem && this.levelSystem) {
      this.hud.update(
        this.player,
        this.scoreSystem,
        this.levelSystem.currentLevelIndex,
        this.boss
      );
    }
  }

  private advanceToNextLevel(): void {
    if (!this.levelSystem || this.isTransitioningLevel) return;
    this.isTransitioningLevel = true;

    // Upgrade player weapon every 2 levels as a milestone reward
    if (this.player && this.levelSystem.currentLevelIndex % 2 === 0) {
      this.player.weaponSystem.upgradeWeapon();
    }

    // Grant bonus level clear score
    const clearBonus = this.levelSystem.currentLevelIndex * 1500;
    this.scoreSystem?.addScore(clearBonus);
    this.scoreSystem?.addCoins(10);

    this.time.delayedCall(1200, () => {
      this.levelSystem?.nextLevel();
      this.startCurrentLevel();
    });
  }

  public togglePause(): void {
    if (this.player?.isDead) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.pauseModal = Menu.showPauseModal(
        this,
        () => this.togglePause(), // Resume
        () => this.restartGame(), // Restart
        () => this.returnToMainMenu() // Main Menu
      );
    } else {
      this.physics.resume();
      if (this.pauseModal) {
        this.pauseModal.destroy();
        this.pauseModal = null;
      }
    }
  }

  public confirmExitGame(): void {
    if (this.player?.isDead) return;

    if (this.pauseModal) {
      this.pauseModal.destroy();
      this.pauseModal = null;
    }

    this.physics.pause();
    this.isPaused = true;
    this.pauseModal = Menu.showExitConfirmModal(
      this,
      () => {
        this.returnToMainMenu();
      },
      () => {
        this.togglePause();
      }
    );
  }

  public restartGame(): void {
    if (this.pauseModal) {
      this.pauseModal.destroy();
      this.pauseModal = null;
    }
    this.physics.resume();
    this.scene.restart();
  }

  public returnToMainMenu(): void {
    if (this.pauseModal) {
      this.pauseModal.destroy();
      this.pauseModal = null;
    }
    this.physics.resume();
    AudioManager.getInstance().stopMusic();
    this.scene.start('MenuScene');
  }

  private triggerGameOver(): void {
    AudioManager.getInstance().stopMusic();
    this.scene.start('GameOverScene', {
      finalScore: this.scoreSystem?.score || 0,
      coinsEarned: this.scoreSystem?.coins || 0,
      enemiesDefeated: this.scoreSystem?.enemiesDefeated || 0,
      bossesDefeated: this.scoreSystem?.bossesDefeated || 0,
      levelReached: this.levelSystem?.currentLevelIndex || 1,
    });
  }

  public destroy(): void {
    this.mobileControls?.destroy();
    this.hud?.destroy();
  }
}
