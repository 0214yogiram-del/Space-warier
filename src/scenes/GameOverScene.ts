import Phaser from 'phaser';
import { Menu } from '../ui/Menu';
import { AudioManager } from '../systems/AudioManager';
import { submitScoreToLeaderboard } from '../firebase/leaderboard';
import { authState } from '../firebase/auth';

export interface GameOverData {
  finalScore: number;
  coinsEarned: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  levelReached: number;
}

export class GameOverScene extends Phaser.Scene {
  private dataReceived: GameOverData = {
    finalScore: 0,
    coinsEarned: 0,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    levelReached: 1,
  };

  constructor() {
    super({ key: 'GameOverScene' });
  }

  public init(data: GameOverData): void {
    if (data) {
      this.dataReceived = data;
    }
  }

  public create(): void {
    const { width, height } = this.cameras.main;
    const isNewHighScore = this.dataReceived.finalScore > (authState.currentUser.highScore || 0);

    // Save and submit to leaderboard
    submitScoreToLeaderboard(
      this.dataReceived.finalScore,
      this.dataReceived.levelReached,
      this.dataReceived.coinsEarned
    );

    // 1. Dark Backdrop
    const bg = this.add.graphics();
    bg.fillStyle(0x05070A, 1);
    bg.fillRect(0, 0, width, height);

    // Starfield particles in background
    const stars = this.add.graphics();
    stars.fillStyle(0xffffff, 0.4);
    for (let i = 0; i < 60; i++) {
      stars.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.FloatBetween(0.8, 1.6));
    }

    // 2. Title: GAME OVER
    const title = this.add.text(width / 2, 130, 'MISSION TERMINATED', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      color: '#FF2E63',
      fontStyle: '900',
      stroke: '#330614',
      strokeThickness: 5,
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    if (isNewHighScore) {
      const newBestTag = this.add.text(width / 2, 180, '★ NEW PERSONAL RECORD! ★', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        color: '#00F2FF',
        fontStyle: 'bold',
        letterSpacing: 1.5,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: newBestTag,
        alpha: 0.4,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }

    // 3. Stats Glass Panel
    const panel = this.add.container(width / 2, 400);
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x070b14, 0.95);
    panelBg.fillRoundedRect(-230, -170, 460, 340, 8);
    panelBg.lineStyle(1.5, 0x00F2FF, 0.4);
    panelBg.strokeRoundedRect(-230, -170, 460, 340, 8);
    panel.add(panelBg);

    const stats = [
      { label: 'FINAL SCORE', val: this.dataReceived.finalScore.toLocaleString(), color: '#00F2FF', size: '20px' },
      { label: 'HIGH SCORE', val: Math.max(this.dataReceived.finalScore, authState.currentUser.highScore).toLocaleString(), color: '#ffffff', size: '16px' },
      { label: 'SECTOR REACHED', val: `LEVEL ${this.dataReceived.levelReached}`, color: '#00F2FF', size: '16px' },
      { label: 'ENEMIES DESTROYED', val: `${this.dataReceived.enemiesDefeated}`, color: '#E0E0E0', size: '16px' },
      { label: 'BOSSES DEFEATED', val: `${this.dataReceived.bossesDefeated}`, color: '#FF2E63', size: '16px' },
      { label: 'COINS ACQUIRED', val: `🪙 ${this.dataReceived.coinsEarned}`, color: '#ffd700', size: '16px' },
    ];

    let statY = -130;
    stats.forEach((item) => {
      const lbl = this.add.text(-200, statY, item.label, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        color: '#94a3b8',
        letterSpacing: 1,
      }).setOrigin(0, 0.5);

      const val = this.add.text(200, statY, item.val, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: item.size,
        fontStyle: 'bold',
        color: item.color,
      }).setOrigin(1, 0.5);

      panel.add([lbl, val]);
      statY += 46;
    });

    // 4. Action Buttons
    const retryBtn = Menu.createGlassButton(this, width / 2, 650, 'REDEPLOY FIGHTER', () => {
      AudioManager.getInstance().startMusic();
      this.scene.start('GameScene');
    }, 280, 52);

    const leaderBtn = Menu.createGlassButton(this, width / 2, 720, 'LEADERBOARD', () => {
      this.scene.start('LeaderboardScene');
    }, 280, 48);

    const menuBtn = Menu.createGlassButton(this, width / 2, 785, 'QUIT TO MAIN MENU', () => {
      this.scene.start('MenuScene');
    }, 280, 48, true);
  }
}
