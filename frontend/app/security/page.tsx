"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronLeft,
  Shield,
  Lock,
  Eye,
  Server,
  Key,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Database
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data transmitted between your browser and our servers is encrypted using TLS 1.3. Stored data is encrypted at rest using AES-256 encryption.",
    color: "from-sage-500 to-sage-600"
  },
  {
    icon: Shield,
    title: "Ballot Secrecy",
    description: "Your vote choices are cryptographically separated from your identity using blind signature schemes. Not even our engineers can see who you voted for.",
    color: "from-emerald-500 to-emerald-600"
  },
  {
    icon: Key,
    title: "Multi-Factor Authentication",
    description: "Protect your account with TOTP-based two-factor authentication. Even if your password is compromised, your account stays secure.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Eye,
    title: "Full Audit Trail",
    description: "Every action on the platform is logged with tamper-proof audit trails. Election administrators can verify the integrity of every election.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our platform runs on hardened cloud infrastructure with DDoS protection, automated failover, and continuous security monitoring.",
    color: "from-rose-500 to-rose-600"
  },
  {
    icon: AlertCircle,
    title: "Fraud Prevention",
    description: "Advanced rate limiting, device fingerprinting, and anomaly detection prevent duplicate voting, bot attacks, and unauthorized access attempts.",
    color: "from-amber-500 to-amber-600"
  }
]

const certifications = [
  {
    title: "ISO 27001 Compliant",
    desc: "Information security management practices aligned with ISO 27001 standards."
  },
  {
    title: "GDPR Compatible",
    desc: "Data handling practices designed to be compatible with GDPR principles."
  },
  {
    title: "Regular Penetration Testing",
    desc: "Third-party security audits and penetration tests conducted twice yearly."
  },
  {
    title: "99.8% Uptime SLA",
    desc: "High-availability architecture with redundancy and automated monitoring."
  }
]

const practices = [
  { title: "Principle of Least Privilege", desc: "Staff access is limited to what is strictly required for their role." },
  { title: "Cryptographic Vote Receipts", desc: "Voters receive a verifiable receipt proving their vote was counted." },
  { title: "Immutable Vote Records", desc: "Submitted votes cannot be modified or deleted — only audited." },
  { title: "Separated Voter & Ballot DBs", desc: "Who voted and how they voted are stored in separate systems." },
  { title: "Automated Security Scanning", desc: "Continuous vulnerability scanning runs on all code and infrastructure." },
  { title: "Incident Response Plan", desc: "Documented procedures for security incidents with < 1-hour response times." }
]

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
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
      <section className="py-20 bg-gradient-to-br from-sage-600 via-sage-700 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <Badge className="mb-4 bg-white/20 text-white border-white/30">Security</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Security at the Core of Everything We Do
          </h1>
          <p className="text-xl text-white/80 leading-relaxed max-w-3xl mx-auto">
            UniElect was built from the ground up with election security as its first priority. Here's how we protect the integrity of every vote.
          </p>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Security Features</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Multi-Layered Protection</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every component of our platform is designed with security in mind — from login to vote submission.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Vote Secrecy Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">How It Works</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Keep Your Vote Secret</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Identity Verification",
                desc: "When you log in, we verify your identity and eligibility. We record that you are eligible to vote.",
                icon: Key
              },
              {
                step: "2",
                title: "Ballot Separation",
                desc: "Your vote is cryptographically separated from your identity before being recorded. No link between you and your choices exists.",
                icon: Shield
              },
              {
                step: "3",
                title: "Verifiable Receipt",
                desc: "You receive a unique cryptographic receipt that proves your vote was counted, without revealing your choices.",
                icon: CheckCircle
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage-600 to-emerald-600 flex items-center justify-center shadow-lg mx-auto">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-sage-500 rounded-full flex items-center justify-center text-xs font-bold text-sage-600">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <Badge className="mb-4 bg-sage-100 text-sage-700 border-0">Our Practices</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Best Practices We Follow</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We follow industry best practices and continuously improve our security posture based on the latest research and real-world threats.
              </p>
              <div className="space-y-4">
                {practices.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">Certifications</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
              <div className="space-y-4">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sage-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-sage-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{cert.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cert.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report Vulnerability */}
      <section className="py-16 bg-gradient-to-br from-sage-50 to-emerald-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sage-600 to-emerald-600 rounded-2xl mb-6 shadow-lg">
            <AlertCircle className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Found a Security Issue?</h2>
          <p className="text-gray-600 mb-6">
            We take all security reports seriously. If you discover a vulnerability, please report it responsibly through our security disclosure program.
          </p>
          <Button className="bg-gradient-to-r from-sage-600 to-emerald-600 text-white hover:from-sage-700 hover:to-emerald-700">
            Report a Vulnerability
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-gray-500 mt-4">security@unielect.ac.ke &middot; PGP key available on request</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">&copy; 2025 UniElect. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/help" className="hover:text-white transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
