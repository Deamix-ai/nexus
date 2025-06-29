import { Metadata } from "next"
import { DocuSignDashboard } from "@/components/docusign/docusign-dashboard"

export const metadata: Metadata = {
    title: "Document Signing - Nexus CRM",
    description: "Manage digital document signing with DocuSign integration",
}

export default function DocuSignPage() {
    return <DocuSignDashboard />
}
