import { useState, useCallback, useEffect } from 'react';

export interface Tile {
  id: number;
  value: number;
  x: number;
  y: number;
  isNew?: boolean;
  isMerged?: boolean;
}

interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  isGameOver: boolean;
  isWon: boolean;
  moveCount: number;
}

const GRID_SIZE = 4;
const WINNING_TILE = 2048;

export function use2048() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const bestScore = parseInt(localStorage.getItem('bestScore2048') || '0', 10);
    return {
      tiles: [],
      score: 0,
      bestScore,
      isGameOver: false,
      isWon: false,
      moveCount: 0,
    };
  });

  // 初始化游戏
  const initGame = useCallback(() => {
    const newTiles: Tile[] = [];
    let id = 0;

    // 添加两个初始方块
    for (let i = 0; i < 2; i++) {
      const tile = generateNewTile(id++, []);
      newTiles.push(tile);
    }

    setGameState({
      tiles: newTiles,
      score: 0,
      bestScore: gameState.bestScore,
      isGameOver: false,
      isWon: false,
      moveCount: 0,
    });
  }, [gameState.bestScore]);

  // 生成新方块
  const generateNewTile = (id: number, existingTiles: Tile[]): Tile => {
    let x: number = 0;
    let y: number = 0;
    let isValid = false;

    while (!isValid) {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      isValid = !existingTiles.some(tile => tile.x === x && tile.y === y);
    }

    return {
      id,
      value: Math.random() < 0.9 ? 2 : 4,
      x,
      y,
      isNew: true,
    };
  };

  // 检查是否可以移动
  const canMove = useCallback((tiles: Tile[], direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    const moved = moveTiles(tiles, direction, true);
    return moved.some((tile, index) => 
      tile.x !== tiles[index].x || tile.y !== tiles[index].y
    );
  }, []);

  // 移动方块
  const moveTiles = (tiles: Tile[], direction: 'up' | 'down' | 'left' | 'right', checkOnly = false): Tile[] => {
    let newTiles = JSON.parse(JSON.stringify(tiles)) as Tile[];
    const grid: (Tile | null)[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

    // 填充网格
    newTiles.forEach(tile => {
      grid[tile.y][tile.x] = tile;
    });

    // 根据方向移动
    if (direction === 'left' || direction === 'right') {
      for (let y = 0; y < GRID_SIZE; y++) {
        const row = grid[y].filter(tile => tile !== null) as Tile[];
        const merged = mergeRow(row, direction === 'right');
        
        grid[y] = Array(GRID_SIZE).fill(null);
        if (direction === 'right') {
          merged.forEach((tile, index) => {
            tile.x = GRID_SIZE - 1 - index;
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
      for (let x = 0; x < GRID_SIZE; x++) {
        const column = grid.map(row => row[x]).filter(tile => tile !== null) as Tile[];
        const merged = mergeRow(column, direction === 'down');
        
        for (let y = 0; y < GRID_SIZE; y++) {
          grid[y][x] = null;
        }
        
        if (direction === 'down') {
          merged.forEach((tile, index) => {
            tile.y = GRID_SIZE - 1 - index;
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

    newTiles = grid.flat().filter(tile => tile !== null) as Tile[];
    return newTiles;
  };

  // 合并行/列
  const mergeRow = (tiles: Tile[], reverse = false): Tile[] => {
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
  };

  // 处理移动
  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setGameState(prevState => {
      if (prevState.isGameOver || prevState.isWon) return prevState;

      const newTiles = moveTiles(prevState.tiles, direction);
      
      // 检查是否有移动
      const hasMoved = newTiles.some((tile, index) => 
        tile.x !== prevState.tiles[index].x || tile.y !== prevState.tiles[index].y
      );

      if (!hasMoved) return prevState;

      // 计算新分数
      let scoreIncrease = 0;
      newTiles.forEach(tile => {
        if (tile.isMerged) {
          scoreIncrease += tile.value;
          tile.isMerged = false;
        }
      });

      const newScore = prevState.score + scoreIncrease;
      const newBestScore = Math.max(newScore, prevState.bestScore);

      // 生成新方块
      let tilesWithNew = [...newTiles];
      const maxId = newTiles.length > 0 ? Math.max(...newTiles.map(t => t.id)) : 0;
      const newTile = generateNewTile(maxId + 1, newTiles);
      tilesWithNew.push(newTile);

      // 检查游戏是否结束或获胜
      let isWon = prevState.isWon || newTiles.some(tile => tile.value >= WINNING_TILE);
      let isGameOver = false;

      if (!isWon) {
        // 检查是否还有可移动的空间
        const hasEmptySpace = tilesWithNew.length < GRID_SIZE * GRID_SIZE;
        const canMoveUp = hasEmptySpace || canMove(tilesWithNew, 'up');
        const canMoveDown = hasEmptySpace || canMove(tilesWithNew, 'down');
        const canMoveLeft = hasEmptySpace || canMove(tilesWithNew, 'left');
        const canMoveRight = hasEmptySpace || canMove(tilesWithNew, 'right');

        isGameOver = !canMoveUp && !canMoveDown && !canMoveLeft && !canMoveRight;
      }

      if (newBestScore !== prevState.bestScore) {
        localStorage.setItem('bestScore2048', newBestScore.toString());
      }

      return {
        tiles: tilesWithNew,
        score: newScore,
        bestScore: newBestScore,
        isGameOver,
        isWon,
        moveCount: prevState.moveCount + 1,
      };
    });
  }, [canMove]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const directionMap: { [key: string]: 'up' | 'down' | 'left' | 'right' } = {
        'arrowup': 'up',
        'arrowdown': 'down',
        'arrowleft': 'left',
        'arrowright': 'right',
        'w': 'up',
        's': 'down',
        'a': 'left',
        'd': 'right',
      };

      if (directionMap[key]) {
        e.preventDefault();
        move(directionMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move]);

  // 初始化游戏
  useEffect(() => {
    initGame();
  }, []);

  return {
    ...gameState,
    move,
    initGame,
  };
}
