import Phaser from 'phaser';
import { Menu } from '../ui/Menu';
import { fetchLeaderboard, type LeaderboardEntry } from '../firebase/leaderboard';
import { authState } from '../firebase/auth';

export class LeaderboardScene extends Phaser.Scene {
  private listContainer: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  public create(): void {
    const { width, height } = this.cameras.main;

    // 1. Background
    const bg = this.add.graphics();
    bg.fillStyle(0x05070A, 1);
    bg.fillRect(0, 0, width, height);

    // Stars
    const stars = this.add.graphics();
    stars.fillStyle(0x00F2FF, 0.4);
    for (let i = 0; i < 50; i++) {
      stars.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.FloatBetween(0.8, 1.8));
    }

    // 2. Header
    this.add.text(width / 2, 55, 'GLOBAL LEADERBOARD', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '26px',
      color: '#00F2FF',
      fontStyle: 'bold',
      stroke: '#002633',
      strokeThickness: 4,
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.add.text(width / 2, 90, 'TOP COMMANDERS ACROSS THE GALAXY', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#94a3b8',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // 3. Table Column Headers
    const colHeader = this.add.container(width / 2, 135);
    const colBg = this.add.graphics();
    colBg.fillStyle(0x070b14, 0.95);
    colBg.fillRoundedRect(-240, -18, 480, 36, 4);
    colBg.lineStyle(1, 0x00F2FF, 0.3);
    colBg.strokeRoundedRect(-240, -18, 480, 36, 4);
    colHeader.add(colBg);

    const rkHeader = this.add.text(-220, 0, 'RANK', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5);

    const pilotHeader = this.add.text(-140, 0, 'PILOT', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0, 0.5);

    const lvlHeader = this.add.text(60, 0, 'SECTOR', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(0.5, 0.5);

    const scHeader = this.add.text(220, 0, 'SCORE', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 1,
    }).setOrigin(1, 0.5);

    colHeader.add([rkHeader, pilotHeader, lvlHeader, scHeader]);

    // 4. List Container
    this.listContainer = this.add.container(width / 2, 160);

    this.statusText = this.add.text(width / 2, 380, 'TRANSMITTING SATELLITE TELEMETRY...', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#00f0ff',
    }).setOrigin(0.5);

    // 5. Fetch Entries
    this.loadLeaderboardEntries();

    // 6. Bottom Navigation
    const refreshBtn = Menu.createGlassButton(this, width / 2 - 120, 890, 'REFRESH', () => {
      this.loadLeaderboardEntries();
    }, 200, 48);

    const backBtn = Menu.createGlassButton(this, width / 2 + 120, 890, 'BACK TO MENU', () => {
      this.scene.start('MenuScene');
    }, 200, 48, true);
  }

  private async loadLeaderboardEntries(): Promise<void> {
    if (this.statusText) {
      this.statusText.setText('UPDATING LEADERBOARD...');
      this.statusText.setVisible(true);
    }
    if (this.listContainer) {
      this.listContainer.removeAll(true);
    }

    try {
      const entries = await fetchLeaderboard(10);
      if (this.statusText) this.statusText.setVisible(false);
      this.renderEntries(entries);
    } catch (e) {
      if (this.statusText) {
        this.statusText.setText('OFFLINE MODE - LOCAL ARCHIVES DISPLAYED');
      }
    }
  }

  private renderEntries(entries: LeaderboardEntry[]): void {
    if (!this.listContainer) return;
    this.listContainer.removeAll(true);

    const currentUserId = authState.currentUser.userId;
    let rowY = 20;

    entries.forEach((entry, idx) => {
      const rank = idx + 1;
      const isMe = entry.userId === currentUserId;

      const row = this.add.container(0, rowY);

      const rowBg = this.add.graphics();
      if (isMe) {
        rowBg.fillStyle(0x002633, 0.9);
        rowBg.lineStyle(1.5, 0x00F2FF, 0.9);
      } else if (rank === 1) {
        rowBg.fillStyle(0x1a1505, 0.85);
        rowBg.lineStyle(1, 0xffd700, 0.6);
      } else {
        rowBg.fillStyle(idx % 2 === 0 ? 0x070b14 : 0x05080f, 0.85);
        rowBg.lineStyle(1, 0x00F2FF, 0.2);
      }

      rowBg.fillRoundedRect(-240, -20, 480, 40, 4);
      rowBg.strokeRoundedRect(-240, -20, 480, 40, 4);
      row.add(rowBg);

      // Rank Medal Icon
      let rankText = `#${rank}`;
      let rankColor = '#94a3b8';
      if (rank === 1) {
        rankText = '🥇 1';
        rankColor = '#ffd700';
      } else if (rank === 2) {
        rankText = '🥈 2';
        rankColor = '#e2e8f0';
      } else if (rank === 3) {
        rankText = '🥉 3';
        rankColor = '#cd7f32';
      }

      const rk = this.add.text(-220, 0, rankText, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: rankColor,
      }).setOrigin(0, 0.5);

      // Pilot Name
      const name = this.add.text(-140, 0, (isMe ? '▶ ' : '') + entry.displayName.toUpperCase(), {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: isMe ? '#00F2FF' : '#E0E0E0',
      }).setOrigin(0, 0.5);

      // Sector / Level
      const lvl = this.add.text(60, 0, `LV.${entry.level}`, {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        color: '#00F2FF',
      }).setOrigin(0.5, 0.5);

      // Score
      const sc = this.add.text(220, 0, entry.score.toLocaleString(), {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: rank === 1 ? '#ffd700' : '#ffffff',
      }).setOrigin(1, 0.5);

      row.add([rk, name, lvl, sc]);
      this.listContainer?.add(row);

      rowY += 50;
    });
  }
}
