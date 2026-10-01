export type UserRole = 'operator' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatarText?: string;
  department?: string;
}

export interface MachineSettings {
  conveyorSpeed?: number; // %
  guideRailWidth?: number; // mm
  cappingTorque?: number; // Nm
  sensorHeight?: number; // mm
}

export interface ChangeoverContext {
  productionLine: string;
  machine: string;
  sourceFormat: string;
  targetFormat: string;
  product: string;
  operatorObservation?: string;
  previousSettings?: MachineSettings;
  machineCondition?: 'Optimal' | 'Minor Wear' | 'Maintenance Due' | 'Vibration Reported';
}

export interface ParameterRecommendation {
  parameterName: string;
  recommendedValue: string | number;
  recommendedRange: string;
  unit: string;
  reason: string;
  supportedByCount: number;
}

export interface GroundedRecommendation {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  riskReason: string;
  recommendedParameters: ParameterRecommendation[];
  reasoningText: string;
  recalledExperiences: ChangeoverExperience[];
  hasSufficientEvidence: boolean;
  confidenceScore: number; // 0 - 100
}

export interface ChangeoverResult {
  actualConveyorSpeed?: number;
  actualGuideRailWidth?: number;
  actualCappingTorque?: number;
  actualSensorHeight?: number;
  changeoverTimeMinutes: number;
  downtimeMinutes: number;
  scrapPercentage: number;
  outcome: 'Successful' | 'Failed';
  operatorNotes: string;
}

export interface ChangeoverExperience {
  id: string;
  timestamp: string; // ISO String
  operatorName: string;
  operatorId: string;
  context: ChangeoverContext;
  recommendationGiven?: {
    riskLevel: string;
    conveyorSpeedRec?: string;
  };
  actualResult: ChangeoverResult;
  similarityScore?: number; // 0 - 100 percentage match
}
