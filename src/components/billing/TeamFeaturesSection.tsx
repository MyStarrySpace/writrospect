"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ChevronDown, UserPlus, Shield, Share2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TeamFeaturesSectionProps {
  isTeamPlan: boolean;
  onUpgrade: () => void;
}

export function TeamFeaturesSection({ isTeamPlan, onUpgrade }: TeamFeaturesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isTeamPlan);

  const teamFeatures = [
    {
      icon: UserPlus,
      title: "Team Members",
      description: "Invite up to 5 team members",
      action: "Manage Members",
    },
    {
      icon: Share2,
      title: "Shared Goals",
      description: "Create and track goals together",
      action: "View Shared",
    },
    {
      icon: Shield,
      title: "Admin Controls",
      description: "Manage permissions and access",
      action: "Settings",
    },
  ];

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-2"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--shadow-light)" }}
          >
            <Users className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Team Features
            </h4>
            <p className="text-xs" style={{ color: "var(--accent)" }}>
              {isTeamPlan ? "Manage your team" : "Available on Team plan"}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5" style={{ color: "var(--accent)" }} />
        </motion.div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="relative mt-4">
              {/* Faded overlay for non-team plans */}
              {!isTeamPlan && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(var(--background-rgb, 232, 221, 232), 0.85)",
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <Lock className="mb-2 h-6 w-6" style={{ color: "var(--accent)" }} />
                  <p
                    className="mb-3 text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Available on Team plan
                  </p>
                  <Button size="sm" onClick={onUpgrade}>
                    Upgrade to Team
                  </Button>
                </div>
              )}

              {/* Team features grid */}
              <div
                className="space-y-3 rounded-xl p-4"
                style={{
                  background: "var(--shadow-light)",
                  boxShadow: "var(--neu-shadow-inset-sm)",
                }}
              >
                {teamFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--foreground)" }}
                          >
                            {feature.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--accent)" }}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!isTeamPlan}
                      >
                        {feature.action}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
