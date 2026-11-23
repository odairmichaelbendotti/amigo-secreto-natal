export interface WishlistSuggestion { title: string; link?: string }

export default function WishlistSuggestions({ items = [], name }: { items?: WishlistSuggestion[]; name: string }) {
  if (!items.length) return <p className="panel-copy wishlist-empty">Ainda não adicionou desejos.</p>;
  return <ul className="wish-suggestions" aria-label={`Desejos de ${name}`}>
    {items.map((item, index) => <li key={index}>
      <span>{item.title}</span>
      {item.link && /^https?:\/\//i.test(item.link) && <a href={item.link} target="_blank" rel="noopener noreferrer">Ver produto<span className="sr-only">: {item.title}</span></a>}
    </li>)}
  </ul>;
}
