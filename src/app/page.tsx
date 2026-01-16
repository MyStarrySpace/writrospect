import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { Sparkles, Image, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export default async function Home() {
  const user = await stackServerApp.getUser();

  // If logged in, redirect to journal
  if (user) {
    redirect("/journal");
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h1
              className="text-4xl font-bold tracking-tight sm:text-6xl font-heading"
              style={{ color: "var(--foreground)" }}
            >
              Writrospect
            </h1>
            <p
              className="mt-6 text-lg leading-8 max-w-2xl mx-auto"
              style={{ color: "var(--accent)" }}
            >
              A calming space for reflection. Write freely while AI gently prompts your thinking
              and helps you notice your growth over time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/handler/sign-in">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Begin Writing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <Card hover className="p-6">
            <CardContent className="p-0">
              <div
                className="mb-4 inline-flex rounded-xl p-3"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                }}
              >
                <Sparkles className="h-6 w-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Gentle AI Guidance
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                An AI companion that asks thoughtful questions, helps you explore your thoughts
                deeper, and reflects patterns back to you without judgment.
              </p>
            </CardContent>
          </Card>

          <Card hover className="p-6">
            <CardContent className="p-0">
              <div
                className="mb-4 inline-flex rounded-xl p-3"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                }}
              >
                <Image className="h-6 w-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Your Space, Your Colors
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                Choose an image that speaks to you and watch your entire space transform. The
                theme adapts to your image, creating a personalized atmosphere for reflection.
              </p>
            </CardContent>
          </Card>

          <Card hover className="p-6">
            <CardContent className="p-0">
              <div
                className="mb-4 inline-flex rounded-xl p-3"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                }}
              >
                <TrendingUp className="h-6 w-6" style={{ color: "var(--accent-primary)" }} />
              </div>
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Track Your Growth
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                See how your thoughts and goals evolve over time. The AI helps you recognize
                progress you might not notice yourself, celebrating small wins along the way.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <Card pressed className="px-6 py-16 text-center">
          <CardContent className="p-0">
            <h2
              className="text-2xl font-bold font-heading"
              style={{ color: "var(--foreground)" }}
            >
              A Calm Place to Think
            </h2>
            <p className="mt-4 max-w-2xl mx-auto" style={{ color: "var(--accent)" }}>
              Writrospect is designed to feel peaceful. Soft colors, gentle shadows, and a
              soothing interface that gets out of your way so you can focus on what matters—your
              thoughts, your growth, your journey.
            </p>
            <p className="mt-4 text-sm max-w-2xl mx-auto" style={{ color: "var(--accent-soft)" }}>
              No pressure. No metrics to chase. Just a quiet space for honest reflection.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="pb-8">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-sm" style={{ color: "var(--accent-soft)" }}>
            Your reflections are private. Your growth is personal. Write freely.
          </p>
        </div>
      </footer>
    </div>
  );
}
