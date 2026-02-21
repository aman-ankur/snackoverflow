"use client";

import { Home, BarChart3, Camera, User, PawPrint } from "lucide-react";

export type AppTab = "home" | "progress" | "scan" | "capy" | "profile";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const LEFT_TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "progress", label: "Progress", icon: BarChart3 },
];

const RIGHT_TABS: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "capy", label: "Capy", icon: PawPrint },
  { id: "profile", label: "Profile", icon: User },
];

export default function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-lg border-t border-border bg-card px-2 pb-[env(safe-area-inset-bottom,8px)] pt-1.5">
        <div className="grid grid-cols-5 items-end">
          {/* Home */}
          <TabButton
            tab={LEFT_TABS[0]}
            isActive={activeTab === "home"}
            onPress={() => onTabChange("home")}
          />

          {/* Progress */}
          <TabButton
            tab={LEFT_TABS[1]}
            isActive={activeTab === "progress"}
            onPress={() => onTabChange("progress")}
          />

          {/* Center Scan FAB */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => onTabChange("scan")}
              className={`-mt-7 flex h-16 w-16 items-center justify-center rounded-full ring-4 ring-white shadow-[0_4px_20px_rgba(90,172,90,0.35)] transition-all active:scale-90 ${
                activeTab === "scan"
                  ? "bg-accent text-white scale-105"
                  : "bg-accent text-white"
              }`}
            >
              <Camera className="h-7 w-7" />
            </button>
            <span className={`mt-0.5 text-[10px] font-bold ${
              activeTab === "scan" ? "text-accent" : "text-muted"
            }`}>
              Scan
            </span>
          </div>

          {/* Capy */}
          <TabButton
            tab={RIGHT_TABS[0]}
            isActive={activeTab === "capy"}
            onPress={() => onTabChange("capy")}
          />

          {/* Profile */}
          <TabButton
            tab={RIGHT_TABS[1]}
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
  tab: { id: AppTab; label: string; icon: typeof Home };
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
        className={`text-[10px] font-bold ${
          isActive ? "text-accent" : "text-muted"
        }`}
      >
        {tab.label}
      </span>
    </button>
  );
}
