"use client";

import { Home, BarChart3, Camera, User } from "lucide-react";

export type AppTab = "home" | "progress" | "scan" | "profile";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const SIDE_TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-lg border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
        <div className="grid grid-cols-4 items-end">
          {/* Home */}
          <TabButton
            tab={SIDE_TABS[0]}
            isActive={activeTab === "home"}
            onPress={() => onTabChange("home")}
          />

          {/* Progress */}
          <TabButton
            tab={SIDE_TABS[1]}
            isActive={activeTab === "progress"}
            onPress={() => onTabChange("progress")}
          />

          {/* Center Scan FAB */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => onTabChange("scan")}
              className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-90 ${
                activeTab === "scan"
                  ? "bg-accent text-white shadow-accent/30"
                  : "bg-accent text-white shadow-accent/20"
              }`}
            >
              <Camera className="h-6 w-6" />
            </button>
            <span className={`mt-0.5 text-[10px] font-medium ${
              activeTab === "scan" ? "text-accent" : "text-muted"
            }`}>
              Scan
            </span>
          </div>

          {/* Profile */}
          <TabButton
            tab={SIDE_TABS[2]}
            isActive={activeTab === "profile"}
            onPress={() => onTabChange("profile")}
          />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof SIDE_TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onPress}
      className="flex flex-col items-center gap-0.5 py-1.5 transition-colors active:scale-95"
    >
      <Icon
        className={`h-5 w-5 ${isActive ? "text-accent" : "text-muted"}`}
        strokeWidth={isActive ? 2.2 : 1.8}
      />
      <span
        className={`text-[10px] font-medium ${
          isActive ? "text-accent" : "text-muted"
        }`}
      >
        {tab.label}
      </span>
    </button>
  );
}
