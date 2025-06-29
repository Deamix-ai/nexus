"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface StageProgressionProps {
  currentStage: string;
  projectId: string;
  onStageChange?: (newStage: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'ENQUIRY', label: 'Enquiry', description: 'Initial customer enquiry' },
  { key: 'ENGAGED_ENQUIRY', label: 'Engaged Enquiry', description: 'Customer engaged with enquiry' },
  { key: 'CONSULTATION_BOOKED', label: 'Consultation Booked', description: 'Consultation appointment scheduled' },
  { key: 'QUALIFIED_LEAD', label: 'Qualified Lead', description: 'Lead has been qualified' },
  { key: 'SURVEY_COMPLETE', label: 'Survey Complete', description: 'Site survey completed' },
  { key: 'DESIGN_PRESENTED', label: 'Design Presented', description: 'Design proposal presented' },
  { key: 'SALE_CLIENT_COMMITS', label: 'Sale - Client Commits', description: 'Client committed to purchase' },
  { key: 'DESIGN_SIGN_OFF', label: 'Design Sign Off', description: 'Final design approved' },
  { key: 'PAYMENT_75_PROJECT_HANDOVER', label: 'Payment 75% & Project Handover', description: '75% payment received' },
  { key: 'PROJECT_SCHEDULED', label: 'Project Scheduled', description: 'Installation scheduled' },
  { key: 'INSTALLATION_IN_PROGRESS', label: 'Installation in Progress', description: 'Installation underway' },
  { key: 'COMPLETION_SIGN_OFF', label: 'Completion Sign Off', description: 'Installation completed' },
  { key: 'COMPLETED', label: 'Completed', description: 'Project fully completed' },
];

const LOST_STAGES = [
  { key: 'LOST_NOT_PROCEEDING', label: 'Lost - Not Proceeding', description: 'Project lost/cancelled' },
];

const getStageIndex = (stage: string) => {
  return PIPELINE_STAGES.findIndex(s => s.key === stage);
};

const canProgressTo = (currentStage: string, targetStage: string) => {
  const currentIndex = getStageIndex(currentStage);
  const targetIndex = getStageIndex(targetStage);
  
  // Can't go backwards more than 1 stage
  if (targetIndex < currentIndex - 1) return false;
  
  // Can't skip more than 1 stage forward
  if (targetIndex > currentIndex + 1) return false;
  
  return true;
};

export default function StageProgression({ currentStage, projectId, onStageChange }: StageProgressionProps) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = getStageIndex(currentStage);

  const handleStageChange = async (newStage: string) => {
    if (newStage === currentStage) return;

    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stage');
      }

      onStageChange?.(newStage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
    } finally {
      setUpdating(false);
    }
  };

  const getStageStatus = (stageIndex: number) => {
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Pipeline</span>
          {error && (
            <span className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Progress */}
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, index) => {
            const status = getStageStatus(index);
            const canProgress = canProgressTo(currentStage, stage.key);
            
            return (
              <div key={stage.key} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStageIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        status === 'current' ? 'text-blue-600' : 
                        status === 'completed' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-gray-500">{stage.description}</p>
                    </div>
                    {status !== 'current' && canProgress && (
                      <Button
                        size="sm"
                        variant={status === 'completed' ? 'outline' : 'default'}
                        onClick={() => handleStageChange(stage.key)}
                        disabled={updating}
                        className="text-xs"
                      >
                        {status === 'completed' ? 'Return' : 'Advance'}
                      </Button>
                    )}
                  </div>
                </div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Lost/Cancelled Option */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Mark as Lost/Cancelled</p>
              <p className="text-xs text-gray-500">This will remove the project from active pipeline</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStageChange('LOST_NOT_PROCEEDING')}
              disabled={updating || currentStage === 'LOST_NOT_PROCEEDING'}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Mark Lost
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            {currentIndex < PIPELINE_STAGES.length - 1 && (
              <Button
                size="sm"
                onClick={() => handleStageChange(PIPELINE_STAGES[currentIndex + 1].key)}
                disabled={updating}
              >
                Next Stage
              </Button>
            )}
            {currentIndex > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStageChange(PIPELINE_STAGES[currentIndex - 1].key)}
                disabled={updating}
              >
                Previous Stage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
