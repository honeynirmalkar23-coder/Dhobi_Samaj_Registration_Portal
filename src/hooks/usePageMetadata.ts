import { useEffect } from "react";
import { appConfig } from "../config/app.config";

type PageMetadata = {
  title: string;
  description?: string;
  ogImage?: string;
};

function setNamedMeta(name: string, content: string): void {
  document.querySelector(`meta[name="${name}"]`)?.setAttribute("content", content);
}

function setPropertyMeta(property: string, content: string): void {
  document
    .querySelector(`meta[property="${property}"]`)
    ?.setAttribute("content", content);
}

export function usePageMetadata({
  title,
  description = appConfig.description,
  ogImage
}: PageMetadata): void {
  useEffect(() => {
    const computedTitle =
      title === appConfig.hindiName ? title : `${title} | ${appConfig.hindiName}`;

    document.title = computedTitle;
    setNamedMeta("description", description);
    setPropertyMeta("og:title", computedTitle);
    setPropertyMeta("og:description", description);
    if (ogImage) {
      setPropertyMeta("og:image", ogImage);
    }
  }, [description, ogImage, title]);
}
