export const myReviewsData = {
  path: '/mystarbucks/review',
  sort: {
    newest: { value: 'date-new', label: '投稿日の新しい順' },
    oldest: { value: 'date-old', label: '投稿日の古い順' },
  },
  heading: 'マイレビュー',
  deleteModal: {
    message: 'このレビューを削除しますか？',
    confirmText: 'はい',
    backText: '戻る',
  },
  emptyState: {
    message: '購入した商品はいかがでしたか。試してみた感想や、お気に入りの商品をあなた自身の言葉で表現してみませんか？',
    searchButtonText: '投稿する商品を探す',
  },
  header: {
    selector: 'header.globalNav',
    linkHrefPattern: /starbucks\.co\.jp\/\?nid=mm/,
  },
  footer: {
    selector: 'footer.footerWrap',
    faqText: 'よくあるご質問・お問い合わせ',
    faqHrefPattern: /starbucks\.co\.jp\/faq\/\?nid=ft/,
  },
  dateFormat: /^\d{4}\/\d{2}\/\d{2}$/,
  image: {
    urlPattern: /\/public\/sku_images\/[^/]+\/[^/]+_1\.jpg/,
  },
} as const;
