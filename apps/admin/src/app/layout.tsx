import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "../lib/supabase/server";
import { cookies } from "next/headers";
import { Shell } from "../components/Shell";
import { SIDEBAR_COOKIE } from "../lib/sidebar";

import { Inter, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"
import { ThemeScript } from "@/components/ThemeScript";
import { canOpenStore } from "../lib/merchant-identity";
import { hasActivePlan, storeLimitMessage, underStoreLimit } from "../lib/plans";

const spaceGroteskHeading = Space_Grotesk({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Bitvora Stores",
  description: "Storefronts that look like your brand.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

    const { data: merchant } = user
    ? await supabase.from('merchants').select('id, is_owner, is_admin, is_suspended, full_name, avatar_url, verification_status, phone_verified_at, plan, subscription_status, current_period_end').eq('user_id', user.id).single()
    : { data: null };

  // At the plan's store limit, New store stays in the sidebar but opens the upgrade popup.
  const isStaff = !!merchant?.is_owner || !!merchant?.is_admin;
  const { count: storeCount } = merchant && !isStaff && hasActivePlan(merchant)
    ? await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('merchant_id', merchant.id)
    : { count: 0 };
  const atStoreLimit = !!merchant && hasActivePlan(merchant) && !underStoreLimit(merchant.plan, storeCount ?? 0);

  return (
    // suppressHydrationWarning: ThemeScript mutates this element's class
    // before React hydrates, which would otherwise trigger a mismatch warning.
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable, spaceGroteskHeading.variable)}>
      <head>
        <ThemeScript />
      </head>
      <body className="antialiased bg-paper text-ink">
        <Shell
        userEmail={user?.email ?? null}
        merchantId={merchant?.id ?? null}
        staffRole={merchant?.is_owner ? 'owner' : merchant?.is_admin ? 'admin' : null}
        merchantName={merchant?.full_name}
        avatarUrl={merchant?.avatar_url}
        canCreateStore={canOpenStore(merchant)}
        storeLimitMessage={atStoreLimit ? storeLimitMessage(merchant?.plan) : null}
        sidebarCollapsed={(await cookies()).get(SIDEBAR_COOKIE)?.value === '1'}
          >
      {children}
      </Shell>
      <Analytics/>
      </body>
    </html>
    
  );
}