/**
 * 治療院・整体院向けLPテンプレート
 * 9スライド構成
 */

const clinicTemplate = {
  id: 'clinic-001',
  name: '治療院・整体院テンプレート',
  category: 'clinic',
  description: '整体院・治療院向けの予約獲得に特化したテンプレート',
  thumbnail: '/templates/clinic-thumb.jpg',
  
  // 編集可能な基本情報
  businessInfo: {
    name: '○○整体院',
    phone: '03-XXXX-XXXX',
    email: 'info@example.com',
    address: '東京都渋谷区○○1-2-3',
    businessHours: '9:00〜20:00（最終受付19:00）',
    closedDays: '日曜・祝日',
    access: '渋谷駅から徒歩5分',
    lineUrl: 'https://line.me/R/ti/p/@xxx',
  },
  
  // トンマナ設定
  style: {
    primaryColor: '#2E7D32',  // メインカラー（緑系）
    secondaryColor: '#81C784',
    accentColor: '#FF6B35',
    textColor: '#333333',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Noto Sans JP',
  },
  
  // スライド構成
  slides: [
    {
      id: 'slide-1',
      type: 'hero',
      name: 'ファーストビュー',
      bgColor: '#2E7D32',
      content: {
        headline: 'その痛み、諦めていませんか？',
        subheadline: '根本改善で痛みのない生活へ',
        description: '初回限定 2,980円',
        ctaButton: {
          text: '今すぐ予約する',
          link: 'tel:{{phone}}',
          style: 'primary'
        }
      }
    },
    {
      id: 'slide-2',
      type: 'problems',
      name: 'お悩み共感',
      bgColor: '#F5F5F5',
      content: {
        headline: 'こんなお悩みありませんか？',
        items: [
          '✗ 長年の腰痛が治らない',
          '✗ 肩こりがひどくて頭痛がする',
          '✗ 病院に行っても原因不明と言われた',
          '✗ マッサージに行っても翌日には戻る',
          '✗ 薬に頼りたくない'
        ]
      }
    },
    {
      id: 'slide-3',
      type: 'cause',
      name: '原因説明',
      bgColor: '#FFFFFF',
      content: {
        headline: 'その痛みの本当の原因',
        description: '多くの方が痛みの「結果」だけを治療しています。当院では痛みの「原因」にアプローチします。',
        points: [
          '骨盤の歪み',
          '姿勢の崩れ',
          '筋肉のバランス'
        ]
      }
    },
    {
      id: 'slide-4',
      type: 'solution',
      name: '解決策',
      bgColor: '#81C784',
      content: {
        headline: '当院の施術で根本改善',
        description: '痛みの原因を特定し、一人ひとりに合わせたオーダーメイド施術を行います。',
        features: [
          '✓ 痛みの原因を徹底分析',
          '✓ 一人ひとりに合わせた施術',
          '✓ 再発しない体づくり'
        ]
      }
    },
    {
      id: 'slide-5',
      type: 'features',
      name: '3つの特徴',
      bgColor: '#FFFFFF',
      content: {
        headline: '選ばれる3つの理由',
        features: [
          {
            number: '01',
            title: '根本改善',
            description: '痛みの原因にアプローチ'
          },
          {
            number: '02',
            title: '国家資格保有',
            description: '確かな技術と知識'
          },
          {
            number: '03',
            title: '完全予約制',
            description: '待ち時間なし'
          }
        ]
      }
    },
    {
      id: 'slide-6',
      type: 'testimonials',
      name: 'お客様の声',
      bgColor: '#F5F5F5',
      content: {
        headline: '喜びの声をいただいています',
        testimonials: [
          {
            name: 'A.S様（40代女性）',
            text: '長年の腰痛が3回の施術で改善しました！整形外科に通っても良くならなかったのに、こちらの施術で嘘のように楽になりました。',
            rating: 5
          },
          {
            name: 'T.K様（50代男性）',
            text: 'デスクワークで慢性的な肩こりに悩んでいましたが、根本から改善していただけました。',
            rating: 5
          }
        ]
      }
    },
    {
      id: 'slide-7',
      type: 'pricing',
      name: '料金案内',
      bgColor: '#FFFFFF',
      content: {
        headline: '施術料金',
        prices: [
          { 
            name: '初回限定', 
            price: '2,980円', 
            originalPrice: '5,980円',
            note: '初回検査料込み'
          },
          { 
            name: '通常施術', 
            price: '5,980円', 
            note: '約60分'
          },
          { 
            name: '回数券（5回）', 
            price: '25,000円', 
            note: '1回あたり5,000円でお得'
          }
        ]
      }
    },
    {
      id: 'slide-8',
      type: 'access',
      name: 'アクセス',
      bgColor: '#F5F5F5',
      content: {
        headline: 'アクセス・営業時間',
        info: {
          name: '{{businessInfo.name}}',
          address: '{{businessInfo.address}}',
          access: '{{businessInfo.access}}',
          hours: '{{businessInfo.businessHours}}',
          closed: '{{businessInfo.closedDays}}',
          phone: '{{businessInfo.phone}}'
        }
      }
    },
    {
      id: 'slide-9',
      type: 'cta',
      name: 'ご予約',
      bgColor: '#2E7D32',
      content: {
        headline: 'ご予約・お問い合わせ',
        description: 'お電話またはLINEでお気軽にどうぞ',
        ctaButtons: [
          { 
            text: '📞 電話で予約', 
            link: 'tel:{{phone}}', 
            style: 'primary',
            bgColor: '#FF6B35'
          },
          { 
            text: '💬 LINEで予約', 
            link: '{{lineUrl}}', 
            style: 'secondary',
            bgColor: '#06C755'
          }
        ],
        note: '24時間以内に返信いたします'
      }
    }
  ]
};

export default clinicTemplate;

