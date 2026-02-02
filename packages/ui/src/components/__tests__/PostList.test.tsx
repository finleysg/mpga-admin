import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { PostList } from "../PostList";

describe("PostList", () => {
  const mockPosts = [
    {
      id: 1,
      title: "First Post",
      slug: "first-post",
      excerpt: "First excerpt",
      createdAt: new Date("2024-01-15"),
    },
    {
      id: 2,
      title: "Second Post",
      slug: "second-post",
      excerpt: "Second excerpt",
      createdAt: new Date("2024-01-16"),
    },
  ];

  it("renders list of posts", () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("Second Post")).toBeInTheDocument();
  });

  it("renders post excerpts", () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText("First excerpt")).toBeInTheDocument();
    expect(screen.getByText("Second excerpt")).toBeInTheDocument();
  });

  it("renders links to post pages", () => {
    render(<PostList posts={mockPosts} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/posts/first-post");
    expect(links[1]).toHaveAttribute("href", "/posts/second-post");
  });

  it("shows empty message when no posts", () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText("No posts found.")).toBeInTheDocument();
  });
});
