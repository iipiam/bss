import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InvestorsHub() {
  const { language } = useLanguage();
  const isRtl = language === "Arabic" || language === "Urdu";

  const labels = {
    title: isRtl ? "المستثمرون" : "Investors",
    subtitle: isRtl
      ? "اختر ما تريد إدارته"
      : "Choose what you want to manage",
    investors: isRtl ? "المستثمرون" : "Investors",
    investorsDesc: isRtl
      ? "إدارة المستثمرين والأرباح والاتفاقيات"
      : "Manage investors, earnings, and agreements",
    template: isRtl ? "تعديل قالب الاتفاقية" : "Edit Agreement Template",
    templateDesc: isRtl
      ? "تخصيص قوالب اتفاقيات الاستثمار"
      : "Customize investment agreement templates",
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-investors-hub-title">
          {labels.title}
        </h1>
        <p className="text-muted-foreground">{labels.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/investors/list" data-testid="link-investors-list">
          <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-md bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{labels.investors}</h2>
                <p className="text-sm text-muted-foreground">{labels.investorsDesc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/investment-agreement-templates" data-testid="link-agreement-templates">
          <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{labels.template}</h2>
                <p className="text-sm text-muted-foreground">{labels.templateDesc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
