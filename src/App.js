import React, { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { supabase, getAllProjects } from "./supabaseClient";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import PropertyPanel from "./components/PropertyPanel";
import BottomSheet from "./components/BottomSheet";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import EditorHeader from "./components/EditorHeader";
import Login from "./components/Login";
import PublicLP from "./components/PublicLP";
import AIChat from "./components/AIChat";
import { applyEdits } from "./services/aiService";

/* --- 管理者設定 --- */
// スーパー管理者のメールアドレスを設定してください
// このメールアドレスでログインすると、全ユーザーのデータを管理できるAdminDashboardが表示されます
const ADMIN_EMAIL = "t-irie@gakushiki.jp"; // ← ここを変更してください

/* --- プラン制限定数 --- */
const IS_PRO_PLAN = false; // 仮の定数

/* --- 1. 初期データ定義 --- */
const templateEsthetic = [
  { id: 1, type: "image", src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "本来の美しさを、\n取り戻す。", subtitle: "Winter Campaign 2025", color: "#ffffff", align: "center" } },
  { id: 2, type: "image", src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db48e?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "肌のハリ不足、\n気になりませんか？", subtitle: "原因は「深層乾燥」かも。", color: "#ffffff", align: "left" } },
  { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回限定体験\n¥3,980", subtitle: "", color: "#ffffff", align: "center", buttonText: "今すぐ予約する" } }
];

const templateClinic = [
  { id: 1, type: "image", src: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "長年の腰痛、\nあきらめていませんか？", subtitle: "根本改善専門の整体院", color: "#ffffff", align: "center" } },
  { id: 2, type: "image", src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "マッサージに行っても\nすぐ戻ってしまう...", subtitle: "それは「骨盤の歪み」が原因です。", color: "#ffffff", align: "left" } },
  { id: 3, type: "cta", src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=1000&auto=format&fit=crop", history: [], overlay: { title: "初回カウンセリング\n無料", subtitle: "1日3名様限定", color: "#ffffff", align: "center", buttonText: "空き状況を確認" } }
];

const initialFormConfig = {
  title: "無料カウンセリング予約",
  fields: [
    { id: 'name', type: 'text', label: 'お名前', required: true },
    { id: 'tel', type: 'tel', label: '電話番号', required: true },
    { id: 'date', type: 'datetime-local', label: '希望日時', required: true },
    { id: 'memo', type: 'textarea', label: '備考', required: false }
  ]
};

const initialSiteConfig = {
  seo: { title: "My Swipe LP", description: "スマホで快適なスワイプ体験を。", keywords: "", ogpImage: "" },
  sns: { instagram: "", line: "" },
  tags: { gtm: "" },
  globalNav: [{ label: "Top", url: "#" }, { label: "Contact", url: "#form" }]
};

export default function App() {
  /* --- 2. 認証・ステート管理 --- */
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectId, setProjectId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ログイン画面用のstate
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");

  const [slides, setSlides] = useState(templateEsthetic);
  const [siteConfig, setSiteConfig] = useState(initialSiteConfig);
  const [formConfig, setFormConfig] = useState(initialFormConfig);
  const [leads, setLeads] = useState([]);

  // ビュー切り替え（ダッシュボード/エディタ）
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'editor'
  const [selectedProject, setSelectedProject] = useState(null);
  const [dashboardSidebarMenu, setDashboardSidebarMenu] = useState('home');

  // UI状態
  const [activeMenu, setActiveMenu] = useState('slides'); // slides | design | parts | settings
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [formStep, setFormStep] = useState('input');
  
  // モバイル対応
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  
  // サイドバー状態（削除: 折りたたみ機能を無効化）
  // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // AI生成用
  const [prompt, setPrompt] = useState("luxury spa, clean, bright, 8k");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // AIチャット用
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // プラン管理
  const [currentPlan, setCurrentPlan] = useState('take'); 
  const PLAN_LIMITS = { ume: 2, take: 5, matsu: 99 };

  // 管理者モード（切り替え可能）
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminProjects, setAdminProjects] = useState([]);
  const [selectedAdminProject, setSelectedAdminProject] = useState(null);
  const [adminView, setAdminView] = useState('projects');
  const [adminLoading, setAdminLoading] = useState(false);

  // 管理者/ユーザー画面の切り替え関数
  const handleSwitchToUserView = () => {
    setIsAdminMode(false);
    setCurrentView('dashboard');
  };

  const handleSwitchToAdminView = () => {
    setIsAdminMode(true);
    setCurrentView('dashboard');
  };

  // フローティング予約ボタン
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  // 新機能: フローティングCTA
  const [floatingCta, setFloatingCta] = useState({
    enabled: false,
    text: "",
    url: ""
  });

  // 新機能: Microsoft Clarity
  const [clarityProjectId, setClarityProjectId] = useState("");

  // 新機能: Google Tag Manager
  const [gtmId, setGtmId] = useState("");

  // 新機能: 独自ドメイン
  const [customDomain, setCustomDomain] = useState("");

  const swiperRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  /* --- 認証処理 --- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
      // ログイン後はダッシュボードを表示（エディタは自動読み込みしない）
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // ADMIN_EMAILでログインした場合、デフォルトで管理者モードにする
      if (session?.user?.email === ADMIN_EMAIL) {
        setIsAdminMode(true);
        loadAdminProjects();
      } else {
        setIsAdminMode(false);
      }
      if (session?.user) {
        // ログイン後はダッシュボードを表示
        setCurrentView('dashboard');
      } else {
        setProjectId(null);
        setSlides(templateEsthetic);
        setSiteConfig(initialSiteConfig);
        setFormConfig(initialFormConfig);
        setLeads([]);
        setCurrentView('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 管理者モード：全プロジェクト読み込み
  const loadAdminProjects = async () => {
    setAdminLoading(true);
    try {
      const { data, error } = await getAllProjects();
      if (error) throw error;
      setAdminProjects(data || []);
    } catch (err) {
      console.error("管理者プロジェクト読み込みエラー:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  // 管理者モード：プロジェクト選択
  const selectAdminProject = (project) => {
    setSelectedAdminProject(project);
    if (project && project.content) {
      setSlides(project.content.slides || templateEsthetic);
      setSiteConfig(project.content.siteConfig || initialSiteConfig);
      setFormConfig(project.content.formConfig || initialFormConfig);
      setLeads(project.content.leads || []);
      setAdminView('preview');
    }
  };

  // プロジェクトデータの読み込み（エディタ用）
  const loadProjectData = async (userId, projectIdToLoad = null) => {
    try {
      let query = supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (projectIdToLoad) {
        query = query.eq("id", projectIdToLoad).single();
      } else {
        query = query.limit(1).single();
      }

      const { data, error } = await query;

      if (error && error.code !== "PGRST116") {
        console.error("プロジェクト読み込みエラー:", error);
        if (!projectIdToLoad) {
          await createNewProject(userId);
        }
        return;
      }

      if (data && data.content) {
        setProjectId(data.id);
        setSlides(data.content.slides || templateEsthetic);
        setSiteConfig(data.content.siteConfig || initialSiteConfig);
        setFormConfig(data.content.formConfig || initialFormConfig);
        setLeads(data.content.leads || []);
        // 新機能のデータ読み込み
        setFloatingCta(data.content.floatingCta || { enabled: false, text: "", url: "" });
        setClarityProjectId(data.content.clarityProjectId || "");
        setGtmId(data.content.gtmId || "");
        setCustomDomain(data.content.customDomain || "");
      } else if (!projectIdToLoad) {
        await createNewProject(userId);
      }
    } catch (err) {
      console.error("プロジェクト読み込みエラー:", err);
      if (!projectIdToLoad) {
        await createNewProject(userId);
      }
    }
  };

  // 新規プロジェクト作成
  const createNewProject = async (userId) => {
    try {
      const content = {
        slides: templateEsthetic,
        siteConfig: initialSiteConfig,
        formConfig: initialFormConfig,
        leads: [],
        floatingCta: { enabled: false, text: "", url: "" },
        clarityProjectId: "",
        gtmId: "",
        customDomain: ""
      };
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setProjectId(data.id);
        setSlides(content.slides);
        setSiteConfig(content.siteConfig);
        setFormConfig(content.formConfig);
        setLeads(content.leads);
        setFloatingCta(content.floatingCta);
        setClarityProjectId(content.clarityProjectId);
        setGtmId(content.gtmId);
        setCustomDomain(content.customDomain);
      }
    } catch (err) {
      console.error("新規プロジェクト作成エラー:", err);
    }
  };

  // ログイン処理
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
    } catch (error) {
      setAuthError(error.message || "ログインに失敗しました");
    }
  };

  // サインアップ処理
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) throw error;
      setAuthError("確認メールを送信しました。メールを確認してログインしてください。");
    } catch (error) {
      setAuthError(error.message || "登録に失敗しました");
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('dashboard');
    setSelectedProject(null);
  };

  // プロジェクト選択（ダッシュボードからエディタへ）
  const handleSelectProject = async (project, previewOnly = false) => {
    if (previewOnly) {
      // プレビューモードは今後実装
      return;
    }
    
    setSelectedProject(project);
    if (project && project.content) {
      setProjectId(project.id);
      setSlides(project.content.slides || templateEsthetic);
      setSiteConfig(project.content.siteConfig || initialSiteConfig);
      setFormConfig(project.content.formConfig || initialFormConfig);
      setLeads(project.content.leads || []);
      setFloatingCta(project.content.floatingCta || { enabled: false, text: "", url: "" });
      setClarityProjectId(project.content.clarityProjectId || "");
      setGtmId(project.content.gtmId || "");
      setCustomDomain(project.content.customDomain || "");
    }
    setCurrentView('editor');
  };

  // 新規プロジェクト作成
  const handleCreateProject = async (template = null) => {
    if (!user) return;
    
    try {
      let slidesToUse = templateEsthetic;
      let siteConfigToUse = initialSiteConfig;
      
      // テンプレートが指定されている場合
      if (template && template.slides) {
        // テンプレートのスライドを変換
        slidesToUse = template.slides.map(slide => ({
          id: slide.id,
          type: slide.type || 'text',
          name: slide.name || '',
          bgColor: slide.bgColor || '#FFFFFF',
          src: slide.content.backgroundImage || '',
          headline: slide.content.headline || '',
          subheadline: slide.content.subheadline || '',
          description: slide.content.description || '',
          ctaText: slide.content.ctaButton?.text || slide.content.ctaButtons?.[0]?.text || '',
          ctaLink: slide.content.ctaButton?.link || slide.content.ctaButtons?.[0]?.link || '',
          // テンプレート固有のコンテンツを保持
          templateContent: slide.content
        }));
        
        // テンプレートのスタイル設定を適用
        if (template.style) {
          siteConfigToUse = {
            ...initialSiteConfig,
            seo: {
              ...initialSiteConfig.seo,
              title: template.businessInfo?.name || initialSiteConfig.seo.title
            }
          };
        }
      }

      const content = {
        slides: slidesToUse,
        siteConfig: siteConfigToUse,
        formConfig: initialFormConfig,
        leads: [],
        floatingCta: { enabled: false, text: "", url: "" },
        clarityProjectId: "",
        gtmId: "",
        customDomain: "",
        templateId: template?.id || null,
        templateStyle: template?.style || null,
        businessInfo: template?.businessInfo || null
      };
      
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        await handleSelectProject(data);
      }
    } catch (err) {
      console.error("新規プロジェクト作成エラー:", err);
      alert("プロジェクトの作成に失敗しました");
    }
  };

  // ダッシュボードへ戻る
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedProject(null);
  };

  // AI編集を適用
  const handleAIEdit = (edits) => {
    try {
      // 現在のプロジェクトデータ
      const currentProjectData = {
        businessInfo: {
          name: siteConfig?.seo?.title || '',
          phone: '',
          address: '',
          businessHours: '',
          closedDays: '',
          access: '',
          lineUrl: ''
        },
        slides: slides,
        siteConfig: siteConfig
      };

      // 編集を適用
      const updatedData = applyEdits(currentProjectData, edits);

      // 状態を更新
      if (updatedData.businessInfo) {
        // ビジネス情報の更新
        if (updatedData.businessInfo.name && updatedData.businessInfo.name !== siteConfig?.seo?.title) {
          setSiteConfig(prev => ({
            ...prev,
            seo: {
              ...prev.seo,
              title: updatedData.businessInfo.name
            }
          }));
        }
      }

      if (updatedData.slides) {
        setSlides(updatedData.slides);
      }

      if (updatedData.siteConfig) {
        setSiteConfig(updatedData.siteConfig);
      }

      // 自動保存
      setTimeout(() => {
        saveToSupabase();
      }, 500);
    } catch (error) {
      console.error('AI編集適用エラー:', error);
      alert('編集の適用に失敗しました');
    }
  };

  // 公開処理
  const handlePublish = async () => {
    if (!projectId || !user) {
      alert("プロジェクトを選択してください");
      return;
    }

    // 確認ダイアログを表示
    const confirmModal = document.createElement('div');
    confirmModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    const confirmContent = document.createElement('div');
    confirmContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 450px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    confirmContent.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #1F2937;">
        LPを公開しますか？
      </h2>
      <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 15px; line-height: 1.6;">
        公開すると、URLを知っている人は誰でもこのLPを閲覧できるようになります。
      </p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button 
          id="cancel-publish-btn"
          style="
            padding: 12px 24px;
            background: #F3F4F6;
            color: #374151;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
          "
        >
          キャンセル
        </button>
        <button 
          id="confirm-publish-btn"
          style="
            padding: 12px 24px;
            background: #3B82F6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
          "
        >
          公開する
        </button>
      </div>
    `;

    confirmModal.appendChild(confirmContent);
    document.body.appendChild(confirmModal);

    // イベントリスナー
    const cancelBtn = confirmContent.querySelector('#cancel-publish-btn');
    const confirmBtn = confirmContent.querySelector('#confirm-publish-btn');

    const closeConfirmModal = () => {
      document.body.removeChild(confirmModal);
    };

    cancelBtn.onclick = closeConfirmModal;
    confirmModal.onclick = (e) => {
      if (e.target === confirmModal) closeConfirmModal();
    };

    // 「公開する」ボタンのクリック処理
    confirmBtn.onclick = async () => {
      closeConfirmModal();

      try {
        // プロジェクトのstatusを'published'に更新
        const { error } = await supabase
          .from("projects")
          .update({ status: 'published' })
          .eq("id", projectId)
          .eq("user_id", user.id);

        if (error) throw error;

        // 公開URLを生成
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://lp.rizbell.jp' 
          : 'http://localhost:3000';
        const publicUrl = `${baseUrl}/lp/${projectId}`;

        // モーダルで公開URLを表示
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        modalContent.innerHTML = `
          <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1F2937;">
            公開完了
          </h2>
          <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
            公開URL:
          </p>
          <div style="display: flex; gap: 8px; margin-bottom: 24px;">
            <input 
              type="text" 
              value="${publicUrl}" 
              readonly 
              id="public-url-input"
              style="
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #E5E7EB;
                border-radius: 8px;
                font-size: 14px;
                background: #F9FAFB;
                color: #1F2937;
              "
            />
            <button 
              id="copy-url-btn"
              style="
                padding: 12px 24px;
                background: #3B82F6;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
              "
            >
              コピー
            </button>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button 
              id="open-url-btn"
              style="
                padding: 12px 24px;
                background: #10B981;
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
              "
            >
              新しいタブで開く
            </button>
            <button 
              id="close-modal-btn"
              style="
                padding: 12px 24px;
                background: #F3F4F6;
                color: #374151;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
              "
            >
              閉じる
            </button>
          </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // イベントリスナー
        const copyBtn = modalContent.querySelector('#copy-url-btn');
        const openBtn = modalContent.querySelector('#open-url-btn');
        const closeBtn = modalContent.querySelector('#close-modal-btn');
        const urlInput = modalContent.querySelector('#public-url-input');

        copyBtn.onclick = () => {
          urlInput.select();
          document.execCommand('copy');
          copyBtn.textContent = 'コピーしました！';
          copyBtn.style.background = '#10B981';
          setTimeout(() => {
            copyBtn.textContent = 'コピー';
            copyBtn.style.background = '#3B82F6';
          }, 2000);
        };

        openBtn.onclick = () => {
          window.open(publicUrl, '_blank');
        };

        const closeModal = () => {
          document.body.removeChild(modal);
        };

        closeBtn.onclick = closeModal;
        modal.onclick = (e) => {
          if (e.target === modal) closeModal();
        };
      } catch (error) {
        console.error("公開エラー:", error);
        alert("公開に失敗しました: " + (error.message || "不明なエラー"));
      }
    };
  };

  // モバイル検出
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsBottomSheetOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Supabaseへの自動保存（debounce付き）
  const saveToSupabase = useCallback(async () => {
    if (!user || !projectId) return;

    setIsSaving(true);
    try {
      const content = {
        slides,
        siteConfig,
        formConfig,
        leads,
        floatingCta,
        clarityProjectId,
        gtmId,
        customDomain
      };

      const { error } = await supabase
        .from("projects")
        .update({ content })
        .eq("id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("保存エラー:", error);
      try {
        const content = {
          slides,
          siteConfig,
          formConfig,
          leads,
          floatingCta,
          clarityProjectId,
          customDomain
        };
        const { data, error: insertError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            content,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) setProjectId(data.id);
      } catch (insertErr) {
        console.error("新規作成エラー:", insertErr);
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, projectId, slides, siteConfig, formConfig, leads, floatingCta, clarityProjectId, gtmId, customDomain]);

  // データが変更されたら自動保存（debounce: 1秒）
  useEffect(() => {
    if (!user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToSupabase();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [slides, siteConfig, formConfig, leads, floatingCta, clarityProjectId, gtmId, customDomain, user, saveToSupabase]);

  /* --- 3. ルーティング設定 --- */
  // 公開LPページの場合は認証チェックをスキップしてPublicLPを表示
  const location = useLocation();
  if (location.pathname.startsWith('/lp/')) {
    return (
      <Routes>
        <Route path="/lp/:projectId" element={<PublicLP />} />
      </Routes>
    );
  }

  /* --- 4. ロジック --- */

  // スライド更新ヘルパー
  const updateSlide = (path, value) => {
    setSlides(prevSlides => prevSlides.map((s, i) => {
      if (i !== activeIndex) return s;
      const newSlide = { ...s };
      const keys = path.split('.');
      let target = newSlide;
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]] = { ...target[keys[i]] };
      }
      target[keys[keys.length - 1]] = value;
      return newSlide;
    }));
  };

  // 画像変更共通処理（履歴保存ロジック）
  const updateSlideImage = (index, newSrc, newType = 'image') => {
    setSlides(prevSlides => prevSlides.map((s, i) => {
      if (i !== index) return s;
      const limit = PLAN_LIMITS[currentPlan];
      const newHistory = [{ type: s.type, src: s.src, date: new Date().toLocaleString() }, ...s.history].slice(0, limit);
      return { ...s, type: newType, src: newSrc, history: newHistory };
    }));
  };

  // メディア操作
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    updateSlideImage(activeIndex, url, type);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      alert("プロンプトを入力してください");
      return;
    }
    setIsGenerating(true);
    try {
      const seed = Math.floor(Math.random() * 100000);
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1080&height=1920&nologo=true&enhance=true`;
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          updateSlideImage(activeIndex, url, 'image');
          setIsGenerating(false);
          resolve();
        };
        img.onerror = () => {
          const retryUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed + 1000}&width=1080&height=1920&nologo=true`;
          const retryImg = new Image();
          retryImg.crossOrigin = "anonymous";
          retryImg.onload = () => {
            updateSlideImage(activeIndex, retryUrl, 'image');
            setIsGenerating(false);
            resolve();
          };
          retryImg.onerror = () => {
            setIsGenerating(false);
            alert("画像生成に失敗しました。プロンプトを変更してお試しください。");
            reject();
          };
          retryImg.src = retryUrl;
        };
        img.src = url;
      });
    } catch (error) {
      console.error("画像生成エラー:", error);
      setIsGenerating(false);
      alert("画像生成に失敗しました。");
    }
  };

  const restoreFromHistory = (h) => { 
    updateSlideImage(activeIndex, h.src, h.type); 
  };

  // スライド操作
  const addSlide = () => { 
    setSlides([...slides, { 
      id: Date.now(), 
      type: "image", 
      src: "https://via.placeholder.com/1080x1920/333/fff?text=New+Slide", 
      history: [], 
      overlay: { title: "New Slide", subtitle: "", color: "#fff", align: "center" } 
    }]); 
  };
  
  const deleteSlide = () => { 
    if (slides.length > 1 && window.confirm("削除しますか？")) { 
      setSlides(slides.filter((_, i) => i !== activeIndex)); 
      if (activeIndex > 0) setActiveIndex(activeIndex - 1); 
    } 
  };

  // フォーム送信 & CSV
  const submitForm = (e) => {
    e.preventDefault();
    const formattedData = {};
    formConfig.fields.forEach(field => {
      const val = formData[field.label];
      formattedData[field.label] = Array.isArray(val) ? val.join(", ") : val;
    });
    setLeads([{ id: Date.now(), date: new Date().toLocaleString(), data: formattedData }, ...leads]);
    setFormData({});
    setFormStep('success');
  };

  const downloadCSV = () => {
    if (leads.length === 0) return alert("データがありません");
    const headers = new Set(["ID", "日時"]);
    leads.forEach(l => Object.keys(l.data || {}).forEach(k => headers.add(k)));
    const headerArr = Array.from(headers);
    const rows = [headerArr.join(",")];
    leads.forEach(l => {
      const row = headerArr.map(h => {
        if (h === "ID") return l.id;
        if (h === "日時") return l.date;
        return `"${String(l.data?.[h] || "").replace(/"/g, '""')}"`;
      });
      rows.push(row.join(","));
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; 
    a.download = "leads.csv"; 
    a.click();
  };

  /* --- 4. レンダリング --- */
  // ローディング中
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>読み込み中...</div>
      </div>
    );
  }

  // ログイン画面
  if (!user) {
    return (
      <Login
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        authError={authError}
        setAuthError={setAuthError}
        handleLogin={handleLogin}
        handleSignUp={handleSignUp}
      />
    );
  }

  // 管理者ダッシュボード（スーパー管理者）
  if (isAdminMode && currentView === 'dashboard') {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        onSwitchToUserView={handleSwitchToUserView}
      />
    );
  }

  // ダッシュボードビュー（一般ユーザー、または管理者がユーザー画面に切り替えた場合）
  if (currentView === 'dashboard' && !isAdminMode) {
    const isAdminUser = user?.email === ADMIN_EMAIL;
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        activeSidebarMenu={dashboardSidebarMenu}
        setActiveSidebarMenu={setDashboardSidebarMenu}
        isAdmin={isAdminUser}
        onSwitchToAdminView={isAdminUser ? handleSwitchToAdminView : undefined}
      />
    );
  }

  // 管理者モード（旧実装 - 今後削除予定）
  if (isAdminMode && adminView !== 'preview' && currentView !== 'dashboard') {
    return (
      <div className="admin-dashboard">
        <div className="admin-header">
          <h2>🔐 管理者ダッシュボード</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`admin-tab-btn ${adminView === 'projects' ? 'active' : ''}`}
              onClick={() => setAdminView('projects')}
            >
              プロジェクト一覧
            </button>
            <button 
              className={`admin-tab-btn ${adminView === 'leads' ? 'active' : ''}`}
              onClick={() => setAdminView('leads')}
            >
              リード一覧
            </button>
            <button 
              className="admin-tab-btn"
              onClick={() => {
                setIsAdminMode(false);
                setSelectedAdminProject(null);
                setAdminView('projects');
              }}
            >
              通常モードに戻る
            </button>
          </div>
        </div>
        <div className="admin-content">
          {adminView === 'projects' && (
            <div className="admin-projects-list">
              {adminLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>
              ) : adminProjects.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>プロジェクトがありません</div>
              ) : (
                adminProjects.map((project) => (
                  <div key={project.id} className="admin-project-card">
                    <div className="admin-project-header">
                      <div>
                        <strong>ID: {project.id}</strong>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          ユーザーID: {project.user_id?.substring(0, 8)}...
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          作成日: {new Date(project.created_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                      <button
                        className="admin-view-btn"
                        onClick={() => selectAdminProject(project)}
                      >
                        プレビュー
                      </button>
                    </div>
                    {project.content && project.content.slides && (
                      <div className="admin-project-preview">
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          スライド数: {project.content.slides.length}
                        </div>
                        <div className="admin-slide-thumbs">
                          {project.content.slides.slice(0, 3).map((slide, idx) => (
                            <div key={idx} className="admin-slide-thumb">
                              {slide.type === 'video' ? (
                                <div style={{ background: '#333', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>VIDEO</div>
                              ) : (
                                <img src={slide.src} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {adminView === 'leads' && (
            <div className="admin-leads-list">
              {adminProjects.map((project) => {
                const leads = project.content?.leads || [];
                if (leads.length === 0) return null;
                return (
                  <div key={project.id} className="admin-lead-section">
                    <h3>プロジェクト ID: {project.id}</h3>
                    {leads.map((lead) => (
                      <div key={lead.id} className="admin-lead-card">
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          {lead.date}
                        </div>
                        {lead.data && Object.entries(lead.data).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: '4px' }}>
                            <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // モバイルビュー: プレビューファースト
  if (isMobile) {
    return (
      <div className="app-wrapper mobile-mode">
        {/* プレビュー画面 */}
        <div className="mobile-preview-container">
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Canvas
              slides={slides}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              siteConfig={siteConfig}
              formConfig={formConfig}
              isFormOpen={isFormOpen}
              setIsFormOpen={setIsFormOpen}
              formStep={formStep}
              setFormStep={setFormStep}
              formData={formData}
              setFormData={setFormData}
              submitForm={submitForm}
              showFloatingButton={showFloatingButton}
              floatingCta={floatingCta}
              clarityProjectId={clarityProjectId}
              swiperRef={swiperRef}
              projectId={projectId}
            />
            
            {/* 編集FAB */}
            <button 
              className="mobile-edit-fab"
              onClick={() => setIsBottomSheetOpen(true)}
            >
              🖊️ 編集
            </button>
          </div>
        </div>

        {/* ボトムシート */}
        <BottomSheet 
          isOpen={isBottomSheetOpen} 
          onClose={() => setIsBottomSheetOpen(false)}
        >
          <PropertyPanel
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            slides={slides}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            siteConfig={siteConfig}
            setSiteConfig={setSiteConfig}
            formConfig={formConfig}
            setFormConfig={setFormConfig}
            updateSlide={updateSlide}
            addSlide={addSlide}
            deleteSlide={deleteSlide}
            fileInputRef={fileInputRef}
            handleMediaUpload={handleMediaUpload}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateImage={handleGenerateImage}
            isGenerating={isGenerating}
            restoreFromHistory={restoreFromHistory}
            PLAN_LIMITS={PLAN_LIMITS}
            currentPlan={currentPlan}
            showFloatingButton={showFloatingButton}
            setShowFloatingButton={setShowFloatingButton}
            floatingCta={floatingCta}
            setFloatingCta={setFloatingCta}
            clarityProjectId={clarityProjectId}
            setClarityProjectId={setClarityProjectId}
            gtmId={gtmId}
            setGtmId={setGtmId}
            customDomain={customDomain}
            setCustomDomain={setCustomDomain}
            IS_PRO_PLAN={IS_PRO_PLAN}
            swiperRef={swiperRef}
          />
        </BottomSheet>
        
        {/* AIチャット */}
        <AIChat
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          onApplyEdit={handleAIEdit}
          currentData={{
            businessInfo: {
              name: siteConfig?.seo?.title || '',
              phone: '',
              address: ''
            },
            slides: slides,
            siteConfig: siteConfig
          }}
        />
      </div>
    );
  }

  // エディタビュー（PC）
  if (currentView === 'editor' && !isMobile) {
    return (
      <div className="app-wrapper desktop-mode editor-mode">
        {/* エディタヘッダー */}
        <EditorHeader
          onBack={handleBackToDashboard}
          isSaving={isSaving}
          onPublish={handlePublish}
          projectTitle={siteConfig?.seo?.title}
        />
        
        {/* AIチャットボタン（フローティング） */}
        <button 
          className="ai-chat-floating-button"
          onClick={() => setIsAIChatOpen(true)}
          title="AI編集アシスタント"
        >
          <span className="ai-icon">✨</span>
          <span className="ai-label">AI編集</span>
        </button>
        
        {/* AIチャット */}
        <AIChat
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          onApplyEdit={handleAIEdit}
          currentData={{
            businessInfo: {
              name: siteConfig?.seo?.title || '',
              phone: '',
              address: ''
            },
            slides: slides,
            siteConfig: siteConfig
          }}
        />

        <div className="editor-content-wrapper">
          {/* 左サイドバー */}
          <Sidebar
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          {/* 中央キャンバス */}
          <Canvas
            slides={slides}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            siteConfig={siteConfig}
            formConfig={formConfig}
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            formStep={formStep}
            setFormStep={setFormStep}
            formData={formData}
            setFormData={setFormData}
            submitForm={submitForm}
            showFloatingButton={showFloatingButton}
            floatingCta={floatingCta}
            clarityProjectId={clarityProjectId}
            swiperRef={swiperRef}
            projectId={projectId}
          />

          {/* 右プロパティパネル */}
          <PropertyPanel
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            slides={slides}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            siteConfig={siteConfig}
            setSiteConfig={setSiteConfig}
            formConfig={formConfig}
            setFormConfig={setFormConfig}
            updateSlide={updateSlide}
            addSlide={addSlide}
            deleteSlide={deleteSlide}
            fileInputRef={fileInputRef}
            handleMediaUpload={handleMediaUpload}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateImage={handleGenerateImage}
            isGenerating={isGenerating}
            restoreFromHistory={restoreFromHistory}
            PLAN_LIMITS={PLAN_LIMITS}
            currentPlan={currentPlan}
            showFloatingButton={showFloatingButton}
            setShowFloatingButton={setShowFloatingButton}
            floatingCta={floatingCta}
            setFloatingCta={setFloatingCta}
            clarityProjectId={clarityProjectId}
            setClarityProjectId={setClarityProjectId}
            gtmId={gtmId}
            setGtmId={setGtmId}
            customDomain={customDomain}
            setCustomDomain={setCustomDomain}
            IS_PRO_PLAN={IS_PRO_PLAN}
            swiperRef={swiperRef}
          />
        </div>
      </div>
    );
  }

  // エディタビュー（モバイル）
  if (currentView === 'editor' && isMobile) {
    return (
      <div className="app-wrapper mobile-mode">
        {/* プレビュー画面 */}
        <div className="mobile-preview-container">
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Canvas
              slides={slides}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              siteConfig={siteConfig}
              formConfig={formConfig}
              isFormOpen={isFormOpen}
              setIsFormOpen={setIsFormOpen}
              formStep={formStep}
              setFormStep={setFormStep}
              formData={formData}
              setFormData={setFormData}
              submitForm={submitForm}
              showFloatingButton={showFloatingButton}
              floatingCta={floatingCta}
              clarityProjectId={clarityProjectId}
              swiperRef={swiperRef}
              projectId={projectId}
            />
            
            {/* 編集FAB */}
            <button 
              className="mobile-edit-fab"
              onClick={() => setIsBottomSheetOpen(true)}
            >
              🖊️ 編集
            </button>
          </div>
        </div>

        {/* ボトムシート */}
        <BottomSheet 
          isOpen={isBottomSheetOpen} 
          onClose={() => setIsBottomSheetOpen(false)}
        >
          <PropertyPanel
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            slides={slides}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            siteConfig={siteConfig}
            setSiteConfig={setSiteConfig}
            formConfig={formConfig}
            setFormConfig={setFormConfig}
            updateSlide={updateSlide}
            addSlide={addSlide}
            deleteSlide={deleteSlide}
            fileInputRef={fileInputRef}
            handleMediaUpload={handleMediaUpload}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateImage={handleGenerateImage}
            isGenerating={isGenerating}
            restoreFromHistory={restoreFromHistory}
            PLAN_LIMITS={PLAN_LIMITS}
            currentPlan={currentPlan}
            showFloatingButton={showFloatingButton}
            setShowFloatingButton={setShowFloatingButton}
            floatingCta={floatingCta}
            setFloatingCta={setFloatingCta}
            clarityProjectId={clarityProjectId}
            setClarityProjectId={setClarityProjectId}
            gtmId={gtmId}
            setGtmId={setGtmId}
            customDomain={customDomain}
            setCustomDomain={setCustomDomain}
            IS_PRO_PLAN={IS_PRO_PLAN}
            swiperRef={swiperRef}
          />
        </BottomSheet>
      </div>
    );
  }

  return null;
}
