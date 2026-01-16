import { stackServerApp } from "@/stack";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import Image from "next/image";

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
        {/* Hero Image */}
        <div className="relative w-full h-[60vh] min-h-[500px] max-h-[700px]">
          <Image
            src="/images/hero-banner.jpg"
            alt="A peaceful zen garden with an open journal, representing mindful reflection"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(232,221,232,0.1) 0%, rgba(232,221,232,0.4) 50%, var(--background) 95%)",
            }}
          />
          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-center px-12 py-10 max-w-3xl rounded-3xl"
              style={{
                background: "radial-gradient(ellipse at center, rgba(232,221,232,0.85) 0%, rgba(232,221,232,0.4) 50%, transparent 80%)",
              }}
            >
              <h1
                className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-heading"
                style={{ color: "#1a1a2e" }}
              >
                Writrospect
              </h1>
              <p
                className="mt-6 text-lg sm:text-xl leading-8"
                style={{ color: "#2d2d44" }}
              >
                Your personal sanctuary for reflection. Write freely while thoughtful AI prompts
                guide you deeper and illuminate your growth over time.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href="/handler/sign-in" className="drop-shadow-lg">
                  <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Start Your Journey
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <Card hover noPadding className="overflow-hidden">
            <div className="relative h-48 w-full mb-4">
              <Image
                src="/images/feature-palette.jpg"
                alt="An open journal floating in a soft gradient sky"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-16"
                style={{
                  background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
                }}
              />
            </div>
            <div className="px-6 pb-6">
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Gentle AI Guidance
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                An AI companion that asks thoughtful questions to help you explore your thoughts
                more deeply. It reflects patterns back to you without judgment.
              </p>
            </div>
          </Card>

          <Card hover noPadding className="overflow-hidden">
            <div className="relative h-48 w-full mb-4">
              <Image
                src="/images/feature-evolve.jpg"
                alt="A peaceful figure standing in a zen garden under a starlit sky"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-16"
                style={{
                  background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
                }}
              />
            </div>
            <div className="px-6 pb-6">
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Your Space, Your Palette
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                Choose an image that speaks to you and watch your entire space transform. The
                theme adapts to create a personalized atmosphere for reflection.
              </p>
            </div>
          </Card>

          <Card hover noPadding className="overflow-hidden">
            <div className="relative h-48 w-full mb-4">
              <Image
                src="/images/feature-guidance.jpg"
                alt="A serene figure reading with focused attention"
                fill
                className="object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-16"
                style={{
                  background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
                }}
              />
            </div>
            <div className="px-6 pb-6">
              <h3
                className="text-lg font-semibold font-heading"
                style={{ color: "var(--foreground)" }}
              >
                Watch Yourself Evolve
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
                See how your thoughts and goals develop over time. The AI helps you recognize
                progress you might not notice on your own, celebrating small wins along the way.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Highlight Section */}
      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="text-center mb-12">
          <h2
            className="text-2xl font-bold font-heading"
            style={{ color: "var(--foreground)" }}
          >
            Everything You Need to Grow
          </h2>
          <p className="mt-4 max-w-2xl mx-auto" style={{ color: "var(--accent)" }}>
            Tools designed to support your journey, not overwhelm it.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Reflective Journaling
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              Capture thoughts with mood tracking, categorize by time of day, and let AI help when you're stuck.
            </p>
          </Card>
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Commitments & Goals
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              Track what matters to you. Break big aspirations into actionable steps with gentle accountability.
            </p>
          </Card>
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Strategy Tracking
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              Document what works for you and what doesn't. Learn your own patterns over time.
            </p>
          </Card>
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Smart Tasks
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              Create tasks linked to your goals. Get reminders via push notifications, SMS, or calendar.
            </p>
          </Card>
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Growth Insights
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              See your progress with completion rates and strategy success. Metrics that celebrate growth, not pressure.
            </p>
          </Card>
          <Card pressed className="p-6">
            <h3 className="font-semibold font-heading" style={{ color: "var(--foreground)" }}>
              Personalized AI
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--accent)" }}>
              An AI that learns about you, your circumstances, and what helps you succeed.
            </p>
          </Card>
        </div>
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
