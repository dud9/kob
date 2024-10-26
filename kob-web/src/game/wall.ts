import type { GameMap } from './map';

export class Wall {
  private static readonly WALL_COLOR = '#006622';
  private static readonly BARRIER_COLOR = '#6E4633';
  private static readonly imageCache = new Map<string, HTMLImageElement>();

  private isWall: boolean;
  private imageLoaded = false;

  constructor(
    public r: number,
    public c: number,
    public gameMap: GameMap,
  ) {
    this.isWall = r === 0 || c === 0 || r === gameMap.rows - 1 || c === gameMap.cols - 1;
    this.loadImage();
  }

  private async loadImage() {
    const imageUrl = this.isWall
      ? 'https://api.iconify.design/game-icons:brick-wall.svg?color=green'
      : 'https://api.iconify.design/mingcute:box-3-fill.svg?color=white';

    try {
      if (!Wall.imageCache.has(imageUrl)) {
        const image = new Image();
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = reject;
          image.src = imageUrl;
        });
        Wall.imageCache.set(imageUrl, image);
        await imageLoadPromise;
      }
      this.imageLoaded = true;
      this.gameMap.needsBaseUpdate = true;
    } catch (error) {
      console.error('Failed to load wall image:', error);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const { L } = this.gameMap;
    const x = this.c * L;
    const y = this.r * L;

    // 先绘制背景色
    ctx.fillStyle = this.isWall ? Wall.WALL_COLOR : Wall.BARRIER_COLOR;
    ctx.fillRect(x, y, L, L);

    // 如果图片已加载，则绘制图片
    if (this.imageLoaded) {
      const image = Wall.imageCache.get(
        this.isWall
          ? 'https://api.iconify.design/game-icons:brick-wall.svg?color=green'
          : 'https://api.iconify.design/mingcute:box-3-fill.svg?color=white',
      );

      if (image) {
        if (this.isWall) {
          ctx.drawImage(image, x, y, L, L);
        } else {
          ctx.drawImage(image, x + 0.2 * L, y + 0.2 * L, 0.6 * L, 0.6 * L);
        }
      }
    }
  }
}
