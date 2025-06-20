// Types for Goals Management components

export interface PlanStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface Goal {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  planSteps: PlanStep[];
  // reflection?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

export interface GoalFormProps {
  goal: Goal;
  setGoal: React.Dispatch<React.SetStateAction<Goal>>;
  handleSaveGoal: () => Promise<void>;
  newStep: string;
  setNewStep: React.Dispatch<React.SetStateAction<string>>;
  handleAddStep: () => void;
  handleRemoveStep: (stepId: string) => void;
  isSaving: boolean;
}

export interface GoalListProps {
  goals: Goal[];
  expandedGoal: string | null;
  setExpandedGoal: React.Dispatch<React.SetStateAction<string | null>>;
  handleUpdateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  handleDeleteGoal: (goalId: string) => Promise<void>;
}

export interface GoalItemProps {
  goal: Goal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<Goal>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export interface StepItemProps {
  step: PlanStep;
  onToggleComplete: () => void;
}

export interface StepListProps {
  steps: PlanStep[];
  onToggleComplete: (stepId: string) => void;
}

export interface StatusSelectorProps {
  currentStatus: GoalStatus;
  onStatusChange: (status: GoalStatus) => void;
}