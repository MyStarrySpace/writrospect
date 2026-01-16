"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListItem, ListContainer } from "@/components/ui/ListItem";
import { Skeleton, SkeletonText, SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  Heart,
  Star,
  Send,
  Settings,
  Trash2,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Check,
  Clock,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function ShowcasePage() {
  const [selectValue, setSelectValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showStagger, setShowStagger] = useState(true);
  const [showPresence, setShowPresence] = useState(true);
  const { addToast } = useToast();

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ background: "var(--background)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl font-bold font-heading mb-4"
            style={{ color: "var(--foreground)" }}
          >
            Writrospect Design System
          </h1>
          <p style={{ color: "var(--accent)" }}>
            A soft, neomorphic design language built for calm and focus
          </p>
        </div>

        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch name="Background" variable="--background" />
            <ColorSwatch name="Foreground" variable="--foreground" />
            <ColorSwatch name="Shadow Light" variable="--shadow-light" />
            <ColorSwatch name="Shadow Dark" variable="--shadow-dark" />
            <ColorSwatch name="Accent" variable="--accent" />
            <ColorSwatch name="Accent Soft" variable="--accent-soft" />
            <ColorSwatch name="Accent Primary" variable="--accent-primary" />
            <ColorSwatch name="Accent Border" variable="--accent-border" />
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <Card>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--accent)" }}>
                  Heading Font: Comfortaa
                </p>
                <h1 className="text-4xl font-heading font-bold" style={{ color: "var(--foreground)" }}>
                  Heading 1
                </h1>
                <h2 className="text-3xl font-heading font-bold" style={{ color: "var(--foreground)" }}>
                  Heading 2
                </h2>
                <h3 className="text-2xl font-heading font-semibold" style={{ color: "var(--foreground)" }}>
                  Heading 3
                </h3>
                <h4 className="text-xl font-heading font-semibold" style={{ color: "var(--foreground)" }}>
                  Heading 4
                </h4>
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--accent)" }}>
                  Body Font: Nunito
                </p>
                <p className="text-lg" style={{ color: "var(--foreground)" }}>
                  Large body text for emphasis and introductions.
                </p>
                <p className="text-base" style={{ color: "var(--foreground)" }}>
                  Regular body text for general content and paragraphs.
                </p>
                <p className="text-sm" style={{ color: "var(--accent)" }}>
                  Small text for secondary information and captions.
                </p>
                <p className="text-xs" style={{ color: "var(--accent-soft)" }}>
                  Extra small text for metadata and timestamps.
                </p>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Shadow System */}
        <Section title="Neomorphic Shadow System">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-subtle)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Subtle
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow-subtle
              </code>
            </div>
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Default
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow
              </code>
            </div>
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-lg)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Large
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow-lg
              </code>
            </div>
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-inset-sm)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Inset Small
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow-inset-sm
              </code>
            </div>
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-inset)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Inset
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow-inset
              </code>
            </div>
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--background)",
                boxShadow: "var(--neu-shadow-sm)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Small
              </p>
              <code className="text-xs" style={{ color: "var(--accent)" }}>
                --neu-shadow-sm
              </code>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Card>
            <CardContent className="space-y-8">
              {/* Variants */}
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                  Variants
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                  Sizes
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* With Icons */}
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                  With Icons
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Add New</Button>
                  <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
                  <Button variant="secondary" leftIcon={<Settings className="h-4 w-4" />}>
                    Settings
                  </Button>
                  <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
                    Delete
                  </Button>
                </div>
              </div>

              {/* States */}
              <div>
                <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                  States
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover>
              <CardHeader>
                <CardTitle>Raised Card</CardTitle>
                <CardDescription>Default neomorphic card with soft shadows</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "var(--accent)" }}>
                  Cards float above the background with dual-tone shadows creating depth.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card pressed>
              <CardHeader>
                <CardTitle>Pressed Card</CardTitle>
                <CardDescription>Inset shadow for a recessed appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "var(--accent)" }}>
                  Pressed cards sink into the background using inset shadows.
                </p>
              </CardContent>
            </Card>

            <Card accent hover>
              <CardHeader>
                <CardTitle>Accent Card</CardTitle>
                <CardDescription>With accent border highlight</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "var(--accent)" }}>
                  Accent cards feature a subtle left border that draws attention.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Form Elements */}
        <Section title="Form Elements">
          <Card>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Text Input"
                  placeholder="Enter your name..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <Input
                  label="With Helper Text"
                  placeholder="Enter email..."
                  helperText="We'll never share your email"
                />
                <Input
                  label="Error State"
                  placeholder="Invalid input"
                  error="This field is required"
                  defaultValue="invalid"
                />
                <Input
                  label="Disabled"
                  placeholder="Can't edit this"
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Select Dropdown"
                  placeholder="Choose an option..."
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  options={[
                    { value: "option1", label: "Option One" },
                    { value: "option2", label: "Option Two" },
                    { value: "option3", label: "Option Three" },
                  ]}
                />
                <Select
                  label="Select with Error"
                  placeholder="Select..."
                  error="Please select an option"
                  options={[
                    { value: "a", label: "Choice A" },
                    { value: "b", label: "Choice B" },
                  ]}
                />
              </div>

              <Textarea
                label="Textarea"
                placeholder="Write your thoughts here..."
                helperText="Supports markdown formatting"
              />
            </CardContent>
          </Card>
        </Section>

        {/* Badges */}
        <Section title="Badges">
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Spinners & Loading */}
        <Section title="Loading States">
          <Card>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Spinner size="sm" />
                  <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>Large</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Tooltips */}
        <Section title="Tooltips">
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-8 justify-center">
                <Tooltip content="Tooltip on top" position="top">
                  <Button variant="secondary" size="sm">Hover (Top)</Button>
                </Tooltip>
                <Tooltip content="Tooltip on bottom" position="bottom">
                  <Button variant="secondary" size="sm">Hover (Bottom)</Button>
                </Tooltip>
                <Tooltip content="Tooltip on left" position="left">
                  <Button variant="secondary" size="sm">Hover (Left)</Button>
                </Tooltip>
                <Tooltip content="Tooltip on right" position="right">
                  <Button variant="secondary" size="sm">Hover (Right)</Button>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Modal */}
        <Section title="Modal">
          <Card>
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Example Modal"
              >
                <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                  Modals use a frosted glass backdrop with smooth spring animations.
                  They support keyboard navigation (Escape to close) and click-outside dismissal.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </Modal>
            </CardContent>
          </Card>
        </Section>

        {/* Page Header */}
        <Section title="Page Header">
          <PageHeader
            title="Example Page"
            description="This component provides consistent page headers with optional actions."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />}>New Item</Button>
            }
          />
        </Section>

        {/* List Items */}
        <Section title="List Items">
          <Card>
            <CardContent>
              <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                Used for tasks, commitments, goals, and other list-based content
              </p>
              <ListContainer>
                <ListItem>
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <div>
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>Complete project review</p>
                        <p className="text-xs" style={{ color: "var(--accent)" }}>Due tomorrow</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Pending</Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </ListItem>
                <ListItem isSelected>
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                      <div>
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>Weekly team meeting</p>
                        <p className="text-xs" style={{ color: "var(--accent)" }}>Completed yesterday</p>
                      </div>
                    </div>
                    <Badge variant="success">Done</Badge>
                  </div>
                </ListItem>
                <ListItem isLast>
                  <div className="flex items-center gap-3 px-4">
                    <Clock className="h-4 w-4" style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="font-medium" style={{ color: "var(--foreground)" }}>Review documentation</p>
                      <p className="text-xs" style={{ color: "var(--accent)" }}>No deadline</p>
                    </div>
                  </div>
                </ListItem>
              </ListContainer>
            </CardContent>
          </Card>
        </Section>

        {/* Skeleton Loading */}
        <Section title="Skeleton Loading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Skeletons</CardTitle>
                <CardDescription>Building blocks for loading states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--accent)" }}>Text lines</p>
                  <SkeletonText lines={3} />
                </div>
                <div>
                  <p className="text-xs mb-2" style={{ color: "var(--accent)" }}>Single element</p>
                  <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Card</CardTitle>
                <CardDescription>Pre-composed card placeholder</CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonCard />
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Toast Notifications */}
        <Section title="Toast Notifications">
          <Card>
            <CardContent>
              <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
                Toasts provide feedback for user actions with auto-dismiss and optional actions
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircle className="h-4 w-4" />}
                  onClick={() => addToast("success", "Entry saved successfully")}
                >
                  Success Toast
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<AlertCircle className="h-4 w-4" />}
                  onClick={() => addToast("error", "Failed to save entry")}
                >
                  Error Toast
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Info className="h-4 w-4" />}
                  onClick={() => addToast("info", "Your changes have been saved")}
                >
                  Info Toast
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addToast("success", "Task completed", {
                    duration: 6000,
                    action: {
                      label: "Undo",
                      onClick: () => addToast("info", "Action undone"),
                    },
                  })}
                >
                  Toast with Action
                </Button>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* Animations */}
        <Section title="Animations">
          {/* Interaction Comparison */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interactive Feedback</CardTitle>
              <CardDescription>
                Framer Motion spring physics combined with neomorphic shadow transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Button Component */}
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: "var(--background)",
                    boxShadow: "var(--neu-shadow-inset-sm)",
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                    Button Component
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--accent)" }}>
                    Combines scale animation with shadow transitions
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    <Button variant="primary" size="sm" leftIcon={<Heart className="h-4 w-4" />}>Like</Button>
                    <Button variant="secondary" size="sm" leftIcon={<Star className="h-4 w-4" />}>Save</Button>
                    <Button variant="ghost" size="sm" leftIcon={<Send className="h-4 w-4" />}>Share</Button>
                  </div>
                  <code className="text-xs px-2 py-1 rounded" style={{ background: "var(--shadow-dark)", color: "var(--foreground)" }}>
                    {"<Button />"}
                  </code>
                </div>

                {/* Card Component */}
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: "var(--background)",
                    boxShadow: "var(--neu-shadow-inset-sm)",
                  }}
                >
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                    Card Component
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--accent)" }}>
                    Subtle 1.01x scale on hover
                  </p>
                  <div className="flex justify-center mb-4">
                    <Card hover className="p-3">
                      <p className="text-xs" style={{ color: "var(--foreground)" }}>Hover me</p>
                    </Card>
                  </div>
                  <code className="text-xs px-2 py-1 rounded" style={{ background: "var(--shadow-dark)", color: "var(--foreground)" }}>
                    {"<Card hover />"}
                  </code>
                </div>
              </div>

              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: "var(--background)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                  color: "var(--accent)",
                }}
              >
                <p className="font-medium mb-2" style={{ color: "var(--foreground)" }}>How it works:</p>
                <ul className="space-y-1 text-xs">
                  <li><strong>Hover:</strong> Element scales up slightly (1.02x) with spring physics, shadow intensifies</li>
                  <li><strong>Press:</strong> Element scales down (0.98x), shadow inverts from raised to inset</li>
                  <li><strong>Release:</strong> Springs back to hover state with natural bounce</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stagger Children */}
            <Card>
              <CardHeader>
                <CardTitle>Stagger Animation</CardTitle>
                <CardDescription>List items animate in sequence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<RotateCcw className="h-3 w-3" />}
                    onClick={() => {
                      setShowStagger(false);
                      setTimeout(() => setShowStagger(true), 100);
                    }}
                  >
                    Replay
                  </Button>
                </div>
                <AnimatePresence mode="wait">
                  {showStagger && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: { staggerChildren: 0.1 }
                        }
                      }}
                      className="space-y-2"
                    >
                      {["First item", "Second item", "Third item", "Fourth item"].map((item) => (
                        <motion.div
                          key={item}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 }
                          }}
                          className="rounded-lg px-3 py-2 text-sm"
                          style={{
                            background: "var(--background)",
                            boxShadow: "var(--neu-shadow-subtle)",
                            color: "var(--foreground)",
                          }}
                        >
                          {item}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Presence Animation */}
            <Card>
              <CardHeader>
                <CardTitle>Enter/Exit Animation</CardTitle>
                <CardDescription>Smooth mount and unmount transitions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPresence(!showPresence)}
                  className="mb-4"
                >
                  {showPresence ? "Hide" : "Show"} Element
                </Button>
                <div className="h-24 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {showPresence && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="rounded-2xl p-6 flex items-center gap-3"
                        style={{
                          background: "var(--background)",
                          boxShadow: "var(--neu-shadow)",
                        }}
                      >
                        <Sparkles className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          Animated element
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: "var(--accent-soft)" }}>
            Writrospect Design System
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2
        className="text-2xl font-heading font-bold mb-6"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ColorSwatch({ name, variable }: { name: string; variable: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--background)",
        boxShadow: "var(--neu-shadow-subtle)",
      }}
    >
      <div
        className="h-16 rounded-xl mb-3"
        style={{
          background: `var(${variable})`,
          boxShadow: "var(--neu-shadow-inset-sm)",
        }}
      />
      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {name}
      </p>
      <code className="text-xs" style={{ color: "var(--accent)" }}>
        {variable}
      </code>
    </div>
  );
}
