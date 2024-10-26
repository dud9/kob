import { Game } from './game';
import { Snake, type SnakeState } from './snake';
import { Wall } from './wall';

const COLOR_EVEN = '#C3944E';
const COLOR_ODD = '#A57332';

interface GameState {
  currentStep: number
  snakeStates: SnakeState[]
}

export class GameMap extends Game {
  private destroyed = false;

  L = 0;
  rows = 13;
  cols = 14;
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  needsBaseUpdate = true;

  walls: Wall[] = [];
  snakes: Snake[] = [
    new Snake({ id: 0, color: '#206CCF', r: this.rows - 2, c: 1 }, this),
    new Snake({ id: 1, color: '#CB272D', r: 1, c: this.cols - 2 }, this),
  ];

  task: NodeJS.Timeout | null = null;

  private lastStepTime: number = 0;
  private currentStep: number = 0;
  private stepInterval: number = 300;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;

  private gameState: GameState | null = null;

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
    if (this.destroyed)
      return; // 如果已销毁，不执行更新

    this.updateSize();
    const { isRecording } = useRecordStore();

    const fn = () => {
      if (this.checkSnakeReady()) {
        this.nextStep();
        return true;
      }
      if (this.task) {
        clearInterval(this.task);
        this.task = null;
      }
      return false;
    };

    if (isRecording) {
      fn();
    } else if (!this.task && fn()) {
      this.task = setInterval(fn, 100);
    }

    this.render();
  }

  private render() {
    if (this.destroyed)
      return; // 如果已销毁，不执行渲染

    const { ctx, baseCanvas } = this;

    // 确保基础层是最新的
    this.renderBase();

    // 清空当前画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制基础层
    ctx.drawImage(baseCanvas, 0, 0);

    // 绘制蛇
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
  }

  playRecord() {
    const { aSteps, bSteps } = useRecordStore();
    if (!aSteps || !bSteps)
      return;

    // 重置游戏状态
    this.currentStep = 0;
    this.lastStepTime = performance.now();
    this.isPlaying = true;

    // 在启动新的动画循环之前，取消旧的动画帧
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  // 保存游戏状态
  private saveGameState() {
    this.gameState = {
      currentStep: this.currentStep,
      snakeStates: this.snakes.map(snake => snake.getState()),
    };
  }

  // 恢复游戏状态
  private restoreGameState() {
    if (this.gameState) {
      this.currentStep = this.gameState.currentStep;
      this.snakes.forEach((snake, index) => {
        snake.setState(this.gameState!.snakeStates[index]);
      });
    }
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.saveGameState();

      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  resume() {
    if (!this.isPlaying) {
      this.restoreGameState();
      this.isPlaying = true;

      // 重置 lastStepTime 为当前时间戳
      this.lastStepTime = performance.now();

      // 在启动新的动画循环之前，取消旧的动画帧
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  private animate(currentTime: number) {
    if (!this.isPlaying)
      return;

    const { aSteps, bSteps, gameResult, setReplayFinished } = useRecordStore();
    if (!aSteps || !bSteps)
      return;

    const [snake0, snake1] = this.snakes;

    let deltaTime = currentTime - this.lastStepTime;

    // 限制 deltaTime 的最大值，防止动画跳跃
    const maxDeltaTime = this.stepInterval * 2; // 允许一次最多跳过2个间隔
    deltaTime = Math.min(deltaTime, maxDeltaTime);

    if (deltaTime >= this.stepInterval) {
      if (this.currentStep >= aSteps.length - 1) {
        if (['draw', 'playerBWon'].includes(gameResult))
          snake0.status = 'die';
        if (['draw', 'playerAWon'].includes(gameResult))
          snake1.status = 'die';
        this.isPlaying = false;
        setReplayFinished(true);

        // 游戏结束，取消动画帧
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }

        return;
      }

      snake0.setDirection(Number.parseInt(aSteps[this.currentStep]));
      snake1.setDirection(Number.parseInt(bSteps[this.currentStep]));

      this.currentStep++;
      this.lastStepTime = currentTime - (deltaTime % this.stepInterval);
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
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
    this.pause();
    if (this.task) {
      clearInterval(this.task);
      this.task = null;
    }
  }

  destroy() {
    this.destroyed = true;
    this.pause(); // 确保暂停动画
    // 添加调用 super.destroy()
    super.destroy();
  }
}
