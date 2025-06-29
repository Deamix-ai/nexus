"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";

const projectEditSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'CANCELLED', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedValue: z.number().min(0).optional(),
  consultationDate: z.string().optional(),
  surveyDate: z.string().optional(),
  scheduledStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type ProjectEditForm = z.infer<typeof projectEditSchema>;

interface Project {
  id: string;
  projectNumber: string;
  name: string;
  status: string;
  stage: string;
  priority: string;
  description?: string;
  estimatedValue?: number;
  consultationDate?: string;
  surveyDate?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  tags: string[];
}

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const projectId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProjectEditForm>({
    resolver: zodResolver(projectEditSchema),
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const projectData = await response.json();
        setProject(projectData);

        // Set form values
        setValue('name', projectData.name);
        setValue('description', projectData.description || '');
        setValue('status', projectData.status);
        setValue('priority', projectData.priority);
        setValue('estimatedValue', projectData.estimatedValue || undefined);
        setValue('consultationDate', projectData.consultationDate ? new Date(projectData.consultationDate).toISOString().split('T')[0] : '');
        setValue('surveyDate', projectData.surveyDate ? new Date(projectData.surveyDate).toISOString().split('T')[0] : '');
        setValue('scheduledStartDate', projectData.scheduledStartDate ? new Date(projectData.scheduledStartDate).toISOString().split('T')[0] : '');
        setValue('scheduledEndDate', projectData.scheduledEndDate ? new Date(projectData.scheduledEndDate).toISOString().split('T')[0] : '');
        setValue('tags', projectData.tags || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch project');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, setValue]);

  const onSubmit = async (data: ProjectEditForm) => {
    setUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-lg font-semibold text-red-700">Error loading project</div>
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Project not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Project</h1>
            <p className="text-muted-foreground">
              {project.projectNumber} - {project.name}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error updating project
              </h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter project name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value (£)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  {...register('estimatedValue', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.estimatedValue && (
                  <p className="text-sm text-red-600">{errors.estimatedValue.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  {...register('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
                {errors.priority && (
                  <p className="text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter project description"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultationDate">Consultation Date</Label>
                <Input
                  id="consultationDate"
                  type="date"
                  {...register('consultationDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surveyDate">Survey Date</Label>
                <Input
                  id="surveyDate"
                  type="date"
                  {...register('surveyDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledStartDate">Scheduled Start Date</Label>
                <Input
                  id="scheduledStartDate"
                  type="date"
                  {...register('scheduledStartDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledEndDate">Scheduled End Date</Label>
                <Input
                  id="scheduledEndDate"
                  type="date"
                  {...register('scheduledEndDate')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updating}>
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
