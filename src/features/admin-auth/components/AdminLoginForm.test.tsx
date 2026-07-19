import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminLoginForm } from "./AdminLoginForm";

describe("AdminLoginForm", () => {
  it("shows validation errors", async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "लॉगिन करें" }));

    expect(await screen.findByText("कृपया ईमेल पता दर्ज करें।")).toBeInTheDocument();
    expect(screen.getByText("कृपया पासवर्ड दर्ज करें।")).toBeInTheDocument();
  });

  it("toggles password visibility without clearing the password", async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm onSubmit={vi.fn()} />);
    const passwordInput = screen.getByPlaceholderText("पासवर्ड दर्ज करें");

    await user.type(passwordInput, " secret ");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "पासवर्ड दिखाएं" }));

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveValue(" secret ");

    await user.click(screen.getByRole("button", { name: "पासवर्ड छिपाएं" }));

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("submits normalized credentials and shows a generic error on failure", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Raw Supabase error"));
    render(<AdminLoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/ईमेल पता/), " ADMIN@EXAMPLE.TEST ");
    await user.type(screen.getByPlaceholderText("पासवर्ड दर्ज करें"), "password");
    await user.click(screen.getByRole("button", { name: "लॉगिन करें" }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: "admin@example.test",
      password: "password"
    });
    expect(
      await screen.findByText("ईमेल या पासवर्ड सही नहीं है, अथवा आपको प्रशासनिक पहुंच प्राप्त नहीं है।")
    ).toBeInTheDocument();
    expect(screen.queryByText("Raw Supabase error")).not.toBeInTheDocument();
  });
});
