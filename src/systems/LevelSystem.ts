import type { EnemyType } from '../config';

export interface LevelConfig {
  levelNumber: number;
  name: string;
  subtitle: string;
  themeColor: number; // Hex color for nebula & glow
  bgColorTop: string;
  bgColorBottom: string;
  enemyTypes: EnemyType[];
  spawnIntervalMs: number;
  waveCount: number;
  enemiesPerWave: number;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  hasBoss: boolean;
  bossHp: number;
  bossName?: string;
}

export class LevelSystem {
  public currentLevelIndex: number = 1;
  public maxConfiguredLevels: number = 10;

  private levels: Record<number, LevelConfig> = {
    1: {
      levelNumber: 1,
      name: 'ORBITAL PATROL',
      subtitle: 'Sector Alpha - Low Earth Orbit',
      themeColor: 0x00f0ff,
      bgColorTop: '#040b19',
      bgColorBottom: '#02040a',
      enemyTypes: ['BASIC'],
      spawnIntervalMs: 2200,
      waveCount: 3,
      enemiesPerWave: 4,
      enemyHpMultiplier: 1.0,
      enemySpeedMultiplier: 1.0,
      hasBoss: false,
      bossHp: 0,
    },
    2: {
      levelNumber: 2,
      name: 'ASTEROID OUTPOST',
      subtitle: 'Sector Beta - Deep Belt',
      themeColor: 0x00d4aa,
      bgColorTop: '#061a18',
      bgColorBottom: '#020a0a',
      enemyTypes: ['BASIC', 'FAST'],
      spawnIntervalMs: 1900,
      waveCount: 4,
      enemiesPerWave: 5,
      enemyHpMultiplier: 1.15,
      enemySpeedMultiplier: 1.1,
      hasBoss: false,
      bossHp: 0,
    },
    3: {
      levelNumber: 3,
      name: 'CRIMSON BARRICADE',
      subtitle: 'Sector Gamma - Boss Vanguard',
      themeColor: 0xff0055,
      bgColorTop: '#200511',
      bgColorBottom: '#0a0105',
      enemyTypes: ['BASIC', 'FAST', 'SHOOTER'],
      spawnIntervalMs: 1700,
      waveCount: 4,
      enemiesPerWave: 6,
      enemyHpMultiplier: 1.3,
      enemySpeedMultiplier: 1.15,
      hasBoss: true,
      bossHp: 1800,
      bossName: 'GOLIATH PRIME',
    },
    4: {
      levelNumber: 4,
      name: 'NEBULA CROSSING',
      subtitle: 'Sector Delta - Ionized Storm',
      themeColor: 0x9d00ff,
      bgColorTop: '#150625',
      bgColorBottom: '#080112',
      enemyTypes: ['BASIC', 'FAST', 'SHOOTER', 'TANK'],
      spawnIntervalMs: 1600,
      waveCount: 5,
      enemiesPerWave: 6,
      enemyHpMultiplier: 1.45,
      enemySpeedMultiplier: 1.2,
      hasBoss: false,
      bossHp: 0,
    },
    5: {
      levelNumber: 5,
      name: 'KAMIKAZE CORRIDOR',
      subtitle: 'Sector Epsilon - Hostile Swarm',
      themeColor: 0xffaa00,
      bgColorTop: '#241703',
      bgColorBottom: '#0d0801',
      enemyTypes: ['FAST', 'KAMIKAZE', 'SHOOTER'],
      spawnIntervalMs: 1400,
      waveCount: 5,
      enemiesPerWave: 7,
      enemyHpMultiplier: 1.6,
      enemySpeedMultiplier: 1.25,
      hasBoss: false,
      bossHp: 0,
    },
    6: {
      levelNumber: 6,
      name: 'DREADNOUGHT GRAVEYARD',
      subtitle: 'Sector Zeta - Mega Fortress',
      themeColor: 0x0088ff,
      bgColorTop: '#071830',
      bgColorBottom: '#020914',
      enemyTypes: ['TANK', 'SHOOTER', 'KAMIKAZE', 'BASIC'],
      spawnIntervalMs: 1300,
      waveCount: 5,
      enemiesPerWave: 7,
      enemyHpMultiplier: 1.8,
      enemySpeedMultiplier: 1.3,
      hasBoss: true,
      bossHp: 3200,
      bossName: 'VOID DREADNOUGHT',
    },
    7: {
      levelNumber: 7,
      name: 'HYPERSPACE BREACH',
      subtitle: 'Sector Eta - Quantum Warp',
      themeColor: 0x00ffff,
      bgColorTop: '#042226',
      bgColorBottom: '#010f12',
      enemyTypes: ['BASIC', 'FAST', 'TANK', 'SHOOTER', 'KAMIKAZE'],
      spawnIntervalMs: 1200,
      waveCount: 6,
      enemiesPerWave: 8,
      enemyHpMultiplier: 2.0,
      enemySpeedMultiplier: 1.35,
      hasBoss: false,
      bossHp: 0,
    },
    8: {
      levelNumber: 8,
      name: 'SOLAR FLARE CRUCIBLE',
      subtitle: 'Sector Theta - Corona Zone',
      themeColor: 0xff3b00,
      bgColorTop: '#2e0e02',
      bgColorBottom: '#120400',
      enemyTypes: ['FAST', 'SHOOTER', 'TANK', 'KAMIKAZE'],
      spawnIntervalMs: 1100,
      waveCount: 6,
      enemiesPerWave: 8,
      enemyHpMultiplier: 2.25,
      enemySpeedMultiplier: 1.4,
      hasBoss: false,
      bossHp: 0,
    },
    9: {
      levelNumber: 9,
      name: 'SHADOW REALM VORTEX',
      subtitle: 'Sector Iota - Abyss Gate',
      themeColor: 0xbb00ff,
      bgColorTop: '#1b032b',
      bgColorBottom: '#0b0014',
      enemyTypes: ['TANK', 'SHOOTER', 'KAMIKAZE', 'FAST'],
      spawnIntervalMs: 1000,
      waveCount: 6,
      enemiesPerWave: 9,
      enemyHpMultiplier: 2.5,
      enemySpeedMultiplier: 1.45,
      hasBoss: false,
      bossHp: 0,
    },
    10: {
      levelNumber: 10,
      name: 'APOCALYPSE CITADEL',
      subtitle: 'Sector Omega - Final Confrontation',
      themeColor: 0xff0033,
      bgColorTop: '#330009',
      bgColorBottom: '#140003',
      enemyTypes: ['BASIC', 'FAST', 'TANK', 'SHOOTER', 'KAMIKAZE'],
      spawnIntervalMs: 900,
      waveCount: 7,
      enemiesPerWave: 10,
      enemyHpMultiplier: 2.8,
      enemySpeedMultiplier: 1.5,
      hasBoss: true,
      bossHp: 5500,
      bossName: 'TITAN OMEGA EMPEROR',
    },
  };

  public getCurrentConfig(): LevelConfig {
    if (this.levels[this.currentLevelIndex]) {
      return this.levels[this.currentLevelIndex];
    }
    // Endless scaling for level > 10
    const overLevel = this.currentLevelIndex;
    const isBossLevel = overLevel % 3 === 0 || overLevel % 5 === 0;
    return {
      levelNumber: overLevel,
      name: `EXTREME SECTOR ${overLevel}`,
      subtitle: 'Deep Unknown Space - Endless Battle',
      themeColor: 0xff0055,
      bgColorTop: '#1f001f',
      bgColorBottom: '#080008',
      enemyTypes: ['BASIC', 'FAST', 'TANK', 'SHOOTER', 'KAMIKAZE'],
      spawnIntervalMs: Math.max(600, 1000 - (overLevel - 10) * 30),
      waveCount: 6,
      enemiesPerWave: Math.min(12, 8 + Math.floor((overLevel - 10) / 2)),
      enemyHpMultiplier: 2.8 + (overLevel - 10) * 0.3,
      enemySpeedMultiplier: Math.min(1.8, 1.5 + (overLevel - 10) * 0.05),
      hasBoss: isBossLevel,
      bossHp: 5000 + (overLevel - 10) * 800,
      bossName: `OMEGA WARLORD MARK ${overLevel - 9}`,
    };
  }

  public nextLevel(): LevelConfig {
    this.currentLevelIndex++;
    return this.getCurrentConfig();
  }

  public reset(): void {
    this.currentLevelIndex = 1;
  }
}
