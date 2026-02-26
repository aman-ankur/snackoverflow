"use client";

import { useEffect, useState, useCallback } from "react";
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
import HealthProfileWizard from "@/components/HealthProfileWizard";
import WelcomeTour from "@/components/WelcomeTour";
import EatingAnalysisSheet from "@/components/EatingAnalysisSheet";
import PullToRefresh from "@/components/PullToRefresh";
import dynamic from "next/dynamic";
import { useMealLog } from "@/lib/useMealLog";
import { useUserGoals } from "@/lib/useUserGoals";
import { useHealthProfile } from "@/lib/useHealthProfile";
import { useEatingAnalysis } from "@/lib/useEatingAnalysis";
import { useAuthContext } from "@/components/AuthProvider";
import { useCoachMarks } from "@/lib/useCoachMarks";
import type { UserProfile, NutritionGoals, MealType, HealthCondition, LabValue, DietPreference, EatingAnalysis } from "@/lib/dishTypes";

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
  const [scanInitialMode, setScanInitialMode] = useState<"camera" | "describe">("camera");
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [showHealthWizard, setShowHealthWizard] = useState(false);
  const [analysisSheetData, setAnalysisSheetData] = useState<{
    analysis: EatingAnalysis;
    windowLabel: string;
  } | null>(null);
  const coachMarks = useCoachMarks();

  const mealLog = useMealLog();
  const userGoals = useUserGoals();
  const healthProfile = useHealthProfile();
  const eatingAnalysis = useEatingAnalysis();
  const auth = useAuthContext();

  useEffect(() => {
    if (userGoals.hasLoaded && !userGoals.hasProfile) {
      setShowOnboarding(true);
    }
  }, [userGoals.hasLoaded, userGoals.hasProfile]);

  // Auto-switch to scan tab and skip onboarding when ?mock=scan
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock") === "scan") {
      setActiveTab("scan");
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile, goals: NutritionGoals) => {
    userGoals.saveProfile(profile);
    if (goals.isCustom) {
      userGoals.updateGoals(goals);
    }
    setShowOnboarding(false);
    // Show health wizard after first-time onboarding if no health profile yet
    if (!healthProfile.hasHealthProfile) {
      setShowHealthWizard(true);
      return;
    }
    // Show welcome tour after first-time onboarding
    const tourSeen = typeof window !== "undefined" && localStorage.getItem("snackoverflow-welcome-seen");
    if (!tourSeen) setShowWelcomeTour(true);
  };

  const handleHealthWizardComplete = (
    conditions: HealthCondition[],
    labValues: LabValue[],
    freeTextNotes: string,
    dietPreference?: DietPreference
  ) => {
    healthProfile.saveHealthProfile(conditions, labValues, freeTextNotes, dietPreference);
    setShowHealthWizard(false);
    const tourSeen = typeof window !== "undefined" && localStorage.getItem("snackoverflow-welcome-seen");
    if (!tourSeen) setShowWelcomeTour(true);
  };

  const handleWelcomeTourComplete = () => {
    setShowWelcomeTour(false);
    try { localStorage.setItem("snackoverflow-welcome-seen", "true"); } catch { /* ignore */ }
    setActiveTab("scan");
  };

  const handleWhatsNewTryIt = () => {
    setScanInitialMode("describe");
    setActiveTab("scan");
  };

  const handlePullRefresh = useCallback(async () => {
    // Offline-first: data is already in-memory via hooks.
    // Pull-to-refresh provides a visual "I've refreshed" moment.
    // Force re-read streak in case it drifted.
    userGoals.refreshStreak();
    await new Promise((r) => setTimeout(r, 400));
  }, [userGoals]);

  return (
    <div className="h-dvh flex flex-col bg-background overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none mx-auto w-full max-w-lg px-4 pt-4 pb-24">
        <PullToRefresh onRefresh={handlePullRefresh}>
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
                onWhatsNewTryIt={handleWhatsNewTryIt}
                coachMarks={coachMarks}
                latestAnalysis={eatingAnalysis.getLatest()}
                onViewAnalysis={() => setActiveTab("progress")}
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
                initialMode={scanInitialMode}
                coachMarks={coachMarks}
                healthContextString={healthProfile.healthContextString}
                hasHealthProfile={healthProfile.hasHealthProfile}
                healthConditions={healthProfile.healthProfile?.conditions}
                onSetupHealthProfile={() => setShowHealthWizard(true)}
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
                coachMarks={coachMarks}
                healthProfile={healthProfile.healthProfile}
                hasHealthProfile={healthProfile.hasHealthProfile}
                eatingAnalysis={eatingAnalysis}
                onViewAnalysisReport={(analysis, windowLabel) =>
                  setAnalysisSheetData({ analysis, windowLabel })
                }
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
                coachMarks={coachMarks}
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
                healthProfile={healthProfile.healthProfile}
                hasHealthProfile={healthProfile.hasHealthProfile}
                onEditGoals={() => setShowOnboarding(true)}
                onEditHealthProfile={() => setShowHealthWizard(true)}
                onResetAll={userGoals.resetAll}
                authUser={auth.user}
                isLoggedIn={auth.isLoggedIn}
                onSendOTP={auth.sendEmailOTP}
                onVerifyOTP={auth.verifyEmailOTP}
                onSignUp={auth.signUp}
                onSignInPassword={auth.signInWithPassword}
                onSignOut={auth.signOut}
                onReplayTour={() => {
                  try { localStorage.removeItem("snackoverflow-welcome-seen"); } catch { /* ignore */ }
                  coachMarks.resetAll();
                  setShowWelcomeTour(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </PullToRefresh>
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
            onRemoveDish={mealLog.removeDishFromMeal}
            onScanDish={() => { setScanInitialMode("camera"); setActiveTab("scan"); }}
            onDescribeMeal={() => { setScanInitialMode("describe"); setActiveTab("scan"); }}
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

      {/* Health Profile Wizard */}
      <AnimatePresence>
        {showHealthWizard && (
          <HealthProfileWizard
            existingProfile={healthProfile.healthProfile}
            userProfile={userGoals.profile}
            onComplete={handleHealthWizardComplete}
            onSkip={() => {
              setShowHealthWizard(false);
              const tourSeen = typeof window !== "undefined" && localStorage.getItem("snackoverflow-welcome-seen");
              if (!tourSeen) setShowWelcomeTour(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Welcome Tour */}
      <AnimatePresence>
        {showWelcomeTour && (
          <WelcomeTour onComplete={handleWelcomeTourComplete} />
        )}
      </AnimatePresence>

      {/* Eating Analysis Sheet */}
      <AnimatePresence>
        {analysisSheetData && (
          <EatingAnalysisSheet
            report={analysisSheetData.analysis.report}
            windowLabel={analysisSheetData.windowLabel}
            generatedAt={analysisSheetData.analysis.generatedAt}
            provider={analysisSheetData.analysis.provider}
            hasHealthProfile={healthProfile.hasHealthProfile}
            onClose={() => setAnalysisSheetData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
