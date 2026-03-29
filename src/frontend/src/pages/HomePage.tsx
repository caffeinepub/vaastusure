import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useDeleteAnalysis, useGetUserAnalyses } from "@/hooks/useQueries";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileImage,
  FileText,
  Heart,
  Leaf,
  Smile,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface HomePageProps {
  onFileSelect: (file: File, preview: string | null) => void;
}

const SAMPLE_PROJECTS = [
  {
    id: "s1",
    name: "Rajiv Sharma Residence",
    address: "12 Lotus Colony, New Delhi",
    score: 82,
    date: "Mar 22, 2026",
  },
  {
    id: "s2",
    name: "Green Valley Villa",
    address: "Sector 45, Gurgaon, Haryana",
    score: 67,
    date: "Mar 18, 2026",
  },
  {
    id: "s3",
    name: "Sunrise Apartments - Unit 3B",
    address: "Andheri West, Mumbai",
    score: 91,
    date: "Mar 10, 2026",
  },
];

function getScoreColor(score: number) {
  if (score >= 70) return "text-primary bg-vastu-lime";
  if (score >= 40) return "text-amber-700 bg-vastu-yellow";
  return "text-red-700 bg-vastu-red";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs Attention";
}

const VASTU_TIPS = [
  {
    num: 1,
    title: "Check the Shape of the Property",
    desc: "The shape of the room should always be rectangular or square. These shapes are considered auspicious and ensure the smooth flow and balance of energy. If some rooms are irregular in shape, consider adding plants to correct the energy flow.",
  },
  {
    num: 2,
    title: "Check the Orientation & Entrance",
    desc: "Property orientation is crucial in Vastu Shastra. Ideally, a property should have its main entrance facing north, east, or northeast. These directions are considered highly auspicious and are believed to bring prosperity, health, and positive energy into the home.",
  },
  {
    num: 3,
    title: "Vastu Tips for Living Room",
    desc: "The living room should ideally be located in the north, east or northeast direction. Keep the living room clutter-free. Use light colour paints like whites, creams and pastels. Keep the furniture in the west or southwest direction. Place mirrors on the north wall.",
  },
  {
    num: 4,
    title: "Vastu Tips for Kitchen",
    desc: "The kitchen should be placed in the southeast direction. Use yellow, orange, or red colors for the walls. The stove should be placed in the southeast direction. Never keep the gas stove and water sink on the same platform.",
  },
  {
    num: 5,
    title: "Vastu Tips for Bathroom",
    desc: "A bathroom in the north or northwest part is the most favourable. Avoid bathrooms directly facing the kitchen or the main entrance. The toilet should face north-south and should not be located in the northeast or southwest corners. Use light and soothing colours like pastels for walls.",
  },
  {
    num: 6,
    title: "Vastu Tips for Dining Area",
    desc: "The dining table should be square or rectangular, avoid circular shapes. The dining table can be positioned in the east or southeast part of your home, avoid southwest direction. Pick light colours like beige, peach or cream.",
  },
  {
    num: 7,
    title: "Vastu Tips for Balcony",
    desc: "Balconies should face north or east to capture the morning sunlight. Add plants like bamboo, jasmine, and tulsi for peace and prosperity. Avoid storing garbage bins or broken items on the balcony.",
  },
  {
    num: 8,
    title: "Vastu Tips for Master Bedroom",
    desc: "Southwest is the best direction for the master bedroom. The bed head should point towards south or west. Opt for soothing tones like browns, beiges, or greens. Heavy furniture like wardrobes can be placed in the southwest, south or west direction.",
  },
  {
    num: 9,
    title: "Vastu Tips for Kids Bedroom",
    desc: "The kid's bedroom should be in the west or northwest direction. The bed head should face south or east. Use light and cheerful colours like light greens, blues, and yellows. Place the study table in the east or north.",
  },
  {
    num: 10,
    title: "Vastu Tips for Pooja Room",
    desc: "The northeast corner is the most auspicious site for a pooja room. Use light colours like white, light yellow or light blue for the walls. A well-lit lamp should be placed in the southeast direction of the pooja room.",
  },
  {
    num: 11,
    title: "Vastu Tips for Colour & Lighting",
    desc: "Living areas benefit from bright colours like blue, green, or yellow. Bedrooms should use soothing earth tones such as beige, light brown, or soft greens. For artificial lighting, opt for soft, warm lights. Avoid harsh fluorescent lights.",
  },
  {
    num: 12,
    title: "Vastu Tips for Windows & Doors",
    desc: "Windows and doors should always open outside. The main door should face north, east, or northeast. Windows should be large and open towards the north or east to allow ample sunlight and fresh air.",
  },
  {
    num: 13,
    title: "Vastu Tips for Storeroom",
    desc: "The storeroom should ideally be located in the southwest or northwest part of the home. Heavy items should be stored in the southwest corner. Ensure the door of the storeroom opens inward.",
  },
  {
    num: 14,
    title: "Vastu Tips for Water Placement",
    desc: "Water elements like fish aquariums or indoor water fountains should be placed in the northeast or east of the home. Avoid placing water elements in the southeast, as this can attract negative energy and financial issues.",
  },
  {
    num: 15,
    title: "Vastu Tips for Clocks",
    desc: "Clocks should be placed on the north or east side of rooms. Ensure that the clocks are always in working condition. Clocks should not be positioned directly opposite the bed.",
  },
];

const THINGS_TO_AVOID = [
  "Do Not Store Things Under the Bed — keeping that area clutter-free promotes free energy flow and better relaxation.",
  "Avoid Keeping Broken Furniture — broken items or non-functional electrical equipment attract negative energy.",
  "Avoid Blocked Entrances — ensure the main entrance is not obstructed by poles, beams, or any objects that block energy flow.",
  "Repair Those Leaky Faucets — water leakage represents a drain in finances; fix and repair leaks without delay.",
  "Do Not Use Dark Colours — avoid navy blue and black as these colours can attract negative energy.",
];

const BENEFITS = [
  {
    icon: Heart,
    title: "Improves Relationships",
    desc: "Proper directions and room placements improve relationships among family members by balancing energies within the home.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    icon: Smile,
    title: "Promotes Good Health & Wellbeing",
    desc: "By ensuring positive energy flow, Vastu improves physical and mental well-being, leading to superior health.",
    color: "text-primary",
    bg: "bg-vastu-mint",
  },
  {
    icon: Sparkles,
    title: "Reduces Stress & Negativity",
    desc: "A proper vastu-compliant home minimizes the flow of negative energies, which helps reduce stress and improves overall quality of life.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: Star,
    title: "Boosts Spiritual Growth",
    desc: "The strategic positioning of the indoor temple and entrances can improve spiritual practices, fostering a sense of tranquillity and higher energy.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
];

const EXPERTS = [
  {
    name: "Ravi Kumar",
    exp: 22,
    title: "Vastu Consultant",
    city: "Delhi",
    country: "India",
    specialty: "Residential Vastu",
    bio: "Renowned for transforming living spaces using traditional Vastu principles. Served 500+ families across North India.",
    contact: "ravi@vaastuguru.in",
  },
  {
    name: "Priya Nair",
    exp: 15,
    title: "Vastu & Feng Shui Expert",
    city: "Mumbai",
    country: "India",
    specialty: "Holistic Home Energy",
    bio: "Blends Vastu and Feng Shui for holistic home energy balancing. Specializes in apartment and flat layouts.",
    contact: "priya@energyhome.in",
  },
  {
    name: "Arjun Sharma",
    exp: 18,
    title: "Architect & Vastu Expert",
    city: "Bengaluru",
    country: "India",
    specialty: "Corporate & Residential",
    bio: "Architect turned Vastu consultant. Helps tech companies and homeowners design Vastu-compliant spaces.",
    contact: "arjun@vastuvision.in",
  },
  {
    name: "Meena Iyer",
    exp: 12,
    title: "Vastu Consultant",
    city: "Chennai",
    country: "India",
    specialty: "South Indian Vastu",
    bio: "Practitioner of traditional South Indian Vastu (Thachu Shastra). Expert in temple-based directional science.",
    contact: "meena@southvastu.in",
  },
  {
    name: "Suresh Patel",
    exp: 20,
    title: "Vastu Shastra Practitioner",
    city: "Ahmedabad",
    country: "India",
    specialty: "Commercial Spaces",
    bio: "Gujarat's leading commercial Vastu consultant. Worked with 200+ businesses for optimal space design.",
    contact: "suresh@vaastupatel.in",
  },
  {
    name: "Deepa Verma",
    exp: 10,
    title: "Vastu & Astro Expert",
    city: "Hyderabad",
    country: "India",
    specialty: "Vastu + Astrology",
    bio: "Unique combination of Vastu Shastra and Vedic astrology for a personalised home energy plan.",
    contact: "deepa@astrovastu.in",
  },
  {
    name: "Rajesh Malhotra",
    exp: 25,
    title: "Senior Vastu Expert",
    city: "Singapore",
    country: "Singapore",
    specialty: "International Diaspora",
    bio: "Serving the Indian diaspora for 25 years. Expert in adapting Indian Vastu principles to international homes.",
    contact: "rajesh@globalvastu.com",
  },
  {
    name: "Anita Bose",
    exp: 14,
    title: "Vastu Consultant",
    city: "Dubai",
    country: "UAE",
    specialty: "NRI Homes & Apartments",
    bio: "Specialist in NRI home consultations across the UAE. Online and in-person sessions available.",
    contact: "anita@vaastudubai.com",
  },
];

function VaastuExpertsTab() {
  const [search, setSearch] = useState("");
  const filtered = EXPERTS.filter(
    (e) =>
      e.city.toLowerCase().includes(search.toLowerCase()) ||
      e.country.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.specialty.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vaastu Experts</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with certified Vastu consultants across India and worldwide
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by city, country or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            data-ocid="experts.search_input"
          />
        </div>
      </div>
      {filtered.length === 0 && (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="experts.empty_state"
        >
          No experts found for{" "}
          <span className="font-medium text-foreground">"{search}"</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((expert, i) => (
          <div
            key={expert.name}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3"
            data-ocid={`experts.item.${i + 1}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                {expert.name.charAt(0)}
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                {expert.specialty}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{expert.name}</h3>
              <p className="text-xs text-muted-foreground">{expert.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {expert.bio}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                📍 {expert.city}, {expert.country}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {expert.exp} yrs exp
              </span>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                className="flex-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg py-2"
                onClick={() =>
                  window.open(
                    `mailto:${expert.contact}?subject=Book Consultation`,
                    "_blank",
                  )
                }
                data-ocid={`experts.book_button.${i + 1}`}
              >
                Book Consultation
              </button>
              <button
                type="button"
                className="text-xs font-medium text-emerald-700 border border-emerald-600 hover:bg-emerald-50 transition-colors rounded-lg py-2 px-3"
                onClick={() =>
                  window.open(`mailto:${expert.contact}`, "_blank")
                }
                data-ocid={`experts.contact_button.${i + 1}`}
              >
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRODUCTS = [
  {
    name: "Vastu Pyramid",
    category: "Energy Tools",
    description:
      "Enhances positive energy flow and removes doshas from your space.",
    benefit: "Place in the center of your home for maximum effect.",
  },
  {
    name: "Crystal Ball",
    category: "Crystals",
    description:
      "Attracts clarity, positive vibrations, and dispels negativity.",
    benefit: "Ideal for living rooms and study areas.",
  },
  {
    name: "Rose Quartz Crystal",
    category: "Crystals",
    description: "Promotes love, harmony, and lasting peace within the home.",
    benefit: "Best placed in the bedroom or relationship corner.",
  },
  {
    name: "Meru Yantra",
    category: "Yantras",
    description: "Sacred geometry tool for prosperity, success, and abundance.",
    benefit: "Face east while placing for best results.",
  },
  {
    name: "Shri Yantra",
    category: "Yantras",
    description: "The most powerful yantra for wealth, abundance, and fortune.",
    benefit: "Place on an altar facing north or east.",
  },
  {
    name: "Vastu Photo Frame",
    category: "Decor",
    description:
      "Deity photo frames with Vastu symbols that radiate positive energy.",
    benefit: "Hang at the main entrance for blessings.",
  },
  {
    name: "Copper Tortoise",
    category: "Figurines",
    description: "Symbol of longevity, stability, and lasting good luck.",
    benefit: "Place facing north in the living room.",
  },
  {
    name: "Copper Pyramid Set",
    category: "Energy Tools",
    description: "Set of 9 pyramids to energize all zones of your home.",
    benefit: "Place at the 9 directional points of your floor plan.",
  },
  {
    name: "Wind Chime (7 Rods)",
    category: "Decor",
    description: "Clears stagnant energy and invites good luck and prosperity.",
    benefit: "Hang at north or west-facing windows or doors.",
  },
  {
    name: "Vastu Painting (Sunrise)",
    category: "Decor",
    description:
      "East-facing sunrise art that brings positivity and new beginnings.",
    benefit: "Hang on the east wall of living or dining area.",
  },
  {
    name: "Amethyst Crystal Cluster",
    category: "Crystals",
    description: "Purifies the environment and promotes calm, restful energy.",
    benefit: "Great for bedrooms and meditation corners.",
  },
  {
    name: "Navgraha Yantra",
    category: "Yantras",
    description: "Balances all nine planetary energies within the home.",
    benefit: "Place in the pooja room for spiritual harmony.",
  },
];

const PRODUCT_CATEGORIES = [
  "All",
  "Energy Tools",
  "Crystals",
  "Yantras",
  "Decor",
  "Figurines",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Energy Tools": "bg-amber-50 text-amber-700 border-amber-200",
  Crystals: "bg-purple-50 text-purple-700 border-purple-200",
  Yantras: "bg-orange-50 text-orange-700 border-orange-200",
  Decor: "bg-sky-50 text-sky-700 border-sky-200",
  Figurines: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function VaastuProductsTab() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered =
    activeCategory === "All"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Vaastu Products</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Curated products to energize and harmonize your living space
        </p>
      </div>
      <div className="flex flex-wrap gap-2" data-ocid="products.tab">
        {PRODUCT_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${activeCategory === cat ? "bg-emerald-600 text-white border-emerald-600" : "bg-muted/50 text-muted-foreground border-border hover:border-emerald-400 hover:text-emerald-700"}`}
            data-ocid={"products.toggle"}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product, i) => (
          <div
            key={product.name}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-2.5"
            data-ocid={`products.item.${i + 1}`}
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center text-2xl">
              {product.category === "Crystals"
                ? "💎"
                : product.category === "Yantras"
                  ? "🔯"
                  : product.category === "Energy Tools"
                    ? "🔺"
                    : product.category === "Decor"
                      ? "🖼️"
                      : "🐢"}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                {product.name}
              </h3>
              <span
                className={`text-xs border px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[product.category] || "bg-muted text-muted-foreground border-border"}`}
              >
                {product.category}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5 leading-relaxed">
              ✨ {product.benefit}
            </p>
            <button
              type="button"
              className="w-full text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg py-2"
              onClick={() =>
                window.open(
                  `https://www.amazon.in/s?k=${encodeURIComponent(`${product.name} vastu`)}`,
                  "_blank",
                )
              }
              data-ocid={`products.buy_button.${i + 1}`}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VaastuTipsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-12"
    >
      {/* Intro */}
      <div className="bg-vastu-mint rounded-2xl p-6 border border-primary/10">
        <div className="flex items-start gap-3 mb-3">
          <Leaf className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <h2 className="text-lg font-semibold text-foreground">
            Vastu Shastra for Your New Home
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The homebuying journey is filled with opportunities. Once you have
          decided on your dream home, setting up a new home is an opportunity to
          craft a space filled with positive energy and harmony. Vastu Shastra,
          an ancient Indian science is quite important when it comes to setting
          up or designing a new home. The concept of Vastu for house is rooted
          in a belief that aligning a space with cosmic principles can bring
          prosperity and happiness.
        </p>
      </div>

      {/* Important Tips */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Important Vastu Tips for House
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Follow these guidelines room by room to create a harmonious,
          energy-balanced home.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VASTU_TIPS.map((tip, i) => (
            <motion.div
              key={tip.num}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {tip.num}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Things to Avoid */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Things to Avoid For a Vastu-Compliant Home
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Steer clear of these common Vastu pitfalls to maintain positive
          energy.
        </p>
        <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
          {THINGS_TO_AVOID.map((item) => (
            <div
              key={item.slice(0, 30)}
              className="flex items-start gap-3 px-5 py-4"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Vastu */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Why Is Vastu Important For a New Home?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          A vastu-compliant home creates a harmonious and peaceful living
          environment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div
                className={`w-9 h-9 rounded-lg ${b.bg} flex items-center justify-center mb-3`}
              >
                <b.icon className={`w-5 h-5 ${b.color}`} />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">
                {b.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-6 text-center">
        <Leaf className="w-6 h-6 text-primary mx-auto mb-3" />
        <p className="text-sm text-foreground leading-relaxed max-w-2xl mx-auto">
          In conclusion, applying vastu tips for the house when setting up your
          new home helps make it a place of peace and happiness. By following
          these ancient vastu-for-house principles, you can create an
          environment that supports both your well-being and prosperity.
        </p>
      </div>
    </motion.div>
  );
}

export function HomePage({ onFileSelect }: HomePageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: analyses } = useGetUserAnalyses();
  const deleteMutation = useDeleteAnalysis();

  const isLoggedIn = !!identity;

  const handleFile = useCallback(
    (file: File) => {
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!allowed.includes(file.type)) {
        toast.error("Please upload a JPG, PNG, or PDF file.");
        return;
      }
      if (file.type === "application/pdf") {
        onFileSelect(file, null);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          onFileSelect(file, e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Analysis deleted.");
    } catch {
      toast.error("Failed to delete analysis.");
    }
  };

  const handleDropzoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      document.getElementById("file-input")?.click();
    }
  };

  const displayProjects =
    isLoggedIn && analyses && analyses.length > 0 ? analyses : SAMPLE_PROJECTS;

  return (
    <main className="flex-1" data-ocid="home.page">
      {/* Hero band */}
      <section
        className="bg-vastu-hero border-b border-border py-10 px-6"
        data-ocid="home.section"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" /> Vastu Intelligence
            </p>
            <h1 className="text-3xl font-bold text-foreground mb-2 leading-tight">
              {isLoggedIn
                ? "Welcome! Explore your Vastu Insights."
                : "Ancient Wisdom, Modern Analysis."}
            </h1>
            <div className="flex items-center gap-6 mt-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Vastu Compliance Score:
                </span>{" "}
                <span className="text-primary font-bold">82%</span> &middot;
                Based on traditional Vastu Shastra principles
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main content with tabs */}
      <section className="max-w-7xl mx-auto px-6 py-10">
        <Tabs defaultValue="analysis" data-ocid="home.tab">
          <TabsList className="mb-8 bg-muted/60 rounded-xl p-1">
            <TabsTrigger
              value="analysis"
              className="rounded-lg text-sm px-5"
              data-ocid="home.tab"
            >
              Floor Plan Analysis
            </TabsTrigger>
            <TabsTrigger
              value="tips"
              className="rounded-lg text-sm px-5"
              data-ocid="home.tab"
            >
              Vaastu Tips
            </TabsTrigger>
            <TabsTrigger
              value="experts"
              className="rounded-lg text-sm px-5"
              data-ocid="home.tab"
            >
              Vaastu Experts
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="rounded-lg text-sm px-5"
              data-ocid="home.tab"
            >
              Products
            </TabsTrigger>
          </TabsList>

          {/* Floor Plan Analysis Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload card */}
              <div className="lg:col-span-2">
                <div
                  className="bg-card rounded-xl border border-border shadow-card p-6"
                  data-ocid="upload.card"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-foreground">
                      Upload Floor Plan
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      JPG &middot; PNG &middot; PDF
                    </Badge>
                  </div>

                  {/* Drop zone */}
                  <div
                    aria-label="Drop zone: click or drag to upload a floor plan"
                    className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-primary bg-vastu-mint/30"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                    onKeyDown={handleDropzoneKeyDown}
                    data-ocid="upload.dropzone"
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={handleInputChange}
                      data-ocid="upload.input"
                    />
                    <div className="w-16 h-16 rounded-2xl bg-vastu-mint flex items-center justify-center mb-4">
                      <Upload className="w-7 h-7 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground text-base mb-1">
                      Drop your floor plan here
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      or click to browse your files
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-full border-primary text-primary hover:bg-vastu-mint/50 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById("file-input")?.click();
                      }}
                      data-ocid="upload.primary_button"
                    >
                      Choose File
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileImage className="w-3.5 h-3.5" /> Images up to 10 MB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> PDF floor plans
                      supported
                    </span>
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="space-y-5">
                <div className="bg-card rounded-xl border border-border shadow-card p-5">
                  <h3 className="font-semibold text-foreground text-sm mb-3">
                    How it works
                  </h3>
                  <ol className="space-y-3">
                    {[
                      {
                        step: "1",
                        text: "Upload your floor plan image or PDF",
                      },
                      { step: "2", text: "Label rooms by clicking on zones" },
                      { step: "3", text: "Run Vastu analysis automatically" },
                      { step: "4", text: "Get detailed score & suggestions" },
                    ].map(({ step, text }) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-vastu-mint rounded-xl p-5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                    Quick Fact
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Northeast (Ishan) is considered the most sacred direction in
                    Vastu &mdash; ideal for Pooja rooms and open spaces.
                  </p>
                </div>
              </div>
            </div>

            {/* Past analyses */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-foreground">
                  Recent Projects
                </h2>
                <Button
                  variant="ghost"
                  className="text-sm text-primary hover:bg-vastu-mint/50 flex items-center gap-1"
                  data-ocid="projects.link"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {!isLoggedIn && analyses === undefined ? (
                <div
                  className="bg-card rounded-xl border border-border shadow-card p-10 text-center"
                  data-ocid="projects.empty_state"
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground mb-1">
                    Sign in to save & view your projects
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your saved analyses will appear here after logging in.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  data-ocid="projects.list"
                >
                  {displayProjects.map((proj, i) => {
                    const isBackend = "vastuScore" in proj;
                    const score = isBackend
                      ? Number((proj as { vastuScore: bigint }).vastuScore)
                      : (proj as { score: number }).score;
                    const name = isBackend
                      ? (proj as { floorPlanName: string }).floorPlanName
                      : (proj as { name: string }).name;
                    const address = !isBackend
                      ? (proj as { address: string }).address
                      : "";
                    const date = isBackend
                      ? new Date(
                          Number((proj as { uploadedAt: bigint }).uploadedAt) /
                            1_000_000,
                        ).toLocaleDateString()
                      : (proj as { date: string }).date;

                    return (
                      <motion.div
                        key={proj.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                        data-ocid={`projects.item.${i + 1}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-vastu-mint flex items-center justify-center">
                            <FileImage className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${getScoreColor(score)}`}
                            >
                              {score}/100
                            </span>
                            {isBackend && (
                              <button
                                type="button"
                                onClick={(e) => handleDelete(proj.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                                data-ocid={`projects.delete_button.${i + 1}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mb-0.5 truncate">
                          {name}
                        </h4>
                        {address && (
                          <p className="text-xs text-muted-foreground truncate mb-2">
                            {address}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {date}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              score >= 70
                                ? "text-primary"
                                : score >= 40
                                  ? "text-amber-600"
                                  : "text-destructive"
                            }`}
                          >
                            {getScoreLabel(score)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Vaastu Tips Tab */}
          <TabsContent value="tips">
            <VaastuTipsTab />
          </TabsContent>

          {/* Vaastu Experts Tab */}
          <TabsContent value="experts">
            <VaastuExpertsTab />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <VaastuProductsTab />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
