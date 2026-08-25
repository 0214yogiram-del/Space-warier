import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { ScoreSystem } from '../systems/ScoreSystem';
import { Boss } from '../entities/Boss';

export class HUD {
  public scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public graphics: Phaser.GameObjects.Graphics;

  private scoreText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private coinsText: Phaser.GameObjects.Text;
  private comboText: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;

  // Boss HUD elements
  private bossContainer: Phaser.GameObjects.Container;
  private bossNameText: Phaser.GameObjects.Text;
  private bossGraphics: Phaser.GameObjects.Graphics;

  // Active powerup tags
  private buffContainer: Phaser.GameObjects.Container;

  // Pause & Exit buttons
  public pauseButton: Phaser.GameObjects.Container;
  public exitButton: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onPauseClick: () => void, onExitClick?: () => void) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    const titleStyle = {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 1,
    };

    const valueStyle = {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    };

    // 1. Top Bar: Score & Level & Coins
    this.scoreText = scene.add.text(20, 20, 'SCORE: 0', {
      ...titleStyle,
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.container.add(this.scoreText);

    this.levelText = scene.add.text(250, 20, 'SECTOR 1', {
      ...titleStyle,
      fontSize: '14px',
      color: '#00F2FF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.container.add(this.levelText);

    this.coinsText = scene.add.text(410, 20, '🪙 0', {
      ...titleStyle,
      fontSize: '14px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);
    this.container.add(this.coinsText);

    // 2. Pause & Exit Buttons (Top Right corner)
    this.pauseButton = scene.add.container(465, 30);
    const pauseBg = scene.add.rectangle(0, 0, 28, 28, 0x070b14, 0.9);
    pauseBg.setStrokeStyle(1.5, 0x00F2FF, 0.6);
    const pauseIcon = scene.add.text(0, 0, '❚❚', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
    }).setOrigin(0.5);

    this.pauseButton.add([pauseBg, pauseIcon]);
    this.pauseButton.setSize(28, 28);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on('pointerdown', onPauseClick);
    this.pauseButton.on('pointerover', () => {
      pauseBg.setStrokeStyle(2, 0x00F2FF, 1);
      this.pauseButton.setScale(1.08);
    });
    this.pauseButton.on('pointerout', () => {
      pauseBg.setStrokeStyle(1.5, 0x00F2FF, 0.6);
      this.pauseButton.setScale(1.0);
    });
    this.container.add(this.pauseButton);

    // Exit Button
    this.exitButton = scene.add.container(505, 30);
    const exitBg = scene.add.rectangle(0, 0, 28, 28, 0x070b14, 0.9);
    exitBg.setStrokeStyle(1.5, 0xFF2E63, 0.7);
    const exitIcon = scene.add.text(0, 0, '✕', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#FF2E63',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.exitButton.add([exitBg, exitIcon]);
    this.exitButton.setSize(28, 28);
    this.exitButton.setInteractive({ useHandCursor: true });
    this.exitButton.on('pointerdown', () => {
      if (onExitClick) {
        onExitClick();
      } else {
        onPauseClick();
      }
    });
    this.exitButton.on('pointerover', () => {
      exitBg.setStrokeStyle(2, 0xFF2E63, 1);
      this.exitButton.setScale(1.08);
    });
    this.exitButton.on('pointerout', () => {
      exitBg.setStrokeStyle(1.5, 0xFF2E63, 0.7);
      this.exitButton.setScale(1.0);
    });
    this.container.add(this.exitButton);

    // 3. Health & Shield Bars (Bottom Left)
    this.hpText = scene.add.text(20, 895, 'HULL 100', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#FF2E63',
      letterSpacing: 1,
    });
    this.container.add(this.hpText);

    this.shieldText = scene.add.text(20, 925, 'SHIELD 50', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#00F2FF',
      letterSpacing: 1,
    });
    this.container.add(this.shieldText);

    // 4. Weapon Tier & Combo (Bottom Right)
    this.weaponText = scene.add.text(520, 925, 'SYS: VULCAN T1', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      letterSpacing: 1,
    }).setOrigin(1, 0);
    this.container.add(this.weaponText);

    this.comboText = scene.add.text(520, 895, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd700',
      letterSpacing: 1,
    }).setOrigin(1, 0);
    this.container.add(this.comboText);

    // 5. Boss Bar Container
    this.bossContainer = scene.add.container(270, 75);
    this.bossGraphics = scene.add.graphics();
    this.bossNameText = scene.add.text(0, -18, 'BOSS: TITAN STRIKER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#FF2E63',
      stroke: '#000000',
      strokeThickness: 3,
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.bossContainer.add([this.bossGraphics, this.bossNameText]);
    this.bossContainer.setVisible(false);
    this.container.add(this.bossContainer);

    // 6. Buff tags container
    this.buffContainer = scene.add.container(20, 60);
    this.container.add(this.buffContainer);
  }

  public update(player: Player, scoreSystem: ScoreSystem, currentLevel: number, boss: Boss | null): void {
    // 1. Text updates
    this.scoreText.setText(`SCORE: ${scoreSystem.score.toLocaleString()}`);
    this.levelText.setText(`SECTOR ${currentLevel}`);
    this.coinsText.setText(`🪙 ${scoreSystem.coins}`);

    this.hpText.setText(`HULL ${Math.ceil(player.health)}`);
    this.shieldText.setText(`SHIELD ${Math.ceil(player.shield)}`);
    this.weaponText.setText(`SYS: ${player.weaponSystem.currentWeapon} T${player.weaponSystem.weaponTier}`);

    if (scoreSystem.combo > 1) {
      this.comboText.setText(`COMBO ${scoreSystem.comboMultiplier.toFixed(1)}x (${scoreSystem.combo})`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }

    // 2. Render Bars
    this.graphics.clear();

    // Top HUD glass backdrop
    this.graphics.fillStyle(0x070b14, 0.85);
    this.graphics.fillRoundedRect(10, 10, 520, 42, 4);
    this.graphics.lineStyle(1, 0x00F2FF, 0.25);
    this.graphics.strokeRoundedRect(10, 10, 520, 42, 4);

    // Health Bar (Bottom)
    const hpBarW = 120;
    const hpBarH = 8;
    this.graphics.fillStyle(0x220510, 0.8);
    this.graphics.fillRoundedRect(80, 898, hpBarW, hpBarH, 2);

    const hpPct = Phaser.Math.Clamp(player.health / player.maxHealth, 0, 1);
    this.graphics.fillStyle(0xFF2E63, 0.95);
    this.graphics.fillRoundedRect(80, 898, hpBarW * hpPct, hpBarH, 2);

    // Shield Bar (Bottom)
    this.graphics.fillStyle(0x041825, 0.8);
    this.graphics.fillRoundedRect(80, 928, hpBarW, hpBarH, 2);

    const shieldPct = Phaser.Math.Clamp(player.shield / player.maxShield, 0, 1);
    this.graphics.fillStyle(0x00F2FF, 0.95);
    this.graphics.fillRoundedRect(80, 928, hpBarW * shieldPct, hpBarH, 2);

    // 3. Boss Bar updates
    if (boss && boss.active) {
      this.bossContainer.setVisible(true);
      this.bossNameText.setText(`THREAT: ${boss.bossName.toUpperCase()}`);

      this.bossGraphics.clear();
      const bossBarW = 360;
      const bossBarH = 10;
      const bx = -bossBarW / 2;
      const by = 0;

      // Backdrop
      this.bossGraphics.fillStyle(0x1a040b, 0.9);
      this.bossGraphics.fillRoundedRect(bx, by, bossBarW, bossBarH, 2);
      this.bossGraphics.lineStyle(1.5, boss.isEnraged ? 0xff0033 : 0xFF2E63, 0.8);
      this.bossGraphics.strokeRoundedRect(bx, by, bossBarW, bossBarH, 2);

      // Fill
      const bossPct = Phaser.Math.Clamp(boss.health / boss.maxHealth, 0, 1);
      this.bossGraphics.fillStyle(boss.isEnraged ? 0xff0033 : 0xFF2E63, 0.95);
      this.bossGraphics.fillRoundedRect(bx, by, bossBarW * bossPct, bossBarH, 2);
    } else {
      this.bossContainer.setVisible(false);
    }

    // 4. Powerup active buffs badges
    this.renderBuffBadges(player);
  }

  private renderBuffBadges(player: Player): void {
    this.buffContainer.removeAll(true);
    let offsetY = 0;

    player.activeBuffs.forEach((buff, type) => {
      const remainingSec = (buff.remainingMs / 1000).toFixed(1);
      const name = type.replace('_', ' ');

      const badgeBg = this.scene.add.graphics();
      badgeBg.fillStyle(0x070b14, 0.9);
      badgeBg.fillRoundedRect(0, offsetY, 160, 22, 4);
      badgeBg.lineStyle(1, 0x00F2FF, 0.4);
      badgeBg.strokeRoundedRect(0, offsetY, 160, 22, 4);

      const txt = this.scene.add.text(8, offsetY + 3, `⚡ ${name}: ${remainingSec}s`, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: '#00F2FF',
        fontStyle: 'bold',
      });

      this.buffContainer.add([badgeBg, txt]);
      offsetY += 26;
    });
  }

  public destroy(): void {
    this.container.destroy();
  }
}
