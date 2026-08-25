import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class MobileControls {
  public scene: Phaser.Scene;
  public player: Player;
  public isTouchDevice: boolean = false;

  private dragPointer: Phaser.Input.Pointer | null = null;
  private touchOriginX: number = 0;
  private touchOriginY: number = 0;
  private shipOriginX: number = 0;
  private shipOriginY: number = 0;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setupTouchInput();
  }

  private setupTouchInput(): void {
    const input = this.scene.input;

    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore clicks on top HUD area (pause button)
      if (pointer.y < 70 && pointer.x > 460) return;

      this.dragPointer = pointer;
      this.touchOriginX = pointer.x;
      this.touchOriginY = pointer.y;
      this.shipOriginX = this.player.x;
      this.shipOriginY = this.player.y;
      this.player.isDragging = true;
      this.player.targetX = pointer.x;
      this.player.targetY = pointer.y;
    });

    input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.player.isDragging && this.dragPointer && this.dragPointer.id === pointer.id) {
        const deltaX = pointer.x - this.touchOriginX;
        const deltaY = pointer.y - this.touchOriginY;

        // Relative smooth positioning
        const newX = Phaser.Math.Clamp(this.shipOriginX + deltaX * 1.15, 30, 510);
        const newY = Phaser.Math.Clamp(this.shipOriginY + deltaY * 1.15, 80, 920);

        this.player.targetX = newX;
        this.player.targetY = newY;
      }
    });

    input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.dragPointer && this.dragPointer.id === pointer.id) {
        this.player.isDragging = false;
        this.dragPointer = null;
      }
    });
  }

  public destroy(): void {
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointermove');
    this.scene.input.off('pointerup');
  }
}
