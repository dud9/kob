import type { GameMap } from './map';

export class Wall {
  private static readonly WALL_COLOR = '#006622';
  private static readonly BARRIER_COLOR = '#6E4633';
  private static readonly imageCache = new Map<string, HTMLImageElement>();
  private static readonly patternCache = new Map<string, CanvasPattern>();

  private isWall: boolean;
  private pattern: CanvasPattern | null = null;

  constructor(
    public r: number,
    public c: number,
    public gameMap: GameMap,
  ) {
    // 判断是否为边界墙
    this.isWall = r === 0 || c === 0 || r === gameMap.rows - 1 || c === gameMap.cols - 1;
    this.initPattern().catch(console.error); // 异步初始化pattern
  }

  private static async loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return this.imageCache.get(url)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async initPattern() {
    const { gameMap: { ctx } } = this;
    const cacheKey = `${this.isWall}_${ctx.canvas.width}`;

    if (Wall.patternCache.has(cacheKey)) {
      this.pattern = Wall.patternCache.get(cacheKey)!;
      return;
    }

    try {
      const image = await Wall.loadImage(
        this.isWall
          ? 'https://api.iconify.design/game-icons:brick-wall.svg?color=green'
          : 'https://api.iconify.design/mingcute:box-3-fill.svg?color=white',
      );

      // 创建离屏画布来生成图案
      const patternCanvas = document.createElement('canvas');
      const patternCtx = patternCanvas.getContext('2d')!;
      const size = this.gameMap.L;

      patternCanvas.width = size;
      patternCanvas.height = size;

      // 绘制背景
      patternCtx.fillStyle = this.isWall ? Wall.WALL_COLOR : Wall.BARRIER_COLOR;
      patternCtx.fillRect(0, 0, size, size);

      // 绘制图标
      if (this.isWall) {
        patternCtx.drawImage(image, 0, 0, size, size);
      } else {
        const padding = size * 0.2;
        const imageSize = size * 0.6;
        patternCtx.drawImage(image, padding, padding, imageSize, imageSize);
      }

      // 创建图案
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        Wall.patternCache.set(cacheKey, pattern);
        this.pattern = pattern;
      }
    } catch (error) {
      console.error('Failed to load wall pattern:', error);
      // 降级处理：使用纯色
      this.pattern = null;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { L } = this.gameMap;
    const x = this.c * L;
    const y = this.r * L;

    if (this.pattern) {
      // 使用缓存的图案
      ctx.save();
      ctx.fillStyle = this.pattern;
      ctx.translate(x, y);
      ctx.fillRect(0, 0, L, L);
      ctx.restore();
    } else {
      // 降级渲染：使用纯色
      ctx.fillStyle = this.isWall ? Wall.WALL_COLOR : Wall.BARRIER_COLOR;
      ctx.fillRect(x, y, L, L);
    }
  }

  // 清理资源
  public destroy() {
    this.pattern = null;
  }
}
