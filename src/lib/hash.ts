/**
 * 본문 해시 — 동일 본문 재요청 차단(5.5)에 쓴다.
 * 암호학적 강도는 필요 없고, 짧은 텍스트(최대 3,000자)에서 충돌 없이
 * 동일/변경 여부만 구분하면 되므로 FNV-1a 32bit로 충분하다.
 * 서버(route handler)·클라이언트(재요청 판단) 양쪽에서 동일한 함수를 써야 하므로
 * Web Crypto가 아닌, 두 환경 모두에서 동기적으로 도는 순수 함수로 구현한다.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
