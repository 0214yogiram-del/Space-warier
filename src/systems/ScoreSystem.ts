import { authState } from '../firebase/auth';

export class ScoreSystem {
  public score: number = 0;
  public highScore: number = 0;
  public coins: number = 0;
  public combo: number = 0;
  public comboMultiplier: number = 1.0;
  public comboTimer: number = 0;
  public enemiesDefeated: number = 0;
  public bossesDefeated: number = 0;
  public currentLevel: number = 1;
  public coinMultiplierActive: boolean = false;
  public doubleDamageActive: boolean = false;

  constructor() {
    this.highScore = authState.currentUser.highScore || 0;
  }

  public resetRun(): void {
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.comboMultiplier = 1.0;
    this.comboTimer = 0;
    this.enemiesDefeated = 0;
    this.bossesDefeated = 0;
    this.currentLevel = 1;
    this.coinMultiplierActive = false;
    this.doubleDamageActive = false;
    this.highScore = Math.max(this.highScore, authState.currentUser.highScore || 0);
  }

  public addScore(basePoints: number): number {
    const gained = Math.round(basePoints * this.comboMultiplier);
    this.score += gained;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.registerComboHit();
    return gained;
  }

  public addCoins(baseCount: number): number {
    const multiplier = this.coinMultiplierActive ? 2 : 1;
    const gained = baseCount * multiplier;
    this.coins += gained;
    return gained;
  }

  public registerEnemyDefeated(points: number = 100, coins: number = 1): { pointsGained: number; coinsGained: number } {
    this.enemiesDefeated++;
    const pointsGained = this.addScore(points);
    const coinsGained = this.addCoins(coins);
    return { pointsGained, coinsGained };
  }

  public registerBossDefeated(points: number = 5000, coins: number = 25): { pointsGained: number; coinsGained: number } {
    this.bossesDefeated++;
    const pointsGained = this.addScore(points);
    const coinsGained = this.addCoins(coins);
    return { pointsGained, coinsGained };
  }

  private registerComboHit(): void {
    this.combo++;
    this.comboTimer = 3.5; // 3.5 seconds window to maintain combo
    if (this.combo >= 20) {
      this.comboMultiplier = 3.0;
    } else if (this.combo >= 10) {
      this.comboMultiplier = 2.0;
    } else if (this.combo >= 5) {
      this.comboMultiplier = 1.5;
    } else {
      this.comboMultiplier = 1.0;
    }
  }

  public update(deltaSeconds: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaSeconds;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboMultiplier = 1.0;
        this.comboTimer = 0;
      }
    }
  }
}
