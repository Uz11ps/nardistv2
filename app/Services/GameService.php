<?php

namespace App\Services;

use App\Models\Game;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GameService
{
    public function createGame(User $player, string $type = 'short'): Game
    {
        $boardState = $this->getInitialBoardState($type);

        return Game::create([
            'type' => $type,
            'status' => 'waiting',
            'white_player_id' => $player->id,
            'current_turn_user_id' => $player->id,
            'board_state' => $boardState,
            'dice_history' => [],
            'moves_history' => [],
        ]);
    }

    public function joinGame(Game $game, User $player): bool
    {
        if ($game->status !== 'waiting' || $game->white_player_id === $player->id) {
            return false;
        }

        $game->update([
            'black_player_id' => $player->id,
            'status' => 'active',
            'started_at' => now(),
        ]);

        return true;
    }

    public function rollDice(Game $game): array
    {
        $dice1 = random_int(1, 6);
        $dice2 = random_int(1, 6);
        
        $dice = $dice1 === $dice2 ? [$dice1, $dice1, $dice1, $dice1] : [$dice1, $dice2];

        $history = $game->dice_history ?? [];
        $history[] = [
            'dice' => $dice,
            'timestamp' => now()->toIso8601String(),
            'seed' => bin2hex(random_bytes(16)),
        ];

        $game->update([
            'dice' => $dice,
            'dice_history' => $history,
        ]);

        return $dice;
    }

    public function makeMove(Game $game, User $player, array $move): bool
    {
        if ($game->current_turn_user_id !== $player->id || $game->status !== 'active') {
            return false;
        }

        if (!$this->validateMove($game, $move)) {
            return false;
        }

        $boardState = $game->board_state;
        $this->applyMove($boardState, $move, $player->id === $game->white_player_id ? 'white' : 'black');

        $movesHistory = $game->moves_history ?? [];
        $movesHistory[] = [
            'player_id' => $player->id,
            'move' => $move,
            'timestamp' => now()->toIso8601String(),
        ];

        $nextPlayerId = $player->id === $game->white_player_id 
            ? $game->black_player_id 
            : $game->white_player_id;

        $game->update([
            'board_state' => $boardState,
            'moves_history' => $movesHistory,
            'current_turn_user_id' => $nextPlayerId,
            'dice' => null,
        ]);

        return true;
    }

    private function validateMove(Game $game, array $move): bool
    {
        // Базовая валидация - полная реализация правил нард требует больше логики
        if (empty($game->dice)) {
            return false;
        }

        return true;
    }

    private function applyMove(array &$boardState, array $move, string $color): void
    {
        // Базовая реализация перемещения фишек
        // Полная логика требует проверки всех правил нард
        if (isset($move['from']) && isset($move['to'])) {
            $from = $move['from'];
            $to = $move['to'];
            
            if (isset($boardState['points'][$from])) {
                $boardState['points'][$from]--;
                if (!isset($boardState['points'][$to])) {
                    $boardState['points'][$to] = 0;
                }
                $boardState['points'][$to]++;
            }
        }
    }

    private function getInitialBoardState(string $type): array
    {
        if ($type === 'short') {
            return [
                'points' => [
                    0 => 2,  // Белые на старте
                    5 => -5, // Черные
                    7 => -3, // Черные
                    11 => 5, // Белые
                    12 => -5, // Черные
                    16 => 3,  // Белые
                    18 => -5, // Черные
                    23 => -2, // Черные
                ],
                'bar' => ['white' => 0, 'black' => 0],
                'bear_off' => ['white' => 0, 'black' => 0],
            ];
        }

        // Длинные нарды
        return [
            'points' => [
                0 => 15,  // Белые
                12 => -15, // Черные
            ],
            'bar' => ['white' => 0, 'black' => 0],
            'bear_off' => ['white' => 0, 'black' => 0],
        ];
    }
}

