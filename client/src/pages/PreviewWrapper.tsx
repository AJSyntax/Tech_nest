import { PortfolioProvider } from "@/context/PortfolioContext";
import Preview from "./Preview";

export default function PreviewWrapper() {
  return (
    <PortfolioProvider>
      <Preview />
    </PortfolioProvider>
  );
}