import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthenticatedRedirect } from "@/components/auth/authenticated-redirect";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    return <AuthenticatedRedirect user={session.user} />;
  }

  return <LandingPage />;
}
