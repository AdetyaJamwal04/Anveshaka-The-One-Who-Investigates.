import React from "react";
import { render, screen } from "@testing-library/react";
import PipelineTracker from "./PipelineTracker";
import type { StageState } from "@/lib/types";

describe("PipelineTracker", () => {
  it("renders correctly with pending stages", () => {
    const stages: StageState[] = [
      { name: "Decompose", status: "completed" },
      { name: "Search", status: "active" },
      { name: "Reflect", status: "pending" },
    ];

    render(<PipelineTracker stages={stages} />);

    expect(screen.getByText("Decompose")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Reflect")).toBeInTheDocument();
  });
});