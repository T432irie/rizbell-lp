/**
 * エステ・美容サロンテンプレート
 */
const estheticTemplate = {
  id: 'esthetic',
  name: 'エステ・美容サロン',
  category: 'beauty',
  thumbnail: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=400&auto=format&fit=crop',
  description: 'エステサロンや美容院向けの洗練されたデザイン',
  slides: [
    {
      id: 1,
      type: "image",
      src: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "本来の美しさを、\n取り戻す。",
        subtitle: "Winter Campaign 2025",
        color: "#ffffff",
        align: "center"
      }
    },
    {
      id: 2,
      type: "image",
      src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db48e?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "肌のハリ不足、\n気になりませんか？",
        subtitle: "原因は「深層乾燥」かも。",
        color: "#ffffff",
        align: "left"
      }
    },
    {
      id: 3,
      type: "cta",
      src: "https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=1000&auto=format&fit=crop",
      history: [],
      overlay: {
        title: "初回限定体験\n¥3,980",
        subtitle: "",
        color: "#ffffff",
        align: "center",
        buttonText: "今すぐ予約する"
      }
    }
  ]
};

export default estheticTemplate;
