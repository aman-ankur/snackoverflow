"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomTabBar, { type AppTab } from "@/components/BottomTabBar";
import HomeView from "@/components/HomeView";
import ScanView from "@/components/ScanView";
import ProgressView from "@/components/ProgressView";
import ProfileView from "@/components/ProfileView";
import FridgeOverlay from "@/components/FridgeOverlay";
import MealTypeSheet from "@/components/MealTypeSheet";
import MealDetailOverlay from "@/components/MealDetailOverlay";
import GoalOnboarding from "@/components/GoalOnboarding";
import dynamic from "next/dynamic";
import { useMealLog } from "@/lib/useMealLog";
import { useUserGoals } from "@/lib/useUserGoals";
import { useAuthContext } from "@/components/AuthProvider";
import type { UserProfile, NutritionGoals, MealType } from "@/lib/dishTypes";

const CapyView = dynamic(() => import("@/components/CapyView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-breathe inline-block text-4xl mb-2">🌱</div>
        <p className="text-sm font-semibold text-accent-dim">Loading Capy&apos;s Garden...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [showFridge, setShowFridge] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sheetMealType, setSheetMealType] = useState<MealType | null>(null);
  const [detailMealId, setDetailMealId] = useState<string | null>(null);

  const mealLog = useMealLog();
  const userGoals = useUserGoals();
  const auth = useAuthContext();

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
                userName={userGoals.profile?.name}
                onOpenFridge={() => setShowFridge(true)}
                onScanDish={() => setActiveTab("scan")}
                onRemoveMeal={mealLog.removeMeal}
                onMealTypeClick={(type) => setSheetMealType(type)}
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
              <ScanView
                logMeal={mealLog.logMeal}
                meals={mealLog.meals}
                refreshStreak={userGoals.refreshStreak}
                onMealLogged={() => setActiveTab("home")}
              />
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

          {activeTab === "capy" && (
            <motion.div
              key="tab-capy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CapyView
                streak={userGoals.streak}
                todayTotals={mealLog.todayTotals}
                goals={userGoals.goals}
                isActive={activeTab === "capy"}
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
                authUser={auth.user}
                isLoggedIn={auth.isLoggedIn}
                onMagicLink={auth.signInWithMagicLink}
                onSignUp={auth.signUp}
                onSignInPassword={auth.signInWithPassword}
                onSignOut={auth.signOut}
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

      {/* Meal Type Bottom Sheet */}
      <AnimatePresence>
        {sheetMealType && (
          <MealTypeSheet
            mealType={sheetMealType}
            meals={mealLog.todayMeals}
            onClose={() => setSheetMealType(null)}
            onOpenDetail={(mealId) => setDetailMealId(mealId)}
            onRemoveMeal={mealLog.removeMeal}
            onUpdateMeal={mealLog.updateMeal}
            onMoveMealToType={mealLog.moveMealToType}
            onScanDish={() => setActiveTab("scan")}
            refreshStreak={userGoals.refreshStreak}
          />
        )}
      </AnimatePresence>

      {/* Meal Detail Overlay */}
      <AnimatePresence>
        {detailMealId && (() => {
          const meal = mealLog.meals.find((m) => m.id === detailMealId);
          if (!meal) return null;
          const mealsOfType = mealLog.todayMeals.filter((m) => m.mealType === meal.mealType);
          const mealIndex = mealsOfType.findIndex((m) => m.id === detailMealId) + 1;
          return (
            <MealDetailOverlay
              meal={meal}
              mealIndex={mealIndex || 1}
              onClose={() => setDetailMealId(null)}
              onUpdateMeal={mealLog.updateMeal}
              onUpdateDish={mealLog.updateDishInMeal}
              onRemoveDish={mealLog.removeDishFromMeal}
              onRemoveMeal={(id) => { mealLog.removeMeal(id); setDetailMealId(null); setSheetMealType(null); }}
              onMoveMealToType={mealLog.moveMealToType}
              onRescan={(mealType) => { setDetailMealId(null); setSheetMealType(null); setActiveTab("scan"); }}
              refreshStreak={userGoals.refreshStreak}
            />
          );
        })()}
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
