'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  templateEsthetic, initialSiteConfig, initialFormConfig
} from '@/lib/constants'

export function useProject(user) {
  const [projectId, setProjectId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [slides, setSlides] = useState(templateEsthetic)
  const [siteConfig, setSiteConfig] = useState(initialSiteConfig)
  const [formConfig, setFormConfig] = useState(initialFormConfig)
  const [leads, setLeads] = useState([])
  const [floatingCta, setFloatingCta] = useState({ enabled: false, text: "", url: "" })
  const [clarityProjectId, setClarityProjectId] = useState("")
  const [gtmId, setGtmId] = useState("")
  const [customDomain, setCustomDomain] = useState("")

  const saveTimeoutRef = useRef(null)

  // プロジェクト選択（ダッシュボードからエディタへ）
  const loadProject = (project) => {
    if (project && project.content) {
      setProjectId(project.id)
      setSlides(project.content.slides || templateEsthetic)
      setSiteConfig(project.content.siteConfig || initialSiteConfig)
      setFormConfig(project.content.formConfig || initialFormConfig)
      setLeads(project.content.leads || [])
      setFloatingCta(project.content.floatingCta || { enabled: false, text: "", url: "" })
      setClarityProjectId(project.content.clarityProjectId || "")
      setGtmId(project.content.gtmId || "")
      setCustomDomain(project.content.customDomain || "")
    }
  }

  // 新規プロジェクト作成
  const createProject = async (templateSlides, templateName) => {
    if (!user) return null
    const content = {
      slides: templateSlides || templateEsthetic,
      siteConfig: { ...initialSiteConfig, seo: { ...initialSiteConfig.seo, title: templateName || initialSiteConfig.seo?.title || '無題のプロジェクト' } },
      formConfig: initialFormConfig,
      leads: [],
      floatingCta: { enabled: false, text: "", url: "" },
      clarityProjectId: "",
      gtmId: "",
      customDomain: ""
    }
    // Supabaseへの保存を試行
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: user.id, content, name: templateName || '無題のプロジェクト', slug: '' })
        .select()
        .single()
      if (error) throw error
      if (data) {
        loadProject(data)
        return data
      }
    } catch (err) {
      console.warn("Supabase接続不可。ローカルストレージにフォールバックします:", err.message)
    }
    // フォールバック: localStorageに保存
    try {
      const localProject = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'draft',
        _isLocal: true
      }
      const existing = JSON.parse(localStorage.getItem('rizbell_local_projects') || '[]')
      existing.unshift(localProject)
      localStorage.setItem('rizbell_local_projects', JSON.stringify(existing))
      loadProject(localProject)
      return localProject
    } catch (localErr) {
      console.error("ローカル保存にも失敗:", localErr)
      return null
    }
  }

  // 保存
  const saveToSupabase = useCallback(async () => {
    if (!user || !projectId) return
    setIsSaving(true)
    const content = {
      slides, siteConfig, formConfig, leads,
      floatingCta, clarityProjectId, gtmId, customDomain
    }
    // ローカルプロジェクトの場合はlocalStorageに保存
    if (String(projectId).startsWith('local-')) {
      try {
        const existing = JSON.parse(localStorage.getItem('rizbell_local_projects') || '[]')
        const idx = existing.findIndex(p => p.id === projectId)
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], content, updated_at: new Date().toISOString() }
          localStorage.setItem('rizbell_local_projects', JSON.stringify(existing))
        }
      } catch (e) {
        console.error("ローカル保存エラー:", e)
      }
      setIsSaving(false)
      return
    }
    try {
      const { error } = await supabase
        .from("projects")
        .update({ content })
        .eq("id", projectId)
        .eq("user_id", user.id)
      if (error) throw error
    } catch (error) {
      console.error("保存エラー:", error)
    } finally {
      setIsSaving(false)
    }
  }, [user, projectId, slides, siteConfig, formConfig, leads, floatingCta, clarityProjectId, gtmId, customDomain])

  // 自動保存（debounce: 1秒）
  useEffect(() => {
    if (!user || !projectId) return
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => { saveToSupabase() }, 1000)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [slides, siteConfig, formConfig, leads, floatingCta, clarityProjectId, gtmId, customDomain, user, projectId, saveToSupabase])

  // 公開処理
  const publishProject = async () => {
    if (!projectId || !user) return null
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://lp.rizbell.jp'
      : `http://localhost:${window.location.port || 3000}`
    // ローカルプロジェクトの場合
    if (String(projectId).startsWith('local-')) {
      try {
        const existing = JSON.parse(localStorage.getItem('rizbell_local_projects') || '[]')
        const idx = existing.findIndex(p => p.id === projectId)
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], status: 'published', updated_at: new Date().toISOString() }
          localStorage.setItem('rizbell_local_projects', JSON.stringify(existing))
        }
      } catch (e) {
        console.error("ローカル公開エラー:", e)
      }
      return `${baseUrl}/p/${projectId}`
    }
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: 'published' })
        .eq("id", projectId)
        .eq("user_id", user.id)
      if (error) throw error
      return `${baseUrl}/p/${projectId}`
    } catch (error) {
      console.error("公開エラー:", error)
      return null
    }
  }

  const resetProject = () => {
    setProjectId(null)
    setSlides(templateEsthetic)
    setSiteConfig(initialSiteConfig)
    setFormConfig(initialFormConfig)
    setLeads([])
    setFloatingCta({ enabled: false, text: "", url: "" })
    setClarityProjectId("")
    setGtmId("")
    setCustomDomain("")
  }

  return {
    projectId, isSaving,
    slides, setSlides,
    siteConfig, setSiteConfig,
    formConfig, setFormConfig,
    leads, setLeads,
    floatingCta, setFloatingCta,
    clarityProjectId, setClarityProjectId,
    gtmId, setGtmId,
    customDomain, setCustomDomain,
    loadProject, createProject, publishProject, resetProject,
  }
}
