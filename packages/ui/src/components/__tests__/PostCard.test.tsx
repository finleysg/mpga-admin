import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PostCard } from "../PostCard";

describe("PostCard", () => {
  const mockPost = {
    id: 1,
    title: "Test Post Title",
    slug: "test-post-title",
    excerpt: "This is a test excerpt",
    content: "<p>Test content</p>",
    published: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  };

  it("renders post title", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Test Post Title",
    );
  });

  it("renders excerpt when provided", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("This is a test excerpt")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<PostCard post={mockPost} />);
    // Date formatting varies by timezone, so we check for any valid date pattern
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it("renders content as HTML when provided", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("does not render excerpt when not provided", () => {
    const postWithoutExcerpt = { ...mockPost, excerpt: null };
    render(<PostCard post={postWithoutExcerpt} />);
    expect(
      screen.queryByText("This is a test excerpt"),
    ).not.toBeInTheDocument();
  });
});
