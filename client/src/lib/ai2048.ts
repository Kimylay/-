import { Tile } from '@/hooks/use2048';

/**
 * 2048 AI 算法
 * 使用启发式评估和 minimax 算法的变体来找到最优移动
 */

interface GameGrid {
  tiles: Tile[];
}

// 评估函数权重
const WEIGHTS = {
  monotonicity: 47.0,
  smoothness: 47.0,
  emptyTiles: 270.0,
  maxTile: 11.0,
};

/**
 * 获取网格的 4x4 矩阵表示
 */
function getGridMatrix(tiles: Tile[]): number[][] {
  const grid: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
  tiles.forEach(tile => {
    grid[tile.y][tile.x] = tile.value;
  });
  return grid;
}

/**
 * 计算单调性得分（倾向于一个方向）
 */
function calculateMonotonicity(grid: number[][]): number {
  let score = 0;

  // 水平单调性
  for (let y = 0; y < 4; y++) {
    let current = 0;
    let inc = 0;
    for (let x = 0; x < 4; x++) {
      if (grid[y][x] !== 0) {
        if (current === 0) {
          current = grid[y][x];
        } else if (current > grid[y][x]) {
          inc += 1;
        } else {
          inc -= 1;
        }
        current = grid[y][x];
      }
    }
    score += inc;
  }

  // 垂直单调性
  for (let x = 0; x < 4; x++) {
    let current = 0;
    let inc = 0;
    for (let y = 0; y < 4; y++) {
      if (grid[y][x] !== 0) {
        if (current === 0) {
          current = grid[y][x];
        } else if (current > grid[y][x]) {
          inc += 1;
        } else {
          inc -= 1;
        }
        current = grid[y][x];
      }
    }
    score += inc;
  }

  return score;
}

/**
 * 计算平滑性得分（相邻方块差异小）
 */
function calculateSmoothness(grid: number[][]): number {
  let score = 0;

  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (grid[y][x] !== 0) {
        const value = Math.log2(grid[y][x]);

        // 右边
        if (x < 3 && grid[y][x + 1] !== 0) {
          score -= Math.abs(value - Math.log2(grid[y][x + 1]));
        }

        // 下边
        if (y < 3 && grid[y + 1][x] !== 0) {
          score -= Math.abs(value - Math.log2(grid[y + 1][x]));
        }
      }
    }
  }

  return score;
}

/**
 * 计算空方块数量
 */
function countEmptyTiles(grid: number[][]): number {
  let count = 0;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (grid[y][x] === 0) count++;
    }
  }
  return count;
}

/**
 * 获取最大方块值
 */
function getMaxTile(grid: number[][]): number {
  let max = 0;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      max = Math.max(max, grid[y][x]);
    }
  }
  return max;
}

/**
 * 评估网格状态
 */
function evaluateGrid(grid: number[][]): number {
  const monotonicity = calculateMonotonicity(grid);
  const smoothness = calculateSmoothness(grid);
  const emptyTiles = countEmptyTiles(grid);
  const maxTile = Math.log2(Math.max(getMaxTile(grid), 2));

  return (
    WEIGHTS.monotonicity * monotonicity +
    WEIGHTS.smoothness * smoothness +
    WEIGHTS.emptyTiles * emptyTiles +
    WEIGHTS.maxTile * maxTile
  );
}

/**
 * 模拟移动（不修改原始数据）
 */
function simulateMove(
  tiles: Tile[],
  direction: 'up' | 'down' | 'left' | 'right'
): { tiles: Tile[]; score: number } {
  let newTiles = JSON.parse(JSON.stringify(tiles)) as Tile[];
  const grid: (Tile | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));

  newTiles.forEach(tile => {
    grid[tile.y][tile.x] = tile;
  });

  let scoreIncrease = 0;

  if (direction === 'left' || direction === 'right') {
    for (let y = 0; y < 4; y++) {
      const row = grid[y].filter(tile => tile !== null) as Tile[];
      const merged = mergeRow(row, direction === 'right');

      grid[y] = Array(4).fill(null);
      if (direction === 'right') {
        merged.forEach((tile, index) => {
          tile.x = 4 - 1 - index;
          grid[y][tile.x] = tile;
        });
      } else {
        merged.forEach((tile, index) => {
          tile.x = index;
          grid[y][tile.x] = tile;
        });
      }
    }
  } else {
    for (let x = 0; x < 4; x++) {
      const column = grid.map(row => row[x]).filter(tile => tile !== null) as Tile[];
      const merged = mergeRow(column, direction === 'down');

      for (let y = 0; y < 4; y++) {
        grid[y][x] = null;
      }

      if (direction === 'down') {
        merged.forEach((tile, index) => {
          tile.y = 4 - 1 - index;
          grid[tile.y][x] = tile;
        });
      } else {
        merged.forEach((tile, index) => {
          tile.y = index;
          grid[tile.y][x] = tile;
        });
      }
    }
  }

  // 计算分数增加
  newTiles = grid.flat().filter(tile => tile !== null) as Tile[];
  newTiles.forEach(tile => {
    if (tile.isMerged) {
      scoreIncrease += tile.value;
      tile.isMerged = false;
    }
  });

  return { tiles: newTiles, score: scoreIncrease };
}

/**
 * 合并行/列
 */
function mergeRow(tiles: Tile[], reverse = false): Tile[] {
  if (reverse) tiles.reverse();

  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i].value === tiles[i + 1].value) {
      tiles[i].value *= 2;
      tiles[i].isMerged = true;
      tiles.splice(i + 1, 1);
    }
  }

  if (reverse) tiles.reverse();
  return tiles;
}

/**
 * 检查是否可以移动
 */
function canMove(tiles: Tile[], direction: 'up' | 'down' | 'left' | 'right'): boolean {
  const result = simulateMove(tiles, direction);
  return result.tiles.some((tile, index) => 
    tile.x !== tiles[index].x || tile.y !== tiles[index].y
  );
}

/**
 * 获取最佳移动方向
 */
export function getBestMove(tiles: Tile[]): 'up' | 'down' | 'left' | 'right' | null {
  const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
  let bestScore = -Infinity;
  let bestMove: 'up' | 'down' | 'left' | 'right' | null = null;

  for (const direction of directions) {
    if (!canMove(tiles, direction)) continue;

    const result = simulateMove(tiles, direction);
    const grid = getGridMatrix(result.tiles);
    const score = evaluateGrid(grid);

    if (score > bestScore) {
      bestScore = score;
      bestMove = direction;
    }
  }

  return bestMove;
}

/**
 * 获取所有可能的移动
 */
export function getPossibleMoves(tiles: Tile[]): ('up' | 'down' | 'left' | 'right')[] {
  const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
  return directions.filter(dir => canMove(tiles, dir));
}
