<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $initData = $request->header('X-Telegram-Init-Data') ?? $request->input('initData');
        
        if (!$initData) {
            return response()->json(['error' => 'Telegram init data required'], 401);
        }

        parse_str($initData, $data);
        $userData = json_decode($data['user'] ?? '{}', true);

        if (empty($userData['id'])) {
            return response()->json(['error' => 'Invalid user data'], 401);
        }

        $user = User::firstOrCreate(
            ['telegram_id' => $userData['id']],
            [
                'username' => $userData['username'] ?? null,
                'first_name' => $userData['first_name'] ?? null,
                'last_name' => $userData['last_name'] ?? null,
                'referral_code' => $this->generateReferralCode($userData['id']),
            ]
        );

        $token = $user->createToken('telegram-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    private function generateReferralCode(int $telegramId): string
    {
        do {
            $code = strtoupper(substr(md5($telegramId . time() . Str::random(8)), 0, 8));
        } while (User::where('referral_code', $code)->exists());

        return $code;
    }
}

