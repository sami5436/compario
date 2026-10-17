import { renderShareCard, shareAlt, shareSize } from "./share-card";

export const alt = shareAlt;
export const size = shareSize;
export const contentType = "image/png";

export default function Image() {
  return renderShareCard();
}
