/**
 * Tests for InvitationCard component
 * Tests different invitation types and user interactions
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InvitationCard from "../../components/dashboard/InvitationCard";
import type { InvitationCardVM } from "../../components/dashboard/types";

describe("InvitationCard", () => {
  const mockOnAccept = vi.fn();
  const mockOnDecline = vi.fn();

  const baseInvitation: InvitationCardVM = {
    id: "inv-123",
    groupId: "group-123",
    groupName: "Test Group",
    invitationType: "existing_user",
    createdAt: "2025-11-06T10:00:00Z",
  };

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnDecline.mockClear();
  });

  describe("Existing user invitations", () => {
    const existingUserInvitation: InvitationCardVM = {
      ...baseInvitation,
      invitationType: "existing_user",
    };

    it("displays correct message for existing user", () => {
      render(<InvitationCard invitation={existingUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      expect(screen.getByText("Test Group")).toBeInTheDocument();
      expect(screen.getByText("Zaproszenie do dołączenia do grupy")).toBeInTheDocument();
    });

    it("shows accept and decline buttons", () => {
      render(<InvitationCard invitation={existingUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });

    it("calls onAccept when accept button is clicked", async () => {
      render(<InvitationCard invitation={existingUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      const acceptButton = screen.getByRole("button", { name: /akceptuj/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(mockOnAccept).toHaveBeenCalledWith("inv-123");
      });
    });

    it("calls onDecline when decline button is clicked", async () => {
      render(<InvitationCard invitation={existingUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      const declineButton = screen.getByRole("button", { name: /odrzuć/i });
      fireEvent.click(declineButton);

      await waitFor(() => {
        expect(mockOnDecline).toHaveBeenCalledWith("inv-123");
      });
    });
  });

  describe("New user invitations", () => {
    const newUserInvitation: InvitationCardVM = {
      ...baseInvitation,
      invitationType: "new_user",
    };

    it("displays correct message for new user", () => {
      render(<InvitationCard invitation={newUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      expect(screen.getByText("Test Group")).toBeInTheDocument();
      expect(screen.getByText("Zaproszenie do rejestracji i dołączenia do grupy")).toBeInTheDocument();
    });

    it("shows accept and decline buttons for new users", () => {
      render(<InvitationCard invitation={newUserInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });
  });

  describe("Disabled state", () => {
    it("disables buttons when disabled prop is true", () => {
      render(
        <InvitationCard invitation={baseInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} disabled={true} />
      );

      const acceptButton = screen.getByRole("button", { name: /akceptuj/i });
      const declineButton = screen.getByRole("button", { name: /odrzuć/i });

      expect(acceptButton).toBeDisabled();
      expect(declineButton).toBeDisabled();
    });
  });

  describe("Error display", () => {
    it("shows error message when error prop is provided", () => {
      const errorMessage = "Failed to accept invitation";

      render(
        <InvitationCard
          invitation={baseInvitation}
          onAccept={mockOnAccept}
          onDecline={mockOnDecline}
          error={errorMessage}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has correct aria-label", () => {
      render(<InvitationCard invitation={baseInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      const article = screen.getByRole("article");
      expect(article).toHaveAttribute("aria-label", "Zaproszenie do grupy Test Group");
    });

    it("has accessible button labels", () => {
      render(<InvitationCard invitation={baseInvitation} onAccept={mockOnAccept} onDecline={mockOnDecline} />);

      expect(screen.getByRole("button", { name: /akceptuj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /odrzuć/i })).toBeInTheDocument();
    });
  });
});
