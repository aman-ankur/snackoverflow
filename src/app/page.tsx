"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomTabBar, { type AppTab } from "@/components/BottomTabBar";
import HomeView from "@/components/HomeView";
import ScanView from "@/components/ScanView";
import ProgressView from "@/components/ProgressView";
import ProfileView from "@/components/ProfileView";
import FridgeOverlay from "@/components/FridgeOverlay";
import GoalOnboarding from "@/components/GoalOnboarding";
import { useMealLog } from "@/lib/useMealLog";
import { useUserGoals } from "@/lib/useUserGoals";
import type { UserProfile, NutritionGoals } from "@/lib/dishTypes";

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [showFridge, setShowFridge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const mealLog = useMealLog();
  const userGoals = useUserGoals();

  useEffect(() => {
    if (userGoals.hasLoaded && !userGoals.hasProfile) {
      setShowOnboarding(true);
    }
  }, [userGoals.hasLoaded, userGoals.hasProfile]);

  const handleOnboardingComplete = (profile: UserProfile, goals: NutritionGoals) => {
    userGoals.saveProfile(profile);
    if (goals.isCustom) {
      userGoals.updateGoals(goals);
    }
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 pt-4 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <HomeView
                todayMeals={mealLog.todayMeals}
                todayTotals={mealLog.todayTotals}
                goals={userGoals.goals}
                streak={userGoals.streak}
                onOpenFridge={() => setShowFridge(true)}
                onScanDish={() => setActiveTab("scan")}
                onRemoveMeal={mealLog.removeMeal}
              />
            </motion.div>
          )}

          {activeTab === "scan" && (
            <motion.div
              key="tab-scan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ScanView />
            </motion.div>
          )}

          {activeTab === "progress" && (
            <motion.div
              key="tab-progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProgressView
                todayTotals={mealLog.todayTotals}
                goals={userGoals.goals}
                streak={userGoals.streak}
                meals={mealLog.meals}
                weeklyByDate={mealLog.weeklyByDate}
                repeatedDishes={mealLog.insights.repeatedDishes}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView
                profile={userGoals.profile}
                goals={userGoals.goals}
                streak={userGoals.streak}
                onEditGoals={() => setShowOnboarding(true)}
                onResetAll={userGoals.resetAll}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Fridge Overlay */}
      <AnimatePresence>
        {showFridge && <FridgeOverlay onClose={() => setShowFridge(false)} />}
      </AnimatePresence>

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <GoalOnboarding
            existingProfile={userGoals.profile}
            onComplete={handleOnboardingComplete}
            onSkip={() => setShowOnboarding(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
