<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('telegram_id')->unique();
            $table->string('username')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('avatar_url')->nullable();
            $table->integer('balance')->default(1000); // NAR-coin стартовый баланс
            $table->integer('rating')->default(1000); // Elo рейтинг
            $table->integer('level')->default(1);
            $table->integer('xp')->default(0);
            $table->string('referral_code')->unique()->nullable();
            $table->bigInteger('referred_by')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index('telegram_id');
            $table->index('referral_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

