<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'status',
        'white_player_id',
        'black_player_id',
        'current_turn_user_id',
        'board_state',
        'dice',
        'dice_history',
        'moves_history',
        'white_score',
        'black_score',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'board_state' => 'array',
        'dice' => 'array',
        'dice_history' => 'array',
        'moves_history' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function whitePlayer()
    {
        return $this->belongsTo(User::class, 'white_player_id');
    }

    public function blackPlayer()
    {
        return $this->belongsTo(User::class, 'black_player_id');
    }

    public function currentTurnPlayer()
    {
        return $this->belongsTo(User::class, 'current_turn_user_id');
    }

    public function getInitialBoardState(): array
    {
        return [
            'points' => array_fill(0, 24, 0),
            'bar' => ['white' => 0, 'black' => 0],
            'bear_off' => ['white' => 0, 'black' => 0],
        ];
    }
}

