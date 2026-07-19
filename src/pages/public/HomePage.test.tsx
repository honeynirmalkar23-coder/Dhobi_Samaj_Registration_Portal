import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("shows a non-blocking payment notice from redirect state", () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/",
            state: {
              paymentNotice: {
                kind: "warning",
                message: "Payment proof submitted successfully. Automatic acknowledgement download failed."
              }
            }
          }
        ]}
      >
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Payment proof submitted successfully. Automatic acknowledgement download failed."
    );
  });
});
