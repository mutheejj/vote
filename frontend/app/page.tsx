"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  Shield,
  Vote,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  Lock,
  Award,
  Zap,
  Globe,
  ChevronRight,
  Star,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function WelcomePage() {
  const services = [
    {
      icon: Vote,
      title: "Online Elections",
      description: "Send your voters a secure, single-use voting link. Only authorized students can vote — once.",
      color: "bg-sage-50 border-sage-200",
      iconColor: "text-sage-600 bg-sage-100"
    },
    {
      icon: BarChart3,
      title: "Live Results",
      description: "Real-time vote tallying and transparent results published the moment polls close.",
      color: "bg-emerald-50 border-emerald-200",
      iconColor: "text-emerald-600 bg-emerald-100"
    },
    {
      icon: Users,
      title: "Candidate Management",
      description: "Students apply for positions, admins review and approve — fully digital, no paperwork.",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600 bg-blue-100"
    }
  ]

  const features = [
    {
      icon: Shield,
      title: "Secure & Anonymous",
      description: "Cryptographic ballot secrecy ensures votes cannot be linked to voters.",
    },
    {
      icon: Zap,
      title: "Easy to Set Up",
      description: "Create and launch an election in minutes — no technical knowledge required.",
    },
    {
      icon: Clock,
      title: "Real-time Monitoring",
      description: "Track voter turnout, email delivery, and participation live as voting happens.",
    },
    {
      icon: Lock,
      title: "Fraud Prevention",
      description: "Device fingerprinting and rate-limiting prevent double votes and bot attacks.",
    },
    {
      icon: Globe,
      title: "Works Anywhere",
      description: "Fully mobile-responsive — students vote on any device, on or off campus.",
    },
    {
      icon: Award,
      title: "Verifiable Results",
      description: "Every voter gets a cryptographic receipt proving their vote was counted.",
    }
  ]

  const stats = [
    { label: "Registered Students", value: "5,000+", icon: Users },
    { label: "Elections Held", value: "25+", icon: Vote },
    { label: "Votes Processed", value: "50K+", icon: CheckCircle },
    { label: "Platform Uptime", value: "99.8%", icon: Clock }
  ]

  const testimonials = [
    {
      quote: "UniElect made our student council election completely seamless. Turnout doubled compared to the paper ballot days.",
      name: "Sarah K.",
      role: "Electoral Commission Chair, Nairobi University",
      rating: 5
    },
    {
      quote: "The transparency was incredible — students could trust the results because everything was verifiable.",
      name: "James M.",
      role: "Student Union President, JKUAT",
      rating: 5
    },
    {
      quote: "Setting up the election took 20 minutes. Running it took zero effort. The platform just works.",
      name: "Dr. Amara O.",
      role: "Dean of Students, Kenyatta University",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAVIGATION ─────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/unielect-logo.jpg"
                alt="UniElect Logo"
                width={38}
                height={38}
                className="rounded-lg shadow-sm"
              />
              <div>
                <span className="text-lg font-bold text-gray-900 leading-none block">UniElect</span>
                <span className="text-[10px] text-sage-600 font-medium">Secure Digital Voting</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-sage-700 transition-colors">About</Link>
              <Link href="/security" className="hover:text-sage-700 transition-colors">Security</Link>
              <Link href="/help" className="hover:text-sage-700 transition-colors">Help</Link>
              <Link href="/support" className="hover:text-sage-700 transition-colors">Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-sage-700 hover:bg-sage-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-sage-600 hover:bg-sage-700 text-white shadow-sm">
                  Get Started Free
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-5 bg-sage-100 text-sage-700 border-0 text-xs font-medium px-3 py-1">
                University Student Elections
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
                We Make Online Elections{" "}
                <span className="text-sage-600">Easy and Secure</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                UniElect is the trusted digital voting platform for university student elections.
                Secure single-use voting links, real-time results, and full audit trails — everything your campus needs.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/register">
                  <Button size="lg" className="bg-sage-600 hover:bg-sage-700 text-white shadow-lg shadow-sage-500/20 w-full sm:w-auto">
                    Start Voting Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:border-sage-400 hover:text-sage-700 w-full sm:w-auto">
                    Sign In to Account
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Free to register
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  No paper ballots
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Instant results
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                <Image
                  src="/images/vote-illustration2.jpg"
                  alt="Students voting in an election"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-emerald-300">Election in progress</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                      <p className="text-xs text-white/70">Votes cast</p>
                      <p className="text-xl font-bold">1,847</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                      <p className="text-xs text-white/70">Turnout</p>
                      <p className="text-xl font-bold">73%</p>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2">
                      <p className="text-xs text-white/70">Time left</p>
                      <p className="text-xl font-bold">2h 14m</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* floating badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-sage-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900">100% Secure</p>
                  <p className="text-[10px] text-gray-500">Encrypted & verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section className="py-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Our Services</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Everything You Need to Run a Fair Election
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              From candidate applications to published results, UniElect handles the full election lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div
                key={i}
                className={`rounded-2xl p-7 border-2 ${service.color} hover:shadow-md transition-all group`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 ${service.iconColor}`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{service.description}</p>
                <Link href="/register" className="flex items-center gap-1 text-sm font-semibold text-sage-600 hover:text-sage-700 group-hover:gap-2 transition-all">
                  Learn more <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMAGE + WHAT YOU CAN DO ─────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="space-y-5">
              <Badge className="bg-emerald-100 text-emerald-700 border-0">What You Can Do</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                Designed for Campus Democracy
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Whether you're running a full student council election or a single departmental poll, UniElect adapts to your needs.
              </p>

              <div className="space-y-4 pt-2">
                {[
                  { title: "Elect Representatives", desc: "Presidential, senate, faculty, and departmental elections with multiple positions.", icon: Award },
                  { title: "Manage Candidacies", desc: "Students apply online, officials review and approve — all tracked in one place.", icon: Users },
                  { title: "Streamline Decisions", desc: "Run referendums and polls to gauge student opinion on university decisions.", icon: Vote },
                  { title: "Publish Transparent Results", desc: "Step-by-step result reports that any student can verify and understand.", icon: BarChart3 }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex-shrink-0 w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-sage-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
                <Image
                  src="/images/vote-illustration1.jpg"
                  alt="Student holding VOTE sign"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-sage-900/50 to-emerald-900/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white px-6">
                    <p className="text-4xl font-extrabold mb-2">Your Vote</p>
                    <p className="text-lg text-white/80">Matters. Every. Time.</p>
                  </div>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden shadow-md h-40">
                <Image
                  src="/images/public-policy.jpg"
                  alt="Public policy and governance"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-transparent" />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white">
                  <p className="text-sm font-bold">Built for Governance</p>
                  <p className="text-xs text-white/70 mt-1">Compliance-ready from day one</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ──────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Secure and Trustworthy by Design
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every feature is built to protect the integrity of your election — from registration through to results.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 hover:border-sage-200 hover:bg-sage-50/30 transition-all group">
                <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-sage-100 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="h-5 w-5 text-sage-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDISPUTABLE RESULTS – IMAGE SECTION ───────────── */}
      <section className="py-20 bg-gray-900 overflow-hidden relative">
        <div className="absolute inset-0">
          <Image
            src="/images/community-learning.jpg"
            alt="Community learning"
            fill
            className="object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <Badge className="mb-5 bg-white/20 text-white border-white/30">Indisputable Results</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 leading-tight">
                Results Every Student Can Trust
              </h2>
              <p className="text-gray-300 leading-relaxed mb-8 text-lg">
                Transparent vote counting with step-by-step explanations. Students can verify the count, download raw ballots, and confirm their vote was included — all without compromising anonymity.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "Cryptographic receipts", icon: Shield },
                  { label: "Downloadable ballots", icon: BarChart3 },
                  { label: "Step-by-step counts", icon: CheckCircle },
                  { label: "Immutable audit log", icon: Lock }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <item.icon className="h-4 w-4 text-sage-400 flex-shrink-0" />
                    {item.label}
                  </div>
                ))}
              </div>
              <Link href="/register">
                <Button size="lg" className="bg-sage-600 hover:bg-sage-700 text-white shadow-lg">
                  Start Making All Votes Matter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-white font-semibold mb-4">Live Results Preview</p>
                <div className="space-y-3">
                  {[
                    { name: "Alice Wanjiru", pct: 42 },
                    { name: "Brian Otieno", pct: 35 },
                    { name: "Carol Mwangi", pct: 23 }
                  ].map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm text-white mb-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-white/70">{c.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sage-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${c.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50 mt-4">1,847 votes counted · 99.2% final</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">Testimonials</Badge>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Our Customers Say it Best</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-all">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sage-200 to-emerald-200 flex items-center justify-center text-sage-700 font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 bg-sage-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
            Ready to Run Your Next Election?
          </h2>
          <p className="text-sage-100 text-lg mb-8 leading-relaxed">
            Join thousands of students and universities already using UniElect. Registration is free and setup takes minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-sage-700 hover:bg-gray-50 shadow-xl w-full sm:w-auto font-semibold">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 w-full sm:w-auto">
                Sign In to Continue
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sage-200 text-sm">
            <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free to register</div>
            <div className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> End-to-end encrypted</div>
            <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> 5,000+ active students</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/images/unielect-logo.jpg" alt="UniElect" width={34} height={34} className="rounded-lg" />
                <div>
                  <span className="text-base font-bold block leading-none">UniElect</span>
                  <span className="text-xs text-sage-400">Secure Digital Voting</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                Empowering university campus democracy with secure, transparent, and accessible digital elections since 2022.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-gray-300">Platform</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {[
                  { href: "/login", label: "Sign In" },
                  { href: "/register", label: "Register" },
                  { href: "/about", label: "About Us" },
                  { href: "/help", label: "Help Center" }
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm text-gray-300">Legal & Support</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                {[
                  { href: "/support", label: "Contact Support" },
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms of Service" },
                  { href: "/security", label: "Security" }
                ].map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">&copy; 2025 UniElect Voting Management System. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-sage-500" />
                End-to-end encrypted
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Certified platform
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}