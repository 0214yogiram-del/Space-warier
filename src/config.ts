import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

export const WEAPON_TYPES = {
  NORMAL: 'NORMAL',
  DOUBLE: 'DOUBLE',
  TRIPLE: 'TRIPLE',
  MISSILE: 'MISSILE',
  PLASMA: 'PLASMA',
} as const;

export type WeaponType = keyof typeof WEAPON_TYPES;

export const POWERUP_TYPES = {
  HEALTH: 'HEALTH',
  SHIELD: 'SHIELD',
  RAPID_FIRE: 'RAPID_FIRE',
  DOUBLE_DAMAGE: 'DOUBLE_DAMAGE',
  TRIPLE_SHOT: 'TRIPLE_SHOT',
  COIN_MULTIPLIER: 'COIN_MULTIPLIER',
} as const;

export type PowerUpType = keyof typeof POWERUP_TYPES;

export const ENEMY_TYPES = {
  BASIC: 'BASIC',
  FAST: 'FAST',
  TANK: 'TANK',
  SHOOTER: 'SHOOTER',
  KAMIKAZE: 'KAMIKAZE',
  BOSS: 'BOSS',
} as const;

export type EnemyType = keyof typeof ENEMY_TYPES;

export const createGameConfig = (parentContainerId: string = 'game-container'): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    parent: parentContainerId,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#05070A',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 3,
    },
    scene: [
      BootScene,
      PreloadScene,
      MenuScene,
      GameScene,
      GameOverScene,
      LeaderboardScene,
    ],
  };
};
