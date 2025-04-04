import { PortfolioProvider } from "@/context/PortfolioContext";
import Create from "./Create";

export default function CreateWrapper() {
  return (
    <PortfolioProvider>
      <Create />
    </PortfolioProvider>
  );
}