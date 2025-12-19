<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['short', 'long'])->default('short');
            $table->enum('status', ['waiting', 'active', 'finished', 'abandoned'])->default('waiting');
            $table->foreignId('white_player_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('black_player_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('current_turn_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->json('board_state'); // Состояние доски
            $table->json('dice')->nullable(); // Текущие кости
            $table->json('dice_history')->nullable(); // История бросков
            $table->json('moves_history')->nullable(); // История ходов
            $table->integer('white_score')->default(0);
            $table->integer('black_score')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index(['white_player_id', 'status']);
            $table->index(['black_player_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};

