import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("should render with default variant and size", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("should render with different variants", () => {
    // Arrange & Act - Test destructive variant
    const { rerender } = render(<Button variant="destructive">Delete</Button>);

    // Assert
    let button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-destructive", "text-white");

    // Arrange & Act - Test outline variant
    rerender(<Button variant="outline">Outline</Button>);

    // Assert
    button = screen.getByRole("button", { name: /outline/i });
    expect(button).toHaveClass("border", "border-gray-200", "bg-card");
  });

  it("should render with different sizes", () => {
    // Arrange & Act - Test small size
    const { rerender } = render(<Button size="sm">Small</Button>);

    // Assert
    let button = screen.getByRole("button", { name: /small/i });
    expect(button).toHaveClass("h-9", "rounded-xl");

    // Arrange & Act - Test large size
    rerender(<Button size="lg">Large</Button>);

    // Assert
    button = screen.getByRole("button", { name: /large/i });
    expect(button).toHaveClass("h-12", "rounded-xl", "px-8");
  });

  it("should render as child component when asChild is true", () => {
    // Arrange & Act
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    // Assert
    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("should handle click events", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);

    // Act
    await user.click(screen.getByRole("button", { name: /clickable/i }));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<Button disabled>Disabled Button</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50", "disabled:pointer-events-none");
  });

  it("should merge custom className with default classes", () => {
    // Arrange & Act
    render(<Button className="custom-class">Custom</Button>);

    // Assert
    const button = screen.getByRole("button", { name: /custom/i });
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveClass("inline-flex", "items-center"); // Default classes still present
  });
});
