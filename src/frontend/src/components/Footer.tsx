import { Leaf } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utm = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  const links = [
    {
      heading: "Product",
      items: ["Features", "Pricing", "Knowledge Hub", "Changelog"],
    },
    {
      heading: "Support",
      items: ["Documentation", "FAQ", "Contact Us", "Community"],
    },
    {
      heading: "Legal",
      items: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
    },
  ];

  return (
    <footer
      className="bg-vastu-footer text-white/80"
      data-ocid="footer.section"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/80 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">
                VastuVision AI
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Intelligent Vastu analysis for homeowners, architects, and real
              estate buyers.
            </p>
          </div>

          {/* Link columns */}
          {links.map(({ heading, items }) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
                {heading}
              </h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <span className="text-sm text-white/60 cursor-default">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>
            &copy; {year}. Built with &hearts; using{" "}
            <a
              href={utm}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 underline"
            >
              caffeine.ai
            </a>
          </span>
          <span>
            Vastu Shastra &middot; Ancient Wisdom &middot; Modern Technology
          </span>
        </div>
      </div>
    </footer>
  );
}
