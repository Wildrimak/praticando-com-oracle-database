"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ExerciseWorkspace } from "@/components/exercise/ExerciseWorkspace";
import { getExerciseBySlug } from "@/content/exercises";

export default function ExercisePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = use(params);
  const exercise = getExerciseBySlug(slug);

  if (!exercise) {
    notFound();
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar currentSlug={slug} />
        <main className="min-w-0 flex-1">
          <ExerciseWorkspace exercise={exercise} />
        </main>
      </div>
    </div>
  );
}
