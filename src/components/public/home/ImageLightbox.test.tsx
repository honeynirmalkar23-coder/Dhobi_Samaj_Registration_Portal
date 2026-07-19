import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { communityImages } from "../../../config/images.config";
import { ImageLightbox } from "./ImageLightbox";
import type { LightboxImage } from "./ImageLightbox";

const images: LightboxImage[] = [
  {
    src: communityImages.heritagePhotoOne,
    alt: "सामुदायिक जीवन की एक ऐतिहासिक झलक",
    caption: "सामुदायिक जीवन की एक ऐतिहासिक झलक",
    description: "खास जानकारी: संत गाडगे बाबा समाज सुधारक थे।",
    source: "स्रोत: विकिपीडिया"
  },
  {
    src: communityImages.heritagePhotoTwo,
    alt: "सेवा और मानवीय संवाद का दृश्य",
    caption: "सेवा और मानवीय संवाद का दृश्य"
  }
];

function LightboxHarness() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      <button onClick={() => setIsOpen(true)} type="button">
        बड़ा चित्र देखें
      </button>
      <ImageLightbox
        activeIndex={activeIndex}
        images={images}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onIndexChange={setActiveIndex}
        title="समाज की विरासत"
      />
    </>
  );
}

describe("ImageLightbox", () => {
  it("opens, closes with the close button, and restores focus", async () => {
    const user = userEvent.setup();
    render(<LightboxHarness />);

    const openButton = screen.getByRole("button", { name: "बड़ा चित्र देखें" });
    await user.click(openButton);

    expect(screen.getByRole("dialog", { name: "समाज की विरासत" })).toBeInTheDocument();
    expect(screen.getByText("खास जानकारी: संत गाडगे बाबा समाज सुधारक थे।")).toBeInTheDocument();
    expect(screen.getByText("स्रोत: विकिपीडिया")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "बड़ा चित्र बंद करें" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    render(<LightboxHarness />);

    await user.click(screen.getByRole("button", { name: "बड़ा चित्र देखें" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the dialog", async () => {
    const user = userEvent.setup();
    render(<LightboxHarness />);

    await user.click(screen.getByRole("button", { name: "बड़ा चित्र देखें" }));
    await user.click(screen.getByRole("dialog", { name: "समाज की विरासत" }));

    expect(screen.getByRole("dialog", { name: "समाज की विरासत" })).toBeInTheDocument();
  });
});
