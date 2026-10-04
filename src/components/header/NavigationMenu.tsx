import type { MouseEvent } from 'react';
import Link from 'next/link';
import type { NavItem } from '@/config/navigation';

/** One menu presentation for the landing and product; destinations retain their own semantics. */
export function NavigationMenu({ items, mobile = false, id, isActive, onNavigate }: {
  items: NavItem[];
  mobile?: boolean;
  id?: string;
  isActive: (item: NavItem) => boolean;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
}) {
  return <nav id={id} aria-label={mobile ? 'Điều hướng di động' : 'Điều hướng chính'}
    className={`nexora-navigation-menu ${mobile ? 'nexora-navigation-menu-mobile lg:hidden' : 'hidden lg:flex'}`}>
    {items.map(item => <Link key={item.label} href={item.href}
      onClick={event => onNavigate?.(event, item)}
      aria-current={isActive(item) ? 'page' : undefined}
      className="nexora-navigation-item">{item.label}</Link>)}
  </nav>;
}
