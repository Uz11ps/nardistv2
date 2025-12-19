<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'telegram_id',
        'username',
        'first_name',
        'last_name',
        'avatar_url',
        'balance',
        'rating',
        'level',
        'xp',
        'referral_code',
        'referred_by',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    protected $hidden = [
        'remember_token',
    ];

    public function gamesAsWhite()
    {
        return $this->hasMany(Game::class, 'white_player_id');
    }

    public function gamesAsBlack()
    {
        return $this->hasMany(Game::class, 'black_player_id');
    }

    public function generateReferralCode(): string
    {
        do {
            $code = strtoupper(substr(md5($this->telegram_id . time()), 0, 8));
        } while (self::where('referral_code', $code)->exists());

        return $code;
    }
}

