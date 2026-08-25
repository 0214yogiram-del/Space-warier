import Phaser from 'phaser';
import { createGameConfig } from './config';

let gameInstance: Phaser.Game | null = null;

export const initGame = (containerId: string = 'game-container'): Phaser.Game => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
  const config = createGameConfig(containerId);
  gameInstance = new Phaser.Game(config);
  return gameInstance;
};

export const getGameInstance = (): Phaser.Game | null => {
  return gameInstance;
};

export const destroyGame = (): void => {
  if (gameInstance) {
    gameInstance.destroy(true);
    gameInstance = null;
  }
};
