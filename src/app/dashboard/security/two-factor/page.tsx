import { Metadata } from "next"
import { TwoFactorAuth } from "@/components/auth/two-factor-auth"

export const metadata: Metadata = {
    title: "Two-Factor Authentication - Nexus CRM",
    description: "Secure your account with two-factor authentication",
}

export default function TwoFactorPage() {
    return <TwoFactorAuth />
}
