export const reviewData = {
  sort: {
    newest: { value: '', label: '投稿日の新しい順' },
    helpful: { value: 'helpful', label: '役に立ったの多い順' },
    ratingHigh: { value: 'rating_high', label: '星の数が多い順' },
    ratingLow: { value: 'rating_low', label: '星の数が少ない順' },
  },
  listPageTitle: '商品レビュー',
  noReviewText: 'この商品への最初のレビューを書いてみませんか？',
  postButtonText: 'レビューを投稿する',
  firstPostLinkText: '投稿する',
  formTitle: {
    create: 'レビュー投稿',
    edit: 'レビュー編集',
    confirm: 'レビュー内容確認',
    createComplete: 'レビュー投稿完了',
    editComplete: 'レビュー編集完了',
  },
  form: {
    valid: {
      title: 'テスト用タイトル',
      content: 'これはPlaywrightによる自動テスト用のレビュー本文です。テスト用のため実際の感想ではありません。',
    },
    invalid: {
      titleTooLong: 'あ'.repeat(51),
      contentTooShort: '短い',
      contentTooLong: 'あ'.repeat(401),
    },
  },
  dateFormat: /^\d{4}\/\d{2}\/\d{2}$/,
} as const;
