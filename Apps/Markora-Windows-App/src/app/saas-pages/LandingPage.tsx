"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Slider } from "../components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Progress } from "../components/ui/progress"
import { useToast } from "../hooks/use-toast"
import {
  FileText,
  Globe,
  Palette,
  Zap,
  Download,
  Code,
  FileCode,
  FileImage,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Languages,
  BookOpen,
  Newspaper,
  FileCheck,
  Briefcase,
} from "lucide-react"
import { cn } from "../components/ui/utils"

// Card content that cycles
const cardExamples = [
  {
    id: 1,
    icon: BookOpen,
    title: "Documentation",
    color: "from-blue-500 to-blue-600",
    markdown: `# API Documentation

## Authentication
Use Bearer tokens for API access.

\`\`\`javascript
fetch('/api/data', {
  headers: {
    'Authorization': 'Bearer token'
  }
})
\`\`\``,
    preview: `<h1>API Documentation</h1><h2>Authentication</h2><p>Use Bearer tokens for API access.</p><pre><code>fetch('/api/data', {
  headers: {
    'Authorization': 'Bearer token'
  }
})</code></pre>`,
  },
  {
    id: 2,
    icon: Newspaper,
    title: "Blog Post",
    color: "from-purple-500 to-purple-600",
    markdown: `# The Future of Writing

*Published: May 21, 2026*

Writing has **evolved**. Modern tools enable:

1. Real-time collaboration
2. Instant formatting
3. Multi-platform publishing`,
    preview: `<h1>The Future of Writing</h1><p><em>Published: May 21, 2026</em></p><p>Writing has <strong>evolved</strong>. Modern tools enable:</p><ol><li>Real-time collaboration</li><li>Instant formatting</li><li>Multi-platform publishing</li></ol>`,
  },
  {
    id: 3,
    icon: FileCheck,
    title: "Meeting Notes",
    color: "from-green-500 to-green-600",
    markdown: `# Team Sync - Q2 2026

## Attendees
- Sarah (Product)
- Mike (Engineering)
- Lisa (Design)

## Action Items
- [ ] Review mockups
- [ ] Update timeline
- [x] Send summary`,
    preview: `<h1>Team Sync - Q2 2026</h1><h2>Attendees</h2><ul><li>Sarah (Product)</li><li>Mike (Engineering)</li><li>Lisa (Design)</li></ul><h2>Action Items</h2><ul><li>☐ Review mockups</li><li>☐ Update timeline</li><li>☑ Send summary</li></ul>`,
  },
  {
    id: 4,
    icon: Briefcase,
    title: "Project Brief",
    color: "from-orange-500 to-orange-600",
    markdown: `# Website Redesign

## Objectives
Modernize UI and improve UX

## Timeline
**Start:** June 1, 2026
**Launch:** August 15, 2026

## Budget
$50,000 - $75,000`,
    preview: `<h1>Website Redesign</h1><h2>Objectives</h2><p>Modernize UI and improve UX</p><h2>Timeline</h2><p><strong>Start:</strong> June 1, 2026<br><strong>Launch:</strong> August 15, 2026</p><h2>Budget</h2><p>$50,000 - $75,000</p>`,
  },
]

// Markdown samples for different languages
const languageContent = {
  english: {
    name: "English",
    code: "en",
    direction: "ltr",
    markdown: `# Welcome to MarkdownPro

This is a **powerful** markdown editor with *live preview*.

## Features
- Real-time rendering
- Export to multiple formats
- Beautiful typography`,
    stats: {
      users: "2.5M+",
      documents: "15M+",
      exports: "50M+",
    },
    description: "The most popular language for technical documentation and content creation.",
  },
  spanish: {
    name: "Español",
    code: "es",
    direction: "ltr",
    markdown: `# Bienvenido a MarkdownPro

Este es un editor markdown **potente** con *vista previa en vivo*.

## Características
- Renderizado en tiempo real
- Exportar a múltiples formatos
- Tipografía hermosa`,
    stats: {
      users: "1.8M+",
      documents: "12M+",
      exports: "38M+",
    },
    description: "Segunda lengua más utilizada para documentación técnica y creación de contenido.",
  },
  arabic: {
    name: "العربية",
    code: "ar",
    direction: "rtl",
    markdown: `# مرحباً بك في MarkdownPro

هذا محرر markdown **قوي** مع *معاينة مباشرة*.

## المميزات
- عرض فوري
- تصدير إلى صيغ متعددة
- طباعة جميلة`,
    stats: {
      users: "850K+",
      documents: "5.2M+",
      exports: "18M+",
    },
    description: "لغة متنامية في مجال التوثيق التقني وإنشاء المحتوى الرقمي.",
  },
  chinese: {
    name: "中文",
    code: "zh",
    direction: "ltr",
    markdown: `# 欢迎使用 MarkdownPro

这是一个**强大的** Markdown 编辑器，具有*实时预览*功能。

## 特点
- 实时渲染
- 导出多种格式
- 优美的排版`,
    stats: {
      users: "3.2M+",
      documents: "22M+",
      exports: "65M+",
    },
    description: "技术文档和内容创作中增长最快的语言之一。",
  },
  japanese: {
    name: "日本語",
    code: "ja",
    direction: "ltr",
    markdown: `# MarkdownProへようこそ

これは**強力な**Markdownエディタで、*ライブプレビュー*機能付きです。

## 機能
- リアルタイムレンダリング
- 複数形式へのエクスポート
- 美しいタイポグラフィ`,
    stats: {
      users: "1.2M+",
      documents: "8.5M+",
      exports: "28M+",
    },
    description: "技術文書とコンテンツ作成で人気の高い言語です。",
  },
}

type LanguageKey = keyof typeof languageContent

export default function LandingPage() {
  const { toast } = useToast()
  
  // Hero section typing animation
  const [typedText, setTypedText] = useState("")
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const phrases = ["documents", "blogs", "notes", "wikis", "books"]
  
  // Card cycling state
  const [activeCard, setActiveCard] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Export section states
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)
  const [exportProgress, setExportProgress] = useState(0)
  
  // Typography section states
  const [fontSize, setFontSize] = useState(16)
  const [lineHeight, setLineHeight] = useState(1.6)
  const [fontFamily, setFontFamily] = useState("inter")
  
  // Multi-language section state
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>("english")
  
  // Typing animation for hero
  useEffect(() => {
    const phrase = phrases[currentPhraseIndex]
    let currentIndex = 0
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= phrase.length) {
        setTypedText(phrase.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length)
        }, 2000)
      }
    }, 100)
    
    return () => clearInterval(typingInterval)
  }, [currentPhraseIndex])
  
  // Card cycling animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setActiveCard((prev) => (prev + 1) % cardExamples.length)
        setIsTransitioning(false)
      }, 300)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Export simulation
  const handleExport = (format: string) => {
    setExportingFormat(format)
    setExportProgress(0)
    
    toast({
      title: `Exporting ${format.toUpperCase()}...`,
      description: "Your document is being prepared",
    })
    
    const progressInterval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            setExportingFormat(null)
            toast({
              title: "Export Complete!",
              description: `Your ${format.toUpperCase()} file is ready`,
            })
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }
  
  const exportFormats = [
    { id: "pdf", name: "PDF", icon: FileText, color: "text-red-500" },
    { id: "html", name: "HTML", icon: Code, color: "text-orange-500" },
    { id: "docx", name: "DOCX", icon: FileCode, color: "text-blue-500" },
    { id: "png", name: "PNG", icon: FileImage, color: "text-green-500" },
  ]
  
  const fontFamilies = [
    { value: "inter", label: "Inter", className: "font-sans" },
    { value: "serif", label: "Serif", className: "font-serif" },
    { value: "mono", label: "Mono", className: "font-mono" },
  ]
  
  const currentLanguage = languageContent[selectedLanguage]
  const currentCard = cardExamples[activeCard]
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Outer container with generous margins */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-24">
        
        {/* Hero Section - 4 Cycling Cards */}
        <section className="pt-20 pb-12">
          <div className="text-center mb-16 space-y-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2 inline" />
              Live Preview Editor
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Write beautiful{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {typedText}
                <span className="animate-pulse">|</span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A powerful markdown editor with real-time preview, export to any format, and beautiful typography.
            </p>
          </div>
          
          {/* 4 Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cardExamples.map((card, index) => (
              <Card
                key={card.id}
                className={cn(
                  "p-6 cursor-pointer transition-all duration-500 hover:scale-105",
                  activeCard === index
                    ? "ring-2 ring-offset-2 ring-blue-500 shadow-2xl scale-105"
                    : "opacity-60 hover:opacity-100"
                )}
                onClick={() => {
                  setIsTransitioning(true)
                  setTimeout(() => {
                    setActiveCard(index)
                    setIsTransitioning(false)
                  }, 300)
                }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className={cn(
                      "p-4 rounded-full bg-gradient-to-br transition-all duration-500",
                      card.color,
                      activeCard === index ? "scale-110" : "scale-100"
                    )}
                  >
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{card.title}</h3>
                  {activeCard === index && (
                    <Badge variant="secondary" className="animate-pulse">
                      Active
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          {/* Split-pane Editor + Preview for Active Card */}
          <Card className="overflow-hidden shadow-2xl border-2">
            <div className="grid md:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
              {/* Editor Pane */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-gray-500 ml-2">{currentCard.title.toLowerCase().replace(' ', '-')}.md</span>
                </div>
                <div
                  className={cn(
                    "transition-opacity duration-300",
                    isTransitioning ? "opacity-0" : "opacity-100"
                  )}
                >
                  <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
{currentCard.markdown}
                  </pre>
                </div>
              </div>
              
              {/* Preview Pane */}
              <div className="bg-white dark:bg-gray-950 p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm text-gray-500">Live Preview</span>
                </div>
                <div
                  className={cn(
                    "prose dark:prose-invert max-w-none transition-opacity duration-300",
                    isTransitioning ? "opacity-0" : "opacity-100"
                  )}
                  dangerouslySetInnerHTML={{ __html: currentCard.preview }}
                />
              </div>
            </div>
            
            {/* Progress Indicators */}
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 flex items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-800">
              {cardExamples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsTransitioning(true)
                    setTimeout(() => {
                      setActiveCard(index)
                      setIsTransitioning(false)
                    }, 300)
                  }}
                  className={cn(
                    "transition-all duration-300",
                    index === activeCard
                      ? "w-8 h-2 rounded-full bg-blue-600"
                      : "w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                  )}
                  aria-label={`View ${cardExamples[index].title}`}
                />
              ))}
            </div>
          </Card>
        </section>
        
        {/* Features Grid */}
        <section className="py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Powerful features for modern content creators
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Instant preview updates as you type with zero lag",
              },
              {
                icon: Palette,
                title: "Beautiful Themes",
                description: "Customize every aspect of your editor and preview",
              },
              {
                icon: Globe,
                title: "Multi-Language",
                description: "Full support for RTL languages and Unicode",
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Export & Publish Section - Interactive */}
        <section className="py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Export to any format</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              One click to export your documents professionally
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {exportFormats.map((format) => (
              <Card
                key={format.id}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl",
                  exportingFormat === format.id && "ring-2 ring-blue-500 scale-105"
                )}
                onClick={() => handleExport(format.id)}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={cn("p-4 rounded-full bg-gray-100 dark:bg-gray-800", format.color)}>
                    <format.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{format.name}</h3>
                    <p className="text-sm text-gray-500">Export as {format.name}</p>
                  </div>
                  
                  {exportingFormat === format.id && (
                    <div className="w-full space-y-2">
                      <Progress value={exportProgress} className="h-2" />
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                        {exportProgress < 100 ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{exportProgress}%</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Complete!</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
        
        {/* Typography Customization Section - Live Preview */}
        <section className="py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Perfect typography</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Fine-tune every detail of your text appearance
            </p>
          </div>
          
          <Card className="p-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Controls */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Font Size</span>
                    <span className="text-blue-600">{fontSize}px</span>
                  </label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(value) => setFontSize(value[0])}
                    min={12}
                    max={32}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-sm font-medium flex items-center justify-between">
                    <span>Line Height</span>
                    <span className="text-blue-600">{lineHeight.toFixed(1)}</span>
                  </label>
                  <Slider
                    value={[lineHeight * 10]}
                    onValueChange={(value) => setLineHeight(value[0] / 10)}
                    min={10}
                    max={25}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-sm font-medium">Font Family</label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontFamilies.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span className={font.className}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Live Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 flex items-center justify-center">
                <div
                  className={cn(
                    "transition-all duration-300",
                    fontFamilies.find((f) => f.value === fontFamily)?.className
                  )}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                  }}
                >
                  <p className="text-gray-800 dark:text-gray-200">
                    The quick brown fox jumps over the lazy dog. Typography is the art and technique
                    of arranging type to make written language legible, readable, and appealing.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
        
        {/* Multi-Language Section - Dynamic Content */}
        <section className="py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Write in any language</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Full support for international content creation
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Language Selector */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Select Language
              </h3>
              <div className="space-y-2">
                {(Object.keys(languageContent) as LanguageKey[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg transition-all",
                      selectedLanguage === lang
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{languageContent[lang].name}</span>
                      {selectedLanguage === lang && <CheckCircle2 className="w-5 h-5" />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Dynamic Stats & Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{currentLanguage.stats.users}</div>
                  <div className="text-sm text-gray-500">Users</div>
                </Card>
                <Card className="p-4 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{currentLanguage.stats.documents}</div>
                  <div className="text-sm text-gray-500">Documents</div>
                </Card>
                <Card className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{currentLanguage.stats.exports}</div>
                  <div className="text-sm text-gray-500">Exports</div>
                </Card>
              </div>
              
              {/* Language Description */}
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                                        <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {currentLanguage.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {currentLanguage.description}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Markdown Example */}
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
                  {/* Markdown */}
                  <div className="bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="text-sm text-gray-500 mb-3">Markdown</div>
                    <pre
                      className="text-sm font-mono whitespace-pre-wrap"
                      dir={currentLanguage.direction}
                    >
{currentLanguage.markdown}
                    </pre>
                  </div>

                  {/* Preview */}
                  <div className="bg-white dark:bg-gray-950 p-6">
                    <div className="text-sm text-gray-500 mb-3">
                      Preview
                    </div>
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dir={currentLanguage.direction}
                    >
                      <p>{currentLanguage.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
