import type { GameMap } from './map';
import { SnakeCell } from './snake-cell';

export interface SnakeInfo {
  id: number
  color: string
  r: number
  c: number
}

export interface SnakeState {
  cells: SnakeCell[]
  nextCell: SnakeCell | null
  directions: number[]
  status: SnakeStatus
  step: number
  eyeDirection: number
}

// idle 表示静止，move 表示正在移动，die 表示死亡
export type SnakeStatus = 'idle' | 'move' | 'die';

export class Snake {
  private id: number;
  private color: string;

  private cells: SnakeCell[];
  private nextCell: SnakeCell | null = null; // 下一步目标单元格

  private speed = 3; // 每秒走3个格子

  public directions: number[] = [];
  // 下一步的指令，移动的方向，
  // -1 为没有指令，0 | 1 | 2 | 3 - 上 | 右 | 下 | 左
  public status: SnakeStatus = 'idle';

  private dr = [-1, 0, 1, 0]; // 4 个方向行的偏移量
  private dc = [0, 1, 0, -1]; // 4 个方向列的偏移量

  private step = 0; // 当前回合数
  private eps = 1e-2; // 允许的误差
  private eyeDirection: number;

  private eyeDx: number[][] = [ // 蛇眼睛不同方向的 x 的偏移量
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ];

  private eyeDy: number[][] = [ // 蛇眼睛不同方向的 y 的偏移量
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1],
  ];

  constructor({ id, color, r, c }: SnakeInfo, public gameMap: GameMap) {
    this.id = id;
    this.color = color;
    this.gameMap = gameMap;
    // 存放蛇的身体，cells[0] 为头部
    this.cells = [new SnakeCell(r, c)];
    // 定义蛇头方向
    // 左下角的蛇初始朝上，右上角的蛇朝下
    this.eyeDirection = [2, 0][Number(id === 0)];
  }

  /**
   * 设置操作方向
   */
  public setDirection(d: number) {
    this.directions.push(d);
  }

  /**
   * 检查当前回合蛇的长度是否增加
   *  - 前十回合，每回合增加 1
   *  - 后面回合，每 3 回合增加 1
   */
  private checkTailIncreasing() {
    const { step } = this;
    return step <= 10 || (step % 3 === 1);
  }

  /**
   * 更新蛇的下一步状态
   */
  public updateNextStep() {
    const { directions, cells, dr, dc } = this;

    const d = directions[0];
    const { r, c } = cells[0]; // 蛇头 r, c
    const [nr, nc] = [r + dr[d], c + dc[d]]; // 下一步的坐标
    this.nextCell = new SnakeCell(nr, nc);

    // 更新蛇头方向
    this.eyeDirection = d;
    // 清空操作
    this.directions.shift();
    this.status = 'move';
    this.step++;

    // 将单元格往后移一位
    for (let i = cells.length; i > 0; i--)
      this.cells[i] = JSON.parse(JSON.stringify(this.cells[i - 1]));
  }

  private move() {
    const { speed, gameMap: { timeDelta }, nextCell, cells, eps } = this;
    const moveDistance = speed * timeDelta / 1000; // 每帧移动距离

    // 蛇头移动
    const head = cells[0];
    const [dx, dy] = [nextCell!.x - head.x, nextCell!.y - head.y];
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < eps) {
      // 到达目标位置
      cells[0] = nextCell!;
      this.nextCell = null;
      this.status = 'idle';

      if (!this.checkTailIncreasing()) {
        cells.pop();
      }
    } else {
      // 移动蛇头
      const moveRatio = moveDistance / distance;
      head.x += dx * moveRatio;
      head.y += dy * moveRatio;

      // 移动蛇身
      for (let i = 1; i < cells.length; i++) {
        const curr = cells[i];
        const prev = cells[i - 1];
        const [segDx, segDy] = [prev.x - curr.x, prev.y - curr.y];
        const segDistance = Math.sqrt(segDx * segDx + segDy * segDy);

        // 如果与前一节距离过大，则移动当前节
        if (segDistance > 1) {
          const targetDistance = 1; // 理想间距
          const segMoveRatio = (segDistance - targetDistance) / segDistance;
          curr.x += segDx * segMoveRatio;
          curr.y += segDy * segMoveRatio;
        }
      }

      // 特殊处理蛇尾
      if (!this.checkTailIncreasing()) {
        const tail = cells[cells.length - 1];
        const beforeTail = cells[cells.length - 2];
        const [tailDx, tailDy] = [beforeTail.x - tail.x, beforeTail.y - tail.y];
        const tailDistance = Math.sqrt(tailDx * tailDx + tailDy * tailDy);

        if (tailDistance > 1) {
          const tailMoveRatio = moveDistance / tailDistance;
          tail.x += tailDx * tailMoveRatio;
          tail.y += tailDy * tailMoveRatio;
        }
      }
    }
  }

  public render() {
    if (this.status === 'move') {
      this.move();
    }

    const { gameMap, color, cells, status, eyeDirection, eyeDx, eyeDy } = this;
    const { ctx, L } = gameMap;

    // 蛇的基本颜色
    const baseColor = status === 'die' ? ['#BEDAFF', '#FDCDC5'][Number(this.id === 1)] : color;

    // 绘制蛇身
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = L * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    cells.forEach(({ x, y }, index) => {
      if (index === 0) {
        ctx.moveTo(x * L, y * L);
      } else {
        ctx.lineTo(x * L, y * L);
      }
    });
    ctx.stroke();

    // 绘制蛇头
    const { x: headX, y: headY } = cells[0];
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(headX * L, headY * L, L / 2 * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // 绘制眼睛
    const eyeSize = L * 0.15;
    const eyeOffset = L * 0.2;
    for (let i = 0; i < 2; i++) {
      const eyeX = headX * L + eyeDx[eyeDirection][i] * eyeOffset;
      const eyeY = headY * L + eyeDy[eyeDirection][i] * eyeOffset;

      if (status === 'die') {
        // 死亡时眼睛变成 X
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        const crossSize = eyeSize * 0.7;
        ctx.beginPath();
        ctx.moveTo(eyeX - crossSize, eyeY - crossSize);
        ctx.lineTo(eyeX + crossSize, eyeY + crossSize);
        ctx.moveTo(eyeX + crossSize, eyeY - crossSize);
        ctx.lineTo(eyeX - crossSize, eyeY + crossSize);
        ctx.stroke();
      } else {
        // 正常眼睛
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        const pupilSize = eyeSize * 0.6;
        const pupilOffset = eyeSize * 0.2;
        const pupilX = eyeX + eyeDx[eyeDirection][i] * pupilOffset;
        const pupilY = eyeY + eyeDy[eyeDirection][i] * pupilOffset;

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pupilX - pupilSize * 0.3, pupilY - pupilSize * 0.3, pupilSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 绘制蛇尾（保持原样）
    if (cells.length > 1) {
      const { x: tailX, y: tailY } = cells[cells.length - 1];
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(tailX * L, tailY * L, L / 2 * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 只有在蛇活着时才添加动效
    if (status !== 'die') {
      this.addMovementEffect(ctx, L, baseColor);
    }
  }

  private addMovementEffect(ctx: CanvasRenderingContext2D, L: number, baseColor: string) {
    if (this.cells.length < 2) {
      // 如果蛇的长度小于2，只画一个圆，并确保绘制眼睛
      const { x, y } = this.cells[0];
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(x * L, y * L, L / 2, 0, Math.PI * 2);
      ctx.fill();

      // 绘制眼睛
      const eyeSize = L * 0.15;
      const eyeOffset = L * 0.2;
      for (let i = 0; i < 2; i++) {
        const eyeX = x * L + this.eyeDx[this.eyeDirection][i] * eyeOffset;
        const eyeY = y * L + this.eyeDy[this.eyeDirection][i] * eyeOffset;

        // 绘制眼白
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // 绘制瞳孔
        const pupilSize = eyeSize * 0.6;
        const pupilOffset = eyeSize * 0.2;
        const pupilX = eyeX + this.eyeDx[this.eyeDirection][i] * pupilOffset;
        const pupilY = eyeY + this.eyeDy[this.eyeDirection][i] * pupilOffset;

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        // 绘制眼睛高光
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(pupilX - pupilSize * 0.3, pupilY - pupilSize * 0.3, pupilSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const time = Date.now() / 1000;
    const waveAmplitude = L * 0.08;
    const waveFrequency = 3;

    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, L, L);
    gradient.addColorStop(0, this.adjustColor(baseColor, 20));
    gradient.addColorStop(1, this.adjustColor(baseColor, -20));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = L * 0.15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    for (let i = 0; i < this.cells.length; i++) {
      const { x, y } = this.cells[i];
      const waveOffset = Math.sin(time * waveFrequency + i * 0.5) * waveAmplitude;

      let angle;
      if (i === 0) {
        // 蛇头
        const nextCell = this.cells[1];
        angle = Math.atan2(nextCell.y - y, nextCell.x - x);
      } else if (i === this.cells.length - 1) {
        // 蛇尾
        const prevCell = this.cells[i - 1];
        angle = Math.atan2(y - prevCell.y, x - prevCell.x);
      } else {
        // 蛇身
        const prevCell = this.cells[i - 1];
        const nextCell = this.cells[i + 1];
        angle = Math.atan2(nextCell.y - prevCell.y, nextCell.x - prevCell.x);
      }

      const offsetX = Math.cos(angle + Math.PI / 2) * waveOffset;
      const offsetY = Math.sin(angle + Math.PI / 2) * waveOffset;

      if (i === 0) {
        ctx.moveTo(x * L + offsetX, y * L + offsetY);
      } else {
        ctx.lineTo(x * L + offsetX, y * L + offsetY);
      }
    }

    ctx.stroke();
  }

  private adjustColor(color: string, amount: number): string {
    const clamp = (num: number) => Math.min(255, Math.max(0, num));
    const hex = color.replace('#', '');
    const r = clamp(Number.parseInt(hex.substr(0, 2), 16) + amount);
    const g = clamp(Number.parseInt(hex.substr(2, 2), 16) + amount);
    const b = clamp(Number.parseInt(hex.substr(4, 2), 16) + amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getState(): SnakeState {
    return {
      cells: this.cells.map(cell => new SnakeCell(cell.r, cell.c)),
      nextCell: this.nextCell ? new SnakeCell(this.nextCell.r, this.nextCell.c) : null,
      directions: [...this.directions],
      status: this.status,
      step: this.step,
      eyeDirection: this.eyeDirection,
    };
  }

  // 恢复状态
  setState(state: SnakeState) {
    this.cells = state.cells.map(cell => new SnakeCell(cell.r, cell.c));
    this.nextCell = state.nextCell ? new SnakeCell(state.nextCell.r, state.nextCell.c) : null;
    this.directions = [...state.directions];
    this.status = state.status;
    this.step = state.step;
    this.eyeDirection = state.eyeDirection;
  }
}
