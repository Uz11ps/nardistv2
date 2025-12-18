import { api } from './api';

export interface TrainingPosition {
  id: string;
  name: string;
  description: string;
  mode: 'SHORT' | 'LONG';
  gameState: any;
  optimalMoves: Array<{
    from: number;
    to: number;
    dieValue: number;
  }>;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface TrainingPositionsResponse {
  mode: 'SHORT' | 'LONG';
  positions: TrainingPosition[];
  total: number;
}

export interface MoveValidationResult {
  isOptimal: boolean;
  alternatives: Array<{
    from: number;
    to: number;
    dieValue: number;
  }>;
  explanation: string;
}

export interface TrainingStats {
  totalPositions: number;
  completedPositions: number;
  correctMoves: number;
  incorrectMoves: number;
  accuracy: number;
}

export const trainerService = {
  async getTrainingPositions(mode: 'SHORT' | 'LONG' = 'SHORT'): Promise<TrainingPositionsResponse> {
    const response = await api.get<TrainingPositionsResponse>(`/trainer/positions?mode=${mode}`);
    return response.data;
  },

  async getTrainingPosition(positionId: string): Promise<TrainingPosition> {
    const response = await api.get<TrainingPosition>(`/trainer/positions/${positionId}`);
    return response.data;
  },

  async validateMove(
    positionId: string,
    move: { from: number; to: number; dieValue: number },
  ): Promise<MoveValidationResult> {
    const response = await api.post<MoveValidationResult>(`/trainer/positions/${positionId}/validate`, move);
    return response.data;
  },

  async getTrainingStats(): Promise<TrainingStats> {
    const response = await api.get<TrainingStats>('/trainer/stats');
    return response.data;
  },
};

