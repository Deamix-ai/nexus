import { Metadata } from "next"
import { SMSDashboard } from "@/components/sms/sms-dashboard-simple"

export const metadata: Metadata = {
    title: "SMS Management - Nexus CRM",
    description: "Send and manage SMS communications with clients",
}

export default function SMSPage() {
    return <SMSDashboard />
}
