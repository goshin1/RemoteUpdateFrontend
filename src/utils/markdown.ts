import MarkdownIt from 'markdown-it'

/**
 * 가이드 본문(마크다운) → HTML.
 * XSS 방지: html: false 로 본문 안의 HTML 태그(<script> 등)를 그대로 글자로 보여주고,
 * markdown-it 기본 링크 검사로 javascript: 같은 위험한 링크는 만들지 않는다.
 * 이 함수의 결과만 v-html 에 넣어야 한다.
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

// 링크는 새 탭으로 열고, 열린 페이지가 이 창을 조작하지 못하게 rel 지정
const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(source: string | null | undefined): string {
  return source ? md.render(source) : ''
}
