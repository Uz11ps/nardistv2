<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Services\GameService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    public function __construct(
        private GameService $gameService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $status = $request->query('status', 'active');

        $games = Game::where(function ($query) use ($user) {
            $query->where('white_player_id', $user->id)
                  ->orWhere('black_player_id', $user->id);
        })
        ->where('status', $status)
        ->with(['whitePlayer', 'blackPlayer', 'currentTurnPlayer'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($games);
    }

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        $type = $request->input('type', 'short');

        $game = $this->gameService->createGame($user, $type);

        return response()->json($game->load(['whitePlayer', 'blackPlayer']), 201);
    }

    public function show(Game $game): JsonResponse
    {
        $user = Auth::user();
        
        if ($game->white_player_id !== $user->id && $game->black_player_id !== $user->id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $game->load(['whitePlayer', 'blackPlayer', 'currentTurnPlayer']);
        return response()->json($game);
    }

    public function join(Game $game): JsonResponse
    {
        $user = Auth::user();

        if ($this->gameService->joinGame($game, $user)) {
            return response()->json($game->fresh()->load(['whitePlayer', 'blackPlayer']));
        }

        return response()->json(['error' => 'Cannot join game'], 400);
    }

    public function rollDice(Game $game): JsonResponse
    {
        $user = Auth::user();

        if ($game->white_player_id !== $user->id && $game->black_player_id !== $user->id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        if ($game->current_turn_user_id !== $user->id) {
            return response()->json(['error' => 'Not your turn'], 403);
        }

        $dice = $this->gameService->rollDice($game);

        return response()->json(['dice' => $dice, 'game' => $game->fresh()]);
    }

    public function makeMove(Request $request, Game $game): JsonResponse
    {
        $user = Auth::user();

        if ($game->white_player_id !== $user->id && $game->black_player_id !== $user->id) {
            return response()->json(['error' => 'Access denied'], 403);
        }

        $move = $request->input('move');

        if ($this->gameService->makeMove($game, $user, $move)) {
            return response()->json($game->fresh()->load(['whitePlayer', 'blackPlayer', 'currentTurnPlayer']));
        }

        return response()->json(['error' => 'Invalid move'], 400);
    }
}

