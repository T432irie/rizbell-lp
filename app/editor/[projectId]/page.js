'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProject } from '@/lib/hooks/useProject'
import { PLAN_LIMITS, IS_PRO_PLAN, templateEsthetic } from '@/lib/constants'
import Sidebar from '@/components/Sidebar'
import Canvas from '@/components/Canvas'
import PropertyPanel from '@/components/PropertyPanel'
import EditorHeader from '@/components/EditorHeader'
import BottomSheet from '@/components/BottomSheet'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PublishModal from '@/components/ui/PublishModal'

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const auth = useAuth()
  const project = useProject(auth.user)

  // UI状態
  const [activeMenu, setActiveMenu] = useState('slides')
  const [activeIndex, setActiveIndex] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({})
  const [formStep, setFormStep] = useState('input')
  const [showFloatingButton, setShowFloatingButton] = useState(true)
  const [currentPlan] = useState('take')

  // モバイル
  const [isMobile, setIsMobile] = useState(false)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

  // AI生成
  const [prompt, setPrompt] = useState("luxury spa, clean, bright, 8k")
  const [isGenerating, setIsGenerating] = useState(false)

  // モーダル
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [showPublishResult, setShowPublishResult] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState('')

  const swiperRef = useRef(null)
  const fileInputRef = useRef(null)

  // モバイル検出
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // プロジェクト読み込み
  useEffect(() => {
    if (!params.projectId) return
    const loadProjectData = async () => {
      // ローカルプロジェクトの場合はlocalStorageから読み込み
      if (String(params.projectId).startsWith('local-')) {
        try {
          const localProjects = JSON.parse(localStorage.getItem('rizbell_local_projects') || '[]')
          const found = localProjects.find(p => p.id === params.projectId)
          if (found) project.loadProject(found)
        } catch (err) {
          console.error("ローカル読み込みエラー:", err)
        }
        return
      }
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", params.projectId)
          .single()
        if (error) { console.error("読み込みエラー:", error); return }
        if (data) project.loadProject(data)
      } catch (err) {
        console.error("読み込みエラー:", err)
      }
    }
    loadProjectData()
  }, [params.projectId])

  // スライド更新
  const updateSlide = (path, value) => {
    project.setSlides(prevSlides => prevSlides.map((s, i) => {
      if (i !== activeIndex) return s
      const newSlide = { ...s }
      const keys = path.split('.')
      let target = newSlide
      for (let j = 0; j < keys.length - 1; j++) {
        target = target[keys[j]] = { ...target[keys[j]] }
      }
      target[keys[keys.length - 1]] = value
      return newSlide
    }))
  }

  const updateSlideImage = (index, newSrc, newType = 'image') => {
    project.setSlides(prevSlides => prevSlides.map((s, i) => {
      if (i !== index) return s
      const limit = PLAN_LIMITS[currentPlan]
      const newHistory = [{ type: s.type, src: s.src, date: new Date().toLocaleString() }, ...s.history].slice(0, limit)
      return { ...s, type: newType, src: newSrc, history: newHistory }
    }))
  }

  const handleMediaUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const type = file.type.startsWith('video') ? 'video' : 'image'
    updateSlideImage(activeIndex, url, type)
  }

  const handleGenerateImage = async () => {
    if (!prompt.trim()) { alert("プロンプトを入力してください"); return }
    setIsGenerating(true)
    try {
      const seed = Math.floor(Math.random() * 100000)
      const encodedPrompt = encodeURIComponent(prompt.trim())
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1080&height=1920&nologo=true&enhance=true`
      const img = new Image()
      img.crossOrigin = "anonymous"
      await new Promise((resolve, reject) => {
        img.onload = () => { updateSlideImage(activeIndex, url, 'image'); setIsGenerating(false); resolve() }
        img.onerror = () => {
          const retryUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed + 1000}&width=1080&height=1920&nologo=true`
          const retryImg = new Image()
          retryImg.crossOrigin = "anonymous"
          retryImg.onload = () => { updateSlideImage(activeIndex, retryUrl, 'image'); setIsGenerating(false); resolve() }
          retryImg.onerror = () => { setIsGenerating(false); alert("画像生成に失敗しました。"); reject() }
          retryImg.src = retryUrl
        }
        img.src = url
      })
    } catch (error) {
      console.error("画像生成エラー:", error)
      setIsGenerating(false)
    }
  }

  const restoreFromHistory = (h) => { updateSlideImage(activeIndex, h.src, h.type) }

  const addSlide = () => {
    project.setSlides([...project.slides, {
      id: Date.now(), type: "image",
      src: "https://via.placeholder.com/1080x1920/333/fff?text=New+Slide",
      history: [],
      overlay: { title: "New Slide", subtitle: "", color: "#fff", align: "center" }
    }])
  }

  const deleteSlide = () => {
    if (project.slides.length > 1 && window.confirm("削除しますか？")) {
      project.setSlides(project.slides.filter((_, i) => i !== activeIndex))
      if (activeIndex > 0) setActiveIndex(activeIndex - 1)
    }
  }

  const submitForm = (e) => {
    e.preventDefault()
    const formattedData = {}
    project.formConfig.fields.forEach(field => {
      const val = formData[field.label]
      formattedData[field.label] = Array.isArray(val) ? val.join(", ") : val
    })
    project.setLeads([{ id: Date.now(), date: new Date().toLocaleString(), data: formattedData }, ...project.leads])
    setFormData({})
    setFormStep('success')
  }

  // 公開
  const handlePublish = () => { setShowPublishConfirm(true) }
  const confirmPublish = async () => {
    setShowPublishConfirm(false)
    const url = await project.publishProject()
    if (url) {
      setPublishedUrl(url)
      setShowPublishResult(true)
    } else {
      alert("公開に失敗しました")
    }
  }

  // 共通 props
  const editorProps = {
    activeMenu, setActiveMenu,
    slides: project.slides,
    activeIndex, setActiveIndex,
    siteConfig: project.siteConfig, setSiteConfig: project.setSiteConfig,
    formConfig: project.formConfig, setFormConfig: project.setFormConfig,
    updateSlide, addSlide, deleteSlide,
    fileInputRef, handleMediaUpload,
    prompt, setPrompt, handleGenerateImage, isGenerating,
    restoreFromHistory,
    PLAN_LIMITS, currentPlan,
    showFloatingButton, setShowFloatingButton,
    floatingCta: project.floatingCta, setFloatingCta: project.setFloatingCta,
    clarityProjectId: project.clarityProjectId, setClarityProjectId: project.setClarityProjectId,
    gtmId: project.gtmId, setGtmId: project.setGtmId,
    customDomain: project.customDomain, setCustomDomain: project.setCustomDomain,
    IS_PRO_PLAN,
    swiperRef,
  }

  const canvasProps = {
    slides: project.slides,
    activeIndex, setActiveIndex,
    siteConfig: project.siteConfig,
    formConfig: project.formConfig,
    isFormOpen, setIsFormOpen,
    formStep, setFormStep,
    formData, setFormData,
    submitForm,
    showFloatingButton,
    floatingCta: project.floatingCta,
    clarityProjectId: project.clarityProjectId,
    swiperRef,
    projectId: project.projectId,
  }

  // モバイルエディタ
  if (isMobile) {
    return (
      <div className="app-wrapper mobile-mode">
        <div className="mobile-preview-container">
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Canvas {...canvasProps} />
            <button className="mobile-edit-fab" onClick={() => setIsBottomSheetOpen(true)}>
              🖊️ 編集
            </button>
          </div>
        </div>
        <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
          <PropertyPanel {...editorProps} />
        </BottomSheet>
      </div>
    )
  }

  // PCエディタ
  return (
    <>
      <div className="app-wrapper desktop-mode editor-mode">
        <EditorHeader
          onBack={() => router.push('/')}
          isSaving={project.isSaving}
          onPublish={handlePublish}
          projectTitle={project.siteConfig?.seo?.title}
        />
        <div className="editor-content-wrapper">
          <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
          <Canvas {...canvasProps} />
          <PropertyPanel {...editorProps} />
        </div>
      </div>

      <ConfirmModal
        isOpen={showPublishConfirm}
        onClose={() => setShowPublishConfirm(false)}
        onConfirm={confirmPublish}
        title="LPを公開しますか？"
        message="公開すると、URLを知っている人は誰でもこのLPを閲覧できるようになります。"
        confirmText="公開する"
      />

      <PublishModal
        isOpen={showPublishResult}
        onClose={() => setShowPublishResult(false)}
        publicUrl={publishedUrl}
      />
    </>
  )
}
