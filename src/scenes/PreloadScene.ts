import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  public create(): void {
    const { width, height } = this.cameras.main;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x050711, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, height / 2 - 80, 'SPACE WARRIOR', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '36px',
      color: '#00f0ff',
      fontStyle: '900',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 35, 'INITIALIZING COMBAT PROTOCOLS...', {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '16px',
      color: '#00ffff',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Loading Bar
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();

    progressBox.fillStyle(0x0a1526, 0.8);
    progressBox.fillRoundedRect(width / 2 - 140, height / 2 + 20, 280, 16, 8);
    progressBox.lineStyle(1.5, 0x00f0ff, 0.6);
    progressBox.strokeRoundedRect(width / 2 - 140, height / 2 + 20, 280, 16, 8);

    let progress = 0;
    this.time.addEvent({
      delay: 20,
      repeat: 40,
      callback: () => {
        progress += 0.025;
        progressBar.clear();
        progressBar.fillStyle(0x00f0ff, 0.95);
        progressBar.fillRoundedRect(
          width / 2 - 136,
          height / 2 + 23,
          Math.min(272, 272 * progress),
          10,
          5
        );

        if (progress >= 1.0) {
          this.time.delayedCall(200, () => {
            this.scene.start('MenuScene');
          });
        }
      },
    });
  }
}
