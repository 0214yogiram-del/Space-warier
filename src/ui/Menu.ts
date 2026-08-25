import Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

export class Menu {
  public static createGlassButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    callback: () => void,
    width: number = 240,
    height: number = 52,
    danger: boolean = false
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const borderColor = danger ? 0xFF2E63 : 0x00F2FF;
    const bgFill = danger ? 0x1a060d : 0x070b14;

    const bg = scene.add.graphics();
    bg.fillStyle(bgFill, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.lineStyle(1.5, borderColor, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);

    const label = scene.add.text(0, 0, text, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '15px',
      color: danger ? '#FF2E63' : '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      letterSpacing: 1.5,
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(danger ? 0x330d1a : (danger ? 0x330d1a : 0x00F2FF), danger ? 0.95 : 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
      bg.lineStyle(2, borderColor, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
      label.setColor(danger ? '#ffffff' : '#05070A');
      container.setScale(1.03);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgFill, 0.9);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
      bg.lineStyle(1.5, borderColor, 0.6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
      label.setColor(danger ? '#FF2E63' : '#ffffff');
      container.setScale(1.0);
    });

    container.on('pointerdown', () => {
      AudioManager.getInstance().playLaser('NORMAL');
      callback();
    });

    return container;
  }

  public static showLevelBanner(
    scene: Phaser.Scene,
    levelNum: number,
    levelName: string,
    subtitle: string,
    onComplete?: () => void
  ): void {
    const container = scene.add.container(270, 480);
    container.setDepth(200);

    const bg = scene.add.graphics();
    bg.fillStyle(0x05070A, 0.92);
    bg.fillRoundedRect(-240, -70, 480, 140, 8);
    bg.lineStyle(1.5, 0x00F2FF, 0.8);
    bg.strokeRoundedRect(-240, -70, 480, 140, 8);

    const title = scene.add.text(0, -32, `SECTOR ${levelNum}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '26px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const nameText = scene.add.text(0, 5, levelName, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '19px',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const subText = scene.add.text(0, 36, subtitle, {
      fontFamily: 'JetBrains Mono, Rajdhani, monospace',
      fontSize: '13px',
      color: '#94a3b8',
      letterSpacing: 1,
    }).setOrigin(0.5);

    container.add([bg, title, nameText, subText]);
    container.setScale(0.5);
    container.setAlpha(0);

    scene.tweens.add({
      targets: container,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 450,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.time.delayedCall(1600, () => {
          scene.tweens.add({
            targets: container,
            y: 380,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
              container.destroy();
              if (onComplete) onComplete();
            },
          });
        });
      },
    });
  }

  public static showPauseModal(
    scene: Phaser.Scene,
    onResume: () => void,
    onRestart: () => void,
    onMainMenu: () => void
  ): Phaser.GameObjects.Container {
    const modal = scene.add.container(270, 480);
    modal.setDepth(300);

    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-270, -480, 540, 960);

    const panel = scene.add.graphics();
    panel.fillStyle(0x070b14, 0.95);
    panel.fillRoundedRect(-180, -220, 360, 440, 8);
    panel.lineStyle(1.5, 0x00F2FF, 0.5);
    panel.strokeRoundedRect(-180, -220, 360, 440, 8);

    const title = scene.add.text(0, -170, 'MISSION PAUSED', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      color: '#00F2FF',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const resumeBtn = Menu.createGlassButton(scene, 0, -90, 'RESUME', onResume, 260, 46);
    const restartBtn = Menu.createGlassButton(scene, 0, -25, 'REDEPLOY SHIP', onRestart, 260, 46);

    const audio = AudioManager.getInstance();
    let sfxText = `SOUND: ${audio.sfxEnabled ? 'ENABLED' : 'MUTED'}`;
    const soundBtn = Menu.createGlassButton(scene, 0, 40, sfxText, () => {
      const nowOn = audio.toggleSound();
      (soundBtn.getAt(1) as Phaser.GameObjects.Text).setText(`SOUND: ${nowOn ? 'ENABLED' : 'MUTED'}`);
    }, 260, 46);

    const menuBtn = Menu.createGlassButton(scene, 0, 105, 'QUIT TO MAIN MENU', onMainMenu, 260, 46, true);

    modal.add([overlay, panel, title, resumeBtn, restartBtn, soundBtn, menuBtn]);
    return modal;
  }

  public static showExitConfirmModal(
    scene: Phaser.Scene,
    onConfirmExit: () => void,
    onCancel: () => void
  ): Phaser.GameObjects.Container {
    const modal = scene.add.container(270, 480);
    modal.setDepth(350);

    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.88);
    overlay.fillRect(-270, -480, 540, 960);

    const panel = scene.add.graphics();
    panel.fillStyle(0x070b14, 0.96);
    panel.fillRoundedRect(-180, -160, 360, 320, 8);
    panel.lineStyle(1.5, 0xFF2E63, 0.7);
    panel.strokeRoundedRect(-180, -160, 360, 320, 8);

    const title = scene.add.text(0, -115, 'QUIT MISSION?', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: '#FF2E63',
      fontStyle: 'bold',
      letterSpacing: 2,
    }).setOrigin(0.5);

    const subtitle = scene.add.text(0, -70, 'Unsaved sector progress\nwill be lost.', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
      color: '#94a3b8',
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5);

    const confirmExitBtn = Menu.createGlassButton(scene, 0, 10, 'QUIT GAME NOW', () => {
      modal.destroy();
      onConfirmExit();
    }, 250, 46, true);

    const cancelBtn = Menu.createGlassButton(scene, 0, 75, 'CANCEL & RESUME', () => {
      modal.destroy();
      onCancel();
    }, 250, 46);

    modal.add([overlay, panel, title, subtitle, confirmExitBtn, cancelBtn]);
    return modal;
  }
}
