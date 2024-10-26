import type { Pausable } from '@vueuse/core';
import { Game } from './game';
import { Snake } from './snake';
import { Wall } from './wall';

const COLOR_EVEN = '#C3944E';
const COLOR_ODD = '#A57332';

export class GameMap extends Game {
  L = 0;
  rows = 13;
  cols = 14;
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private needsBaseUpdate = true;

  walls: Wall[] = [];
  snakes: Snake[] = [
    new Snake({ id: 0, color: '#206CCF', r: this.rows - 2, c: 1 }, this),
    new Snake({ id: 1, color: '#CB272D', r: 1, c: this.cols - 2 }, this),
  ];

  recordFn: Pausable | null = null;
  task: Pausable | null = null;

  constructor(
    public ctx: CanvasRenderingContext2D,
    private parent: HTMLElement,
  ) {
    super();

    // 初始化基础画布
    this.baseCanvas = document.createElement('canvas');
    this.baseCtx = this.baseCanvas.getContext('2d', {
      alpha: false,
    })!;
  }

  start() {
    this.createWalls();
    const { isRecording } = useRecordStore();

    if (isRecording) {
      this.playRecord();
    } else {
      this.addListeningEvents();
    }

    // 初始渲染底图
    this.updateSize();
  }

  private renderBase() {
    if (!this.needsBaseUpdate)
      return;

    const { L, cols, rows, baseCanvas, baseCtx } = this;
    baseCanvas.width = this.ctx.canvas.width;
    baseCanvas.height = this.ctx.canvas.height;

    // 绘制棋盘底色
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        baseCtx.fillStyle = ((r + c) & 1) === 0 ? COLOR_EVEN : COLOR_ODD;
        baseCtx.fillRect(c * L, r * L, L, L);
      }
    }

    // 绘制墙
    this.walls.forEach(wall => wall.render(baseCtx));

    this.needsBaseUpdate = false;
  }

  update() {
    // 1. 更新尺寸
    this.updateSize();

    // 2. 更新游戏状态
    const { isRecording } = useRecordStore();

    if (isRecording) {
      if (this.checkSnakeReady()) {
        this.nextStep();
      }
    } else if (!this.task && this.checkSnakeReady()) {
      this.task = useIntervalFn(() => {
        if (this.checkSnakeReady()) {
          this.nextStep();
          return true;
        }
        return false;
      }, 100);
    }

    // 3. 渲染
    this.render();
  }

  private render() {
    const { ctx, baseCanvas } = this;

    // 1. 确保基础层是最新的
    this.renderBase();

    // 2. 清空当前画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 3. 绘制基础层
    ctx.drawImage(baseCanvas, 0, 0);

    // 4. 绘制蛇
    this.snakes.forEach(snake => snake.render());
  }

  createWalls() {
    const { rows, cols } = this;
    const { gameMap } = usePkStore();
    const { isRecording, gameMap: gameMap2 } = useRecordStore();

    const g: number[][] = [gameMap!, gameMap2!][Number(isRecording)];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (g[r][c])
          this.walls.push(new Wall(r, c, this));
      }
    }

    // 标记需要更新底图
    this.needsBaseUpdate = true;
  }

  playRecord() {
    const {
      aSteps,
      bSteps,
      gameResult,
      setReplayFinished,
    } = useRecordStore();
    if (!aSteps || !bSteps)
      return;

    let k = 0;
    const [snake0, snake1] = this.snakes;
    let _recordFn: Pausable | null = null;

    _recordFn = this.recordFn = useIntervalFn(() => {
      if (k >= aSteps.length - 1) {
        if (['draw', 'playerBWon'].includes(gameResult))
          snake0.status = 'die';
        if (['draw', 'playerAWon'].includes(gameResult))
          snake1.status = 'die';
        _recordFn?.pause(); // 这里注意 this 的指向问题
        setReplayFinished(true);
      } else {
        snake0.setDirection(Number.parseInt(aSteps[k]));
        snake1.setDirection(Number.parseInt(bSteps[k]));
      }
      k++;
    }, 300);
  }

  addListeningEvents() {
    const { socket } = usePkStore();

    const canvas = this.ctx.canvas;
    canvas.focus();

    canvas.addEventListener('keydown', (e) => {
      let d = -1;
      if (e.key === 'w')
        d = 0;
      else if (e.key === 'd')
        d = 1;
      else if (e.key === 's')
        d = 2;
      else if (e.key === 'a')
        d = 3;

      if (d >= 0) {
        socket?.send(JSON.stringify({
          event: 'move',
          direction: d,
        }));
      }
    });
  }

  private updateSize() {
    const { parent, cols, rows } = this;
    const { clientWidth, clientHeight } = parent;
    const newL = Math.floor(Math.min(clientWidth / cols, clientHeight / rows));

    if (this.L !== newL) {
      this.L = newL;
      this.ctx.canvas.width = this.L * cols;
      this.ctx.canvas.height = this.L * rows;
      this.needsBaseUpdate = true;
    }
  }

  /**
   * 判断两条蛇是否都准备好下一回合
   */
  checkSnakeReady() {
    for (const { directions, status } of this.snakes) {
      if (status !== 'idle' || !directions.length)
        return false;
    }
    const [{ directions: { length: l1 } }, { directions: { length: l2 } }] = this.snakes;
    return l1 === l2;
  }

  /**
   * 让两条蛇进入下一回合
   */
  nextStep() {
    for (const snake of this.snakes)
      snake.updateNextStep();
  }

  renderBaseCanvas() {
    if (!this.baseCtx)
      return;
    const { ctx, L, cols, rows } = this;

    const { height, width } = ctx.canvas;
    this.baseCtx.canvas.width = width;
    this.baseCtx.canvas.height = height;

    this.baseCtx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.baseCtx.fillStyle = ((r + c) & 1) === 0
          ? COLOR_EVEN
          : COLOR_ODD;
        this.baseCtx.fillRect(c * L, r * L, L, L);
      }
    }
    // 画墙
    this.walls.forEach(wall => wall.render(this.baseCtx!));
  }

  beforeDestroy() {
    this.recordFn?.pause();
    this.task?.pause();
  }
}
