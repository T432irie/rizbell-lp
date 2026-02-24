/**
 * 治療院・整体院テンプレート
 */
const clinicTemplate = {
  id: 'clinic',
  name: '治療院・整体院',
  category: 'clinic',
  thumbnail: 'https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=400&auto=format&fit=crop',
  description: '整体院や治療院向けの信頼感のあるデザイン',
  slides: [
    {
      id: 1,
      type: "image",
      src: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "長年の腰痛、\nあきらめていませんか？",
        subtitle: "根本改善専門の整体院",
        color: "#ffffff",
        align: "center"
      }
    },
    {
      id: 2,
      type: "image",
      src: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "マッサージに行っても\nすぐ戻ってしまう...",
        subtitle: "それは「骨盤の歪み」が原因です。",
        color: "#ffffff",
        align: "left"
      }
    },
    {
      id: 3,
      type: "cta",
      src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "初回カウンセリング\n無料",
        subtitle: "1日3名様限定",
        color: "#ffffff",
        align: "center",
        buttonText: "空き状況を確認"
      }
    }
  ]
};

export default clinicTemplate;
