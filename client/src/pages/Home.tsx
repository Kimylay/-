import { use2048 } from '@/hooks/use2048';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Pause } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getBestMove } from '@/lib/ai2048';

/**
 * 2048 游戏主页面
 * 设计风格：极简主义 + 玻璃态
 * - 深蓝色背景，玻璃态卡片效果
 * - 彩虹渐变数字映射
 * - 流畅的动画和微交互
 */

export default function Home() {
  const gameState = use2048();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 获取数字对应的颜色
  const getTileColor = (value: number): string => {
    const colorMap: { [key: number]: string } = {
      2: 'from-blue-400 to-blue-500',
      4: 'from-cyan-400 to-cyan-500',
      8: 'from-green-400 to-green-500',
      16: 'from-yellow-400 to-yellow-500',
      32: 'from-orange-400 to-orange-500',
      64: 'from-red-400 to-red-500',
      128: 'from-purple-400 to-purple-500',
      256: 'from-pink-400 to-pink-500',
      512: 'from-indigo-400 to-indigo-500',
      1024: 'from-violet-400 to-violet-500',
      2048: 'from-amber-300 to-amber-500',
    };

    // 对于大于2048的数字，使用彩虹渐变
    if (value > 2048) {
      return 'from-rose-400 via-purple-400 to-blue-400';
    }

    return colorMap[value] || 'from-gray-400 to-gray-500';
  };

  // 获取文字颜色
  const getTextColor = (value: number): string => {
    return value <= 4 ? 'text-gray-800' : 'text-white';
  };

  // 处理方向键和 WASD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // AI 自动化游戏
  useEffect(() => {
    if (!isAutoPlaying || gameState.isGameOver) {
      setIsAutoPlaying(false);
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
      return;
    }

    autoPlayIntervalRef.current = setInterval(() => {
      const bestMove = getBestMove(gameState.tiles);
      if (bestMove) {
        gameState.move(bestMove);
      }
    }, 150);

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, [isAutoPlaying, gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white text-center mb-2 font-poppins">2048</h1>
          <p className="text-center text-blue-200 text-sm">向上、向下、向左或向右移动，合并相同的数字</p>
        </div>

        {/* 分数显示 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-lg">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">分数</p>
            <p className="text-3xl font-bold text-white font-poppins">{gameState.score}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-lg">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">最高分</p>
            <p className="text-3xl font-bold text-white font-poppins">{gameState.bestScore}</p>
          </div>
        </div>

        {/* 游戏板 */}
        <div
          ref={gameContainerRef}
          className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-2xl mb-6"
        >
          <div className="grid grid-cols-4 gap-3 aspect-square">
            {Array.from({ length: 16 }).map((_, index) => {
              const x = index % 4;
              const y = Math.floor(index / 4);
              const tile = gameState.tiles.find(t => t.x === x && t.y === y);

              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden"
                >
                  {tile && (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${getTileColor(tile.value)} flex items-center justify-center transition-all duration-300 ${
                        tile.isNew ? 'animate-in fade-in scale-75' : ''
                      } ${tile.isMerged ? 'animate-in scale-110' : ''}`}
                      style={{
                        animation: tile.isNew ? 'scaleIn 0.3s ease-out' : tile.isMerged ? 'mergePulse 0.3s ease-out' : 'none',
                      }}
                    >
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                      <span className={`text-2xl font-bold font-poppins relative z-10 ${getTextColor(tile.value)}`}>
                        {tile.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 游戏状态提示 */}
        {(gameState.isGameOver || gameState.isWon) && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 mb-6 text-center">
            {gameState.isWon && !gameState.isGameOver && (
              <p className="text-lg font-semibold text-yellow-300">🎉 恭喜！你达到了 2048！</p>
            )}
            {gameState.isGameOver && (
              <p className="text-lg font-semibold text-red-300">💔 游戏结束！无法继续移动。</p>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => gameState.initGame()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            新游戏
          </Button>
          <Button
            onClick={() => {
              if (gameState.isGameOver) {
                gameState.initGame();
                setIsAutoPlaying(true);
              } else {
                setIsAutoPlaying(!isAutoPlaying);
              }
            }}
            className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
              isAutoPlaying
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            } text-white`}
          >
            {isAutoPlaying ? (
              <>
                <Pause size={18} />
                暂停
              </>
            ) : (
              <>
                <Play size={18} />
                AI 自动
              </>
            )}
          </Button>
        </div>

        {/* 操作提示 */}
        <div className="text-center text-blue-300 text-xs">
          <p>使用 ↑↓←→ 或 WASD 键移动</p>
          <p className="mt-1 text-blue-400">移动次数: {gameState.moveCount}</p>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes mergePulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 400;
          src: url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
        }

        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
    </div>
  );
}
