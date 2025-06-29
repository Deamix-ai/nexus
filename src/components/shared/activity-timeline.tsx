"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, Clock, MessageSquare, Phone, Mail, FileText, CheckCircle } from "lucide-react";

interface Activity {
  id: string;
  type: 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'STAGE_CHANGE' | 'DOCUMENT' | 'TASK';
  title: string;
  description?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  projectId: string;
  clientId?: string;
}

const activityIcons = {
  NOTE: MessageSquare,
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
  STAGE_CHANGE: CheckCircle,
  DOCUMENT: FileText,
  TASK: Clock,
};

const activityColors = {
  NOTE: 'bg-blue-100 text-blue-600',
  CALL: 'bg-green-100 text-green-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  MEETING: 'bg-orange-100 text-orange-600',
  STAGE_CHANGE: 'bg-emerald-100 text-emerald-600',
  DOCUMENT: 'bg-gray-100 text-gray-600',
  TASK: 'bg-yellow-100 text-yellow-600',
};

export default function ActivityTimeline({ projectId, clientId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'NOTE' as Activity['type'],
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchActivities();
  }, [projectId, clientId]);

  const fetchActivities = async () => {
    try {
      const url = projectId 
        ? `/api/projects/${projectId}/activities`
        : `/api/clients/${clientId}/activities`;
      
      // For now, return mock data
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'STAGE_CHANGE',
          title: 'Project stage updated to Survey Complete',
          description: 'Survey completed and measurements taken',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: '1', name: 'James Smith' },
        },
        {
          id: '2',
          type: 'CALL',
          title: 'Follow-up call with client',
          description: 'Discussed survey findings and next steps for design phase',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: '1', name: 'James Smith' },
        },
        {
          id: '3',
          type: 'EMAIL',
          title: 'Design consultation scheduled',
          description: 'Sent calendar invitation for design presentation meeting',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: '1', name: 'James Smith' },
        },
        {
          id: '4',
          type: 'NOTE',
          title: 'Client preferences noted',
          description: 'Client prefers contemporary style, high-end fixtures, accessible design features',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: { id: '1', name: 'James Smith' },
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) return;

    try {
      const url = projectId 
        ? `/api/projects/${projectId}/activities`
        : `/api/clients/${clientId}/activities`;

      // For now, just add to local state
      const activity: Activity = {
        id: Date.now().toString(),
        type: newActivity.type,
        title: newActivity.title,
        description: newActivity.description,
        createdAt: new Date().toISOString(),
        createdBy: { id: 'current-user', name: 'Current User' },
      };

      setActivities(prev => [activity, ...prev]);
      setNewActivity({ type: 'NOTE', title: '', description: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-GB');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Timeline</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            Add Activity
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
            <div className="flex space-x-2">
              <select
                value={newActivity.type}
                onChange={(e) => setNewActivity(prev => ({ ...prev, type: e.target.value as Activity['type'] }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="NOTE">Note</option>
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Meeting</option>
                <option value="DOCUMENT">Document</option>
                <option value="TASK">Task</option>
              </select>
              <Input
                placeholder="Activity title"
                value={newActivity.title}
                onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1"
              />
            </div>
            <Textarea
              placeholder="Description (optional)"
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddActivity}>
                Add Activity
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const IconComponent = activityIcons[activity.type];
              return (
                <div key={activity.id} className="relative">
                  {index < activities.length - 1 && (
                    <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                  )}
                  <div className="flex space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${activityColors[activity.type]}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        {activity.createdBy.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No activities yet. Add the first activity to get started.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
