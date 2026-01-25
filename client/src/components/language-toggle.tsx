import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "English" ? "Arabic" : "English");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      data-testid="button-language-toggle"
      title={language === "English" ? "Switch to Arabic" : "Switch to English"}
    >
      <span className="text-sm font-semibold">
        {language === "English" ? "AR" : "EN"}
      </span>
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}
