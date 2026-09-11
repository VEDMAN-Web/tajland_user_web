import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorldSection } from "../sections/WorldSection";
import { homePageContent } from "../data/home.mock";

describe("WorldSection", () => {
  it("renders the earth media inside a player frame", () => {
    render(<WorldSection content={homePageContent.world} />);

    expect(
      screen.getByRole("img", { name: homePageContent.world.alt }),
    ).toBeInTheDocument();
    expect(screen.getByText(homePageContent.world.playerUrl as string)).toBeInTheDocument();
  });

  it("renders a muted looping video when video content is provided", () => {
    render(
      <WorldSection
        content={{
          alt: "Earth orbit video",
          playerUrl: "tajlandia.com",
          video: {
            src: "/videos/home/earth.mp4",
            poster: homePageContent.world.image,
          },
        }}
      />,
    );

    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.autoplay).toBe(true);
    expect(video?.muted).toBe(true);
    expect(video?.loop).toBe(true);
    expect(video?.playsInline).toBe(true);
    expect(screen.getByText("tajlandia.com")).toBeInTheDocument();
  });

  it("renders nothing when media is missing", () => {
    const { container } = render(<WorldSection content={{ alt: "Earth" }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
