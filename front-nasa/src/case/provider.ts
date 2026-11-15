/** Vuelo Verde (Santiago del Estero), the drone service the app sends jobs to. Public business contact. */
export const VUELO_VERDE = {
  name: 'Vuelo Verde',
  whatsapp: ((import.meta.env.VITE_VUELO_VERDE_WHATSAPP as string | undefined) || '5493855832876').trim(), // +54 9 385 583-2876
  phoneLabel: '385 583 2876',
  email: 'vueloverdesgo@gmail.com',
  address: 'San Martín 608, Santiago del Estero',
  instagram: 'Vuelo Verde SGO',
} as const;

export function mailtoLink(subject: string, body: string): string {
  return `mailto:${VUELO_VERDE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
