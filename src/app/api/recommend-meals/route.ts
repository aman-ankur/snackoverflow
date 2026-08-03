import { NextRequest, NextResponse } from "next/server";
import type { MealMemoryItem } from "@/lib/recommendations";
import type { MealType } from "@/lib/dishTypes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { memory?: MealMemoryItem[]; todayTotals?: Record<string, number>; goals?: Record<string, number>; mealType?: MealType; dietPreference?: string };
    const memory = Array.isArray(body.memory) ? body.memory.slice(0, 40) : [];
    if (memory.length < 3) return NextResponse.json({ error: "Log at least three meals first" }, { status: 400 });
    const type = body.mealType || "lunch";
    const today = body.todayTotals || {}; const goals = body.goals || {};
    const remainingCalories = Math.max(0, (goals.calories || 0) - (today.calories || 0));
    const ranked = [...memory].sort((a, b) => ((b.frequency - a.frequency) * 3) + (new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()) / 86400000 - ((a.mealType === type ? 0 : 2) - (b.mealType === type ? 0 : 2)));
    const first = ranked[0], second = ranked.find((m) => m.id !== first.id) || ranked[1], third = ranked.find((m) => m.id !== first.id && m.id !== second?.id) || ranked[2];
    const name = (m: MealMemoryItem) => m.dishes.join(" + ");
    return NextResponse.json({ recommendations: [
      { id: "routine", kind: "familiar", title: name(first), reason: `A familiar ${type} from your recent routine.`, adjustments: [], basedOnMealIds: [first.id], representativeMealId: first.id },
      { id: "healthier", kind: "healthier", title: `${name(second)} — balanced version`, reason: "Keeps a meal you know while adding a little more balance.", adjustments: [second.tags.includes("high-carb") ? "Add a protein-rich side" : "Add vegetables or a fiber-rich side", "Use less oil when preparing it"], basedOnMealIds: [second.id], representativeMealId: second.id },
      { id: "gap", kind: "familiar", title: name(third), reason: remainingCalories > 0 ? `Fits a remaining daily target of about ${Math.round(remainingCalories)} kcal.` : "A familiar option to keep portions comfortable today.", adjustments: remainingCalories > 0 ? ["Choose a portion that matches your remaining target"] : ["Keep the portion moderate"], basedOnMealIds: [third.id], representativeMealId: third.id },
    ] });
  } catch { return NextResponse.json({ error: "Invalid recommendation request" }, { status: 400 }); }
}
