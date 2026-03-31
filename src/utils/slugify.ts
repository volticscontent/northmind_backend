/**
 * Transforma uma string em um slug URL-friendly.
 * Exemplo: "The North Mind Jacket" -> "the-north-mind-jacket"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .replace(/\s+/g, '-') // Substitui espaços por hifens
    .replace(/[^\w-]+/g, '') // Remove caracteres não alfanuméricos exceto hifens
    .replace(/--+/g, '-') // Remove múltiplos hifens consecutivos
    .replace(/^-+/, '') // Remove hifens no início
    .replace(/-+$/, ''); // Remove hifens no final
}
