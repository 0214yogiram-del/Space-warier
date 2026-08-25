import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { LevelSystem, type LevelConfig } from './LevelSystem';
import type { EnemyType } from '../config';

export class EnemySpawner {
  public scene: Phaser.Scene;
  public enemyGroup: Phaser.Physics.Arcade.Group;
  public bossGroup: Phaser.Physics.Arcade.Group;
  public boss: Boss | null = null;
  public levelSystem: LevelSystem;

  public currentWave: number = 0;
  public totalWavesInLevel: number = 4;
  public waveTimer: number = 0;
  public isSpawningWave: boolean = false;
  public isBossActive: boolean = false;
  public levelCleared: boolean = false;

  private spawnCooldown: number = 0;

  constructor(
    scene: Phaser.Scene,
    enemyGroup: Phaser.Physics.Arcade.Group,
    bossGroup: Phaser.Physics.Arcade.Group,
    levelSystem: LevelSystem
  ) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;
    this.bossGroup = bossGroup;
    this.levelSystem = levelSystem;
  }

  public startLevel(levelConfig: LevelConfig): void {
    this.currentWave = 0;
    this.totalWavesInLevel = levelConfig.waveCount;
    this.isSpawningWave = false;
    this.isBossActive = false;
    this.levelCleared = false;
    this.waveTimer = 1500; // 1.5s delay before first wave
  }

  public update(time: number, delta: number): void {
    if (this.levelCleared) return;

    // Handle standard wave spawning
    if (!this.isBossActive) {
      this.waveTimer -= delta;

      // Count active regular enemies
      let activeCount = 0;
      this.enemyGroup.getChildren().forEach((child) => {
        if ((child as Phaser.Physics.Arcade.Sprite).active) {
          activeCount++;
        }
      });

      // If timer is ready OR all enemies in previous wave are cleared early
      if (this.waveTimer <= 0 || (activeCount === 0 && this.currentWave > 0 && this.currentWave < this.totalWavesInLevel && this.waveTimer < 2000)) {
        if (this.currentWave < this.totalWavesInLevel) {
          this.spawnNextWave();
        } else if (activeCount === 0) {
          // All waves defeated
          const cfg = this.levelSystem.getCurrentConfig();
          if (cfg.hasBoss) {
            this.spawnBoss(cfg);
          } else {
            this.levelCleared = true;
          }
        }
      }
    }
  }

  public spawnNextWave(): void {
    this.currentWave++;
    const cfg = this.levelSystem.getCurrentConfig();
    this.waveTimer = cfg.spawnIntervalMs * 3.5; // Next wave timer

    const formationType = this.currentWave % 4;
    const enemyTypes = cfg.enemyTypes;
    const count = cfg.enemiesPerWave;

    switch (formationType) {
      case 0:
        // V-Formation
        this.spawnVFormation(enemyTypes, count, cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
        break;
      case 1:
        // Pincer Sweep from both edges
        this.spawnPincerFormation(enemyTypes, count, cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
        break;
      case 2:
        // Horizontal Line
        this.spawnLineFormation(enemyTypes, count, cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
        break;
      case 3:
      default:
        // Random Staggered Swarm
        this.spawnStaggeredSwarm(enemyTypes, count, cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
        break;
    }
  }

  private spawnVFormation(types: EnemyType[], count: number, hpMult: number, spdMult: number): void {
    const type = types[Math.floor(Math.random() * types.length)];
    const midX = 270;
    const half = Math.floor(count / 2);

    for (let i = -half; i <= half; i++) {
      const x = midX + i * 50;
      const y = -60 - Math.abs(i) * 45;
      this.spawnSingleEnemy(x, y, type, hpMult, spdMult);
    }
  }

  private spawnPincerFormation(types: EnemyType[], count: number, hpMult: number, spdMult: number): void {
    for (let i = 0; i < count; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? 50 + (i * 20) : 490 - (i * 20);
      const y = -50 - (i * 35);
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnSingleEnemy(x, y, type, hpMult, spdMult);
    }
  }

  private spawnLineFormation(types: EnemyType[], count: number, hpMult: number, spdMult: number): void {
    const spacing = 440 / (count + 1);
    for (let i = 1; i <= count; i++) {
      const x = 50 + i * spacing;
      const y = -60 - (i % 2) * 30;
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnSingleEnemy(x, y, type, hpMult, spdMult);
    }
  }

  private spawnStaggeredSwarm(types: EnemyType[], count: number, hpMult: number, spdMult: number): void {
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * 420;
      const y = -50 - i * 55;
      const type = types[Math.floor(Math.random() * types.length)];
      this.spawnSingleEnemy(x, y, type, hpMult, spdMult);
    }
  }

  public spawnSingleEnemy(x: number, y: number, type: EnemyType, hpMult: number, spdMult: number): Enemy {
    let enemy = this.enemyGroup.getFirstDead(false) as Enemy | null;
    if (!enemy) {
      enemy = new Enemy(this.scene, x, y);
      this.enemyGroup.add(enemy, true);
    }
    enemy.spawn(x, y, type, hpMult, spdMult);
    return enemy;
  }

  public spawnBoss(cfg: LevelConfig): void {
    this.isBossActive = true;
    if (!this.boss) {
      this.boss = new Boss(this.scene, 270, -100);
      this.bossGroup.add(this.boss, true);
    }
    this.boss.initBoss(270, -100, cfg.bossName || 'WARLORD', cfg.bossHp);
  }

  public spawnBossMinion(): void {
    if (!this.boss || !this.boss.active) return;
    const x1 = Math.max(60, this.boss.x - 120);
    const x2 = Math.min(480, this.boss.x + 120);
    const cfg = this.levelSystem.getCurrentConfig();
    this.spawnSingleEnemy(x1, this.boss.y + 40, 'FAST', cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
    this.spawnSingleEnemy(x2, this.boss.y + 40, 'SHOOTER', cfg.enemyHpMultiplier, cfg.enemySpeedMultiplier);
  }
}
