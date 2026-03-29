import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { ChevronDown, Leaf } from "lucide-react";

type NavPage = "home" | "analysis" | "results";

interface NavbarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal.slice(0, 5);

  const navLinks: { label: string; page: NavPage }[] = [
    { label: "Analysis", page: "home" },
    { label: "My Projects", page: "home" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate("home")}
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-base text-foreground tracking-tight leading-tight">
              VaastuSure
            </span>
            <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight tracking-wide">
              Ancient wisdom, modern solution
            </span>
          </div>
        </button>

        {/* Nav links */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          {navLinks.map(({ label, page }) => (
            <button
              type="button"
              key={label}
              onClick={() => onNavigate(page)}
              data-ocid="nav.link"
              className={`text-sm font-medium transition-colors pb-0.5 ${
                currentPage === page
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
          <a
            href="#knowledge"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.link"
          >
            Knowledge Hub
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.link"
          >
            Pricing
          </a>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button
                onClick={() => onNavigate("home")}
                className="hidden sm:flex rounded-full bg-primary text-primary-foreground hover:opacity-90 text-sm px-5 py-2 h-auto"
                data-ocid="nav.primary_button"
              >
                Get Analysis
              </Button>
              <button
                type="button"
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={clear}
                data-ocid="nav.toggle"
                title="Log out"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-vastu-mint text-primary text-xs font-semibold">
                    {shortPrincipal}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </>
          ) : (
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="rounded-full bg-primary text-primary-foreground hover:opacity-90 text-sm px-5 py-2 h-auto"
              data-ocid="nav.primary_button"
            >
              {isLoggingIn ? "Connecting…" : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
