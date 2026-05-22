import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import InvestorsList from "@/pages/investors-list";
import InvestmentAgreementTemplates from "@/pages/investment-agreement-templates";

export default function InvestorsHub() {
  const { language } = useLanguage();
  const isRtl = language === "Arabic" || language === "Urdu";

  const labels = {
    investors: isRtl ? "المستثمرون" : "Investors",
    template: isRtl ? "تعديل قالب الاتفاقية" : "Edit Agreement Template",
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="p-4">
      <Tabs defaultValue="investors" className="w-full">
        <TabsList>
          <TabsTrigger value="investors" data-testid="tab-investors">
            {labels.investors}
          </TabsTrigger>
          <TabsTrigger value="template" data-testid="tab-agreement-template">
            {labels.template}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="investors" className="mt-4">
          <InvestorsList />
        </TabsContent>

        <TabsContent value="template" className="mt-4">
          <InvestmentAgreementTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
