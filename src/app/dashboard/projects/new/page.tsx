"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ClientAddress {
  street: string;
  city: string;
  county: string;
  postcode: string;
}

interface ProjectFormData {
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: ClientAddress;
  leadSource: string;
  leadSourceDetail: string;
  description: string;
  estimatedValue: string;
  consultationDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

const leadSources = [
  "Website",
  "Google Ads",
  "Facebook Ads",
  "Referral",
  "Showroom Visit",
  "Phone Enquiry",
  "Email Enquiry",
  "Trade Show",
  "Direct Mail",
  "Other"
];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: {
      street: "",
      city: "",
      county: "",
      postcode: ""
    },
    leadSource: "",
    leadSourceDetail: "",
    description: "",
    estimatedValue: "",
    consultationDate: "",
    priority: "MEDIUM"
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.startsWith("clientAddress.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        clientAddress: {
          ...prev.clientAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Project name is required";
    if (!formData.clientName.trim()) newErrors.clientName = "Client name is required";
    if (!formData.clientEmail.trim()) newErrors.clientEmail = "Client email is required";
    if (!formData.clientPhone.trim()) newErrors.clientPhone = "Client phone is required";
    if (!formData.leadSource.trim()) newErrors.leadSource = "Lead source is required";
    if (!formData.clientAddress.street.trim()) newErrors["clientAddress.street"] = "Street is required";
    if (!formData.clientAddress.city.trim()) newErrors["clientAddress.city"] = "City is required";
    if (!formData.clientAddress.county.trim()) newErrors["clientAddress.county"] = "County is required";
    if (!formData.clientAddress.postcode.trim()) newErrors["clientAddress.postcode"] = "Postcode is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.clientEmail && !emailRegex.test(formData.clientEmail)) {
      newErrors.clientEmail = "Please enter a valid email address";
    }

    // Estimated value validation
    if (formData.estimatedValue && isNaN(Number(formData.estimatedValue))) {
      newErrors.estimatedValue = "Please enter a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const { project } = await response.json();
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      setErrors({ 
        submit: error instanceof Error ? error.message : "Failed to create project" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600">Add a new bathroom renovation project</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Master Ensuite Renovation"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the project requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Value (£)
              </label>
              <input
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedValue ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
              {errors.estimatedValue && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedValue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultation Date
              </label>
              <input
                type="datetime-local"
                name="consultationDate"
                value={formData.consultationDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Client Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="John Smith"
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="john.smith@email.com"
              />
              {errors.clientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.clientPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="07123 456789"
              />
              {errors.clientPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source *
              </label>
              <select
                name="leadSource"
                value={formData.leadSource}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.leadSource ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select lead source...</option>
                {leadSources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              {errors.leadSource && (
                <p className="mt-1 text-sm text-red-600">{errors.leadSource}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source Detail
              </label>
              <input
                type="text"
                name="leadSourceDetail"
                value={formData.leadSourceDetail}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Google Ads campaign, referred by John Doe..."
              />
            </div>
          </div>
        </div>

        {/* Client Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Client Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="clientAddress.street"
                value={formData.clientAddress.street}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["clientAddress.street"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="123 Main Street"
              />
              {errors["clientAddress.street"] && (
                <p className="mt-1 text-sm text-red-600">{errors["clientAddress.street"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                name="clientAddress.city"
                value={formData.clientAddress.city}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["clientAddress.city"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="London"
              />
              {errors["clientAddress.city"] && (
                <p className="mt-1 text-sm text-red-600">{errors["clientAddress.city"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County *
              </label>
              <input
                type="text"
                name="clientAddress.county"
                value={formData.clientAddress.county}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["clientAddress.county"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Greater London"
              />
              {errors["clientAddress.county"] && (
                <p className="mt-1 text-sm text-red-600">{errors["clientAddress.county"]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postcode *
              </label>
              <input
                type="text"
                name="clientAddress.postcode"
                value={formData.clientAddress.postcode}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["clientAddress.postcode"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="SW1A 1AA"
              />
              {errors["clientAddress.postcode"] && (
                <p className="mt-1 text-sm text-red-600">{errors["clientAddress.postcode"]}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Project"}
          </button>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}
