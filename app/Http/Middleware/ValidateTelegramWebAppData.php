<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateTelegramWebAppData
{
    public function handle(Request $request, Closure $next): Response
    {
        $initData = $request->header('X-Telegram-Init-Data') ?? $request->input('initData');

        if (!$initData) {
            return response()->json(['error' => 'Telegram init data required'], 401);
        }

        if (!$this->validateTelegramData($initData)) {
            return response()->json(['error' => 'Invalid Telegram signature'], 401);
        }

        return $next($request);
    }

    private function validateTelegramData(string $initData): bool
    {
        $botToken = config('services.telegram.bot_token');
        if (!$botToken) {
            return false;
        }

        parse_str($initData, $data);
        $hash = $data['hash'] ?? '';
        unset($data['hash']);

        ksort($data);
        $dataCheckString = http_build_query($data);
        $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
        $calculatedHash = bin2hex(hash_hmac('sha256', $dataCheckString, $secretKey, true));

        return hash_equals($calculatedHash, $hash);
    }
}

