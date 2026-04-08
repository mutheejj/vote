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
  Award,
  Globe,
  ChevronLeft,
  Target,
  Heart,
  Zap,
  BookOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: "Integrity",
      description: "Every vote is secured, verified, and immutable. We build systems that earn trust through transparency.",
      color: "from-sage-500 to-sage-600"
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Democratic participation should have no barriers. Our platform works on any device, anywhere on campus.",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Heart,
      title: "Student-First",
      description: "Built for and with students. Every feature is designed around the needs of the campus community.",
      color: "from-rose-500 to-rose-600"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously improve with modern technology to deliver the best digital democracy experience.",
      color: "from-amber-500 to-amber-600"
    }
  ]

  const milestones = [
    { year: "2022", title: "Platform Founded", desc: "UniElect was conceived to solve the challenges of paper-based student elections." },
    { year: "2023", title: "First Deployment", desc: "Successfully powered 5 university elections with 3,000+ student voters." },
    { year: "2024", title: "Security Certification", desc: "Achieved ISO-level security certification and launched two-factor authentication." },
    { year: "2025", title: "Scale & Growth", desc: "Expanded to 15+ universities, processing 50,000+ votes with 99.8% uptime." }
  ]

  const team = [
    { name: "Dr. Amina Osei", role: "Founder & CEO", dept: "Computer Science" },
    { name: "Kevin Mwangi", role: "CTO", dept: "Systems Engineering" },
    { name: "Priya Sharma", role: "Head of Security", dept: "Cybersecurity" },
    { name: "Fiona Kamau", role: "Head of UX", dept: "Design & HCI" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/images/unielect-logo.jpg" alt="UniElect" width={36} height={36} className="rounded-lg shadow-sm" />
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-none">UniElect</h1>
                <p className="text-[10px] text-sage-600 font-medium">Secure Digital Voting</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1 text-sm text-gray-600 hover:text-sage-600 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-sage-600 to-emerald-600 text-white hover:from-sage-700 hover:to-emerald-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-sage-50 via-white to-emerald-50">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">About UniElect</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Powering Student Democracy with{" "}
                <span className="bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent">
                  Technology
                </span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                UniElect is a purpose-built digital voting platform for university student elections. We believe every student deserves a fair, secure, and accessible way to participate in campus democracy.
              </p>
              <div className="flex gap-4">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-sage-600 to-emerald-600 text-white hover:from-sage-700 hover:to-emerald-700 shadow-lg shadow-sage-500/20">
                    Join the Platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" className="border-2 border-sage-200 text-sage-700 hover:bg-sage-50">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-80 shadow-2xl">
              <Image
                src="/images/vote-illustration2.jpg"
                alt="Students participating in democratic voting"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-sage-900/60 to-emerald-900/40" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-2xl font-bold">50,000+</p>
                <p className="text-sm text-white/80">Votes processed securely</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden h-80 shadow-xl">
              <Image
                src="/images/public-policy.jpg"
                alt="Public policy and governance"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-sage-900/30" />
            </div>
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">Our Mission</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Democratizing Campus Governance
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our mission is to empower university students to participate meaningfully in campus governance through a platform that is secure, transparent, and easy to use.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                We partner with universities to digitize their student elections, eliminating fraud, reducing costs, and increasing student participation in democratic processes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Vote, label: "25+ Elections" },
                  { icon: Users, label: "5,000+ Students" },
                  { icon: Shield, label: "Zero Breaches" },
                  { icon: BarChart3, label: "99.8% Uptime" }
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-sage-50 rounded-xl">
                    <stat.icon className="h-5 w-5 text-sage-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-gray-900">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Our Values</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Stand For</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our core values guide every decision we make — from security architecture to user experience design.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">Our Journey</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Got Here</h2>
          </div>
          <div className="space-y-0">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-sage-600 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {m.year}
                  </div>
                  {i < milestones.length - 1 && <div className="w-0.5 h-12 bg-gradient-to-b from-sage-300 to-emerald-300 my-1" />}
                </div>
                <div className="pb-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{m.title}</h3>
                  <p className="text-sm text-gray-600">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">The Team</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">People Behind UniElect</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A passionate team of technologists and educators committed to student democracy.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-sage-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-sage-600 font-medium mb-1">{member.role}</p>
                <p className="text-xs text-gray-500">{member.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-sage-600 via-sage-600 to-emerald-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Campus Elections?</h2>
          <p className="text-white/80 mb-8 text-lg">
            Join thousands of students and universities already using UniElect for secure digital democracy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-sage-700 hover:bg-gray-50 shadow-xl w-full sm:w-auto">
                Create Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/help">
              <Button size="lg" variant="outline" className="border-2 border-white/60 text-white hover:bg-white/10 w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">&copy; 2025 UniElect. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
